'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/navigation';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import {
  createTeacherProfile,
  updateTeacherProfile,
  getTeacherProfile,
  addTeacherSubject,
  removeTeacherSubject,
  addTeacherAvailability,
  updateTeacherAvailability,
  removeTeacherAvailability,
} from '@/lib/db/teacher-queries';

// Teacher profile schema
const teacherProfileSchema = z.object({
  bio: z.string().min(10, 'Bio must be at least 10 characters').max(1000, 'Bio cannot exceed 1000 characters'),
  qualifications: z.string().min(10, 'Qualifications must be at least 10 characters').max(1000, 'Qualifications cannot exceed 1000 characters'),
  yearsOfExperience: z.number().min(0, 'Years of experience cannot be negative').max(100, 'Years of experience cannot exceed 100'),
  hourlyRate: z.number().min(1, 'Hourly rate must be at least $1').max(1000, 'Hourly rate cannot exceed $1000'),
  profilePicture: z.string().optional(),
  isAvailableForNewStudents: z.boolean().default(true),
});

// Create or update teacher profile
export const updateTeacherProfileAction = validatedActionWithUser(
  teacherProfileSchema,
  async (data, _, user) => {
    try {
      // Check if teacher profile exists
      const existingProfile = await getTeacherProfile(user.id);

      if (existingProfile) {
        // Update existing profile
        await updateTeacherProfile(existingProfile.id, {
          bio: data.bio,
          qualifications: data.qualifications,
          yearsOfExperience: data.yearsOfExperience,
          hourlyRate: data.hourlyRate * 100, // Convert to cents
          profilePicture: data.profilePicture,
          isAvailableForNewStudents: data.isAvailableForNewStudents,
        });
      } else {
        // Create new profile
        await createTeacherProfile({
          userId: user.id,
          bio: data.bio,
          qualifications: data.qualifications,
          yearsOfExperience: data.yearsOfExperience,
          hourlyRate: data.hourlyRate * 100, // Convert to cents
          profilePicture: data.profilePicture,
          isAvailableForNewStudents: data.isAvailableForNewStudents,
        });
      }

      revalidatePath('/dashboard/teacher/profile');
      return { success: 'Teacher profile updated successfully' };
    } catch (error) {
      console.error('Error updating teacher profile:', error);
      return { error: 'Failed to update teacher profile. Please try again.' };
    }
  }
);

// Subject management
const teacherSubjectSchema = z.object({
  subjectId: z.number().positive('Subject ID must be a positive number'),
});

export const addTeacherSubjectAction = validatedActionWithUser(
  teacherSubjectSchema,
  async (data, _, user) => {
    try {
      const teacherProfile = await getTeacherProfile(user.id);
      if (!teacherProfile) {
        return { error: 'Teacher profile not found. Please create a profile first.' };
      }

      await addTeacherSubject(teacherProfile.id, data.subjectId);
      revalidatePath('/dashboard/teacher/subjects');
      return { success: 'Subject added successfully' };
    } catch (error) {
      console.error('Error adding subject:', error);
      return { error: 'Failed to add subject. Please try again.' };
    }
  }
);

export const removeTeacherSubjectAction = validatedActionWithUser(
  teacherSubjectSchema,
  async (data, _, user) => {
    try {
      const teacherProfile = await getTeacherProfile(user.id);
      if (!teacherProfile) {
        return { error: 'Teacher profile not found' };
      }

      await removeTeacherSubject(teacherProfile.id, data.subjectId);
      revalidatePath('/dashboard/teacher/subjects');
      return { success: 'Subject removed successfully' };
    } catch (error) {
      console.error('Error removing subject:', error);
      return { error: 'Failed to remove subject. Please try again.' };
    }
  }
);

// Availability management
const availabilitySchema = z.object({
  dayOfWeek: z.number().min(0, 'Day must be between 0 and 6').max(6, 'Day must be between 0 and 6'),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in format HH:MM'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in format HH:MM'),
  isRecurring: z.boolean().default(true),
});

export const addAvailabilityAction = validatedActionWithUser(
  availabilitySchema,
  async (data, _, user) => {
    try {
      const teacherProfile = await getTeacherProfile(user.id);
      if (!teacherProfile) {
        return { error: 'Teacher profile not found. Please create a profile first.' };
      }

      // Validate start time is before end time
      const startParts = data.startTime.split(':').map(Number);
      const endParts = data.endTime.split(':').map(Number);
      const startMinutes = startParts[0] * 60 + startParts[1];
      const endMinutes = endParts[0] * 60 + endParts[1];

      if (startMinutes >= endMinutes) {
        return { error: 'Start time must be before end time' };
      }

      await addTeacherAvailability({
        teacherProfileId: teacherProfile.id,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isRecurring: data.isRecurring,
      });

      revalidatePath('/dashboard/teacher/availability');
      return { success: 'Availability added successfully' };
    } catch (error) {
      console.error('Error adding availability:', error);
      return { error: 'Failed to add availability. Please try again.' };
    }
  }
);

const updateAvailabilitySchema = availabilitySchema.extend({
  availabilityId: z.number().positive('Availability ID must be a positive number'),
});

export const updateAvailabilityAction = validatedActionWithUser(
  updateAvailabilitySchema,
  async (data, _, user) => {
    try {
      const teacherProfile = await getTeacherProfile(user.id);
      if (!teacherProfile) {
        return { error: 'Teacher profile not found' };
      }

      // Validate start time is before end time
      const startParts = data.startTime.split(':').map(Number);
      const endParts = data.endTime.split(':').map(Number);
      const startMinutes = startParts[0] * 60 + startParts[1];
      const endMinutes = endParts[0] * 60 + endParts[1];

      if (startMinutes >= endMinutes) {
        return { error: 'Start time must be before end time' };
      }

      await updateTeacherAvailability(data.availabilityId, {
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isRecurring: data.isRecurring,
      });

      revalidatePath('/dashboard/teacher/availability');
      return { success: 'Availability updated successfully' };
    } catch (error) {
      console.error('Error updating availability:', error);
      return { error: 'Failed to update availability. Please try again.' };
    }
  }
);

const deleteAvailabilitySchema = z.object({
  availabilityId: z.number().positive('Availability ID must be a positive number'),
});

export const deleteAvailabilityAction = validatedActionWithUser(
  deleteAvailabilitySchema,
  async (data, _, user) => {
    try {
      const teacherProfile = await getTeacherProfile(user.id);
      if (!teacherProfile) {
        return { error: 'Teacher profile not found' };
      }

      await removeTeacherAvailability(data.availabilityId);
      
      revalidatePath('/dashboard/teacher/availability');
      return { success: 'Availability removed successfully' };
    } catch (error) {
      console.error('Error removing availability:', error);
      return { error: 'Failed to remove availability. Please try again.' };
    }
  }
);

// Toggle availability for new students
const toggleAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export const toggleAvailabilityForStudentsAction = validatedActionWithUser(
  toggleAvailabilitySchema,
  async (data, _, user) => {
    try {
      const teacherProfile = await getTeacherProfile(user.id);
      if (!teacherProfile) {
        return { error: 'Teacher profile not found' };
      }

      await updateTeacherProfile(teacherProfile.id, {
        isAvailableForNewStudents: data.isAvailable,
      });

      revalidatePath('/dashboard/teacher');
      return { success: `You are now ${data.isAvailable ? 'available' : 'unavailable'} for new students` };
    } catch (error) {
      console.error('Error toggling availability:', error);
      return { error: 'Failed to update availability status. Please try again.' };
    }
  }
);
