'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/navigation';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import {
  createBooking,
  updateBookingStatus,
  getBookingById,
  checkAvailabilityConflict,
  createReview,
  getBookingReview,
} from '@/lib/db/booking-queries';
import { getTeacherProfileWithDetails } from '@/lib/db/teacher-queries';
import { getUser } from '@/lib/db/queries';
import { createPaymentIntent, cancelPaymentIntent } from '@/lib/payments/booking-payments';

// Create booking schema
const createBookingSchema = z.object({
  teacherProfileId: z.number().positive('Teacher profile ID is required'),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start time format'),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end time format'),
  subjectId: z.number().positive('Subject ID is required'),
  notes: z.string().optional(),
});

export const createBookingAction = validatedActionWithUser(
  createBookingSchema,
  async (data, _, user) => {
    try {
      const startTime = new Date(data.startTime);
      const endTime = new Date(data.endTime);

      // Validate times
      if (startTime >= endTime) {
        return { error: 'Start time must be before end time' };
      }

      if (startTime < new Date()) {
        return { error: 'Cannot book a session in the past' };
      }

      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

      // Check if the teacher exists and is available for bookings
      const teacherProfile = await getTeacherProfileWithDetails(data.teacherProfileId);
      if (!teacherProfile) {
        return { error: 'Teacher profile not found' };
      }

      if (!teacherProfile.teacherProfile.isAvailableForNewStudents) {
        return { error: 'This teacher is not currently accepting new students' };
      }

      // Check for scheduling conflicts
      const hasConflict = await checkAvailabilityConflict(
        data.teacherProfileId,
        startTime,
        endTime
      );

      if (hasConflict) {
        return { error: 'This time slot is already booked. Please choose another time.' };
      }

      // Calculate price based on teacher's hourly rate
      const price = Math.round(teacherProfile.teacherProfile.hourlyRate * durationHours);

      // Create booking
      const booking = await createBooking({
        teacherProfileId: data.teacherProfileId,
        parentId: user.id,
        startTime,
        endTime,
        subjectId: data.subjectId,
        notes: data.notes || '',
        price,
        status: 'pending',
      });

      if (!booking) {
        return { error: 'Failed to create booking' };
      }

      // Create payment intent
      const paymentInfo = await createPaymentIntent(
        booking,
        user.email,
        teacherProfile.user.name,
        `Lesson with ${teacherProfile.user.name}`
      );

      revalidatePath('/dashboard/bookings');
      return { 
        success: 'Booking created successfully', 
        bookingId: booking.id,
        clientSecret: paymentInfo.clientSecret 
      };
    } catch (error) {
      console.error('Error creating booking:', error);
      return { error: 'Failed to create booking. Please try again.' };
    }
  }
);

// Update booking status schema
const updateBookingStatusSchema = z.object({
  bookingId: z.number().positive('Booking ID is required'),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
});

export const updateBookingStatusAction = validatedActionWithUser(
  updateBookingStatusSchema,
  async (data, _, user) => {
    try {
      const booking = await getBookingById(data.bookingId);
      if (!booking) {
        return { error: 'Booking not found' };
      }

      // Check if user has permission to update this booking
      const currentUser = await getUser();
      if (!currentUser) {
        return { error: 'User not found' };
      }

      const isTeacher = booking.teacher.id === currentUser.id;
      const isParent = booking.parent.id === currentUser.id;

      if (!isTeacher && !isParent) {
        return { error: 'You do not have permission to update this booking' };
      }

      // Different roles can perform different actions
      if (isTeacher) {
        if (data.status === 'cancelled' && booking.booking.status === 'confirmed') {
          // Teachers can cancel confirmed bookings, but may need to refund
          if (booking.booking.paymentStatus === 'paid') {
            // Logic for refunding payment would go here
            // For now, we'll just update the status
            await updateBookingStatus(data.bookingId, data.status);
            // In a real app, we would refund through Stripe
          } else {
            await updateBookingStatus(data.bookingId, data.status);
          }
        } else if (data.status === 'confirmed' && booking.booking.status === 'pending') {
          // Teachers can confirm pending bookings
          await updateBookingStatus(data.bookingId, data.status);
        } else if (data.status === 'completed' && booking.booking.status === 'confirmed') {
          // Teachers can mark confirmed bookings as completed
          const bookingEndTime = new Date(booking.booking.endTime);
          if (bookingEndTime > new Date()) {
            return { error: 'Cannot mark a booking as completed before its end time' };
          }
          await updateBookingStatus(data.bookingId, data.status);
        } else {
          return { error: 'Invalid status transition' };
        }
      } else if (isParent) {
        if (data.status === 'cancelled') {
          // Parents can cancel bookings
          // If already paid, handle refund based on cancellation policy
          if (booking.booking.paymentStatus === 'paid') {
            const bookingStartTime = new Date(booking.booking.startTime);
            const now = new Date();
            const hoursDifference = (bookingStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
            
            if (hoursDifference < 24) {
              // Less than 24 hours notice - no refund or partial refund
              // This would be handled through your refund policy
              return { error: 'Cancellations with less than 24 hours notice may not be eligible for refund' };
            }
            
            // For now, just update the status
            // In a real app, we would process the refund through Stripe
            await updateBookingStatus(data.bookingId, data.status);
            
            // Cancel the payment intent if it's still pending
            if (booking.booking.paymentStatus === 'pending' && booking.booking.stripePaymentIntentId) {
              await cancelPaymentIntent(booking.booking.stripePaymentIntentId);
            }
          } else {
            await updateBookingStatus(data.bookingId, data.status);
          }
        } else {
          return { error: 'Parents can only cancel bookings' };
        }
      }

      revalidatePath('/dashboard/bookings');
      return { success: `Booking ${data.status} successfully` };
    } catch (error) {
      console.error('Error updating booking status:', error);
      return { error: 'Failed to update booking status. Please try again.' };
    }
  }
);

// Create review schema
const createReviewSchema = z.object({
  bookingId: z.number().positive('Booking ID is required'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().min(3, 'Comment must be at least 3 characters').max(1000, 'Comment cannot exceed 1000 characters'),
});

export const createReviewAction = validatedActionWithUser(
  createReviewSchema,
  async (data, _, user) => {
    try {
      const booking = await getBookingById(data.bookingId);
      if (!booking) {
        return { error: 'Booking not found' };
      }

      // Check if user has permission to review this booking
      if (booking.parent.id !== user.id) {
        return { error: 'You can only review your own bookings' };
      }

      // Check if booking is completed
      if (booking.booking.status !== 'completed') {
        return { error: 'You can only review completed bookings' };
      }

      // Check if review already exists
      const existingReview = await getBookingReview(data.bookingId);
      if (existingReview) {
        return { error: 'You have already reviewed this booking' };
      }

      // Create review
      await createReview({
        bookingId: data.bookingId,
        fromUserId: user.id,
        toUserId: booking.teacher.id,
        rating: data.rating,
        comment: data.comment,
      });

      revalidatePath(`/dashboard/bookings/${data.bookingId}`);
      revalidatePath(`/teachers/${booking.booking.teacherProfileId}`);
      return { success: 'Review submitted successfully' };
    } catch (error) {
      console.error('Error creating review:', error);
      return { error: 'Failed to submit review. Please try again.' };
    }
  }
);
