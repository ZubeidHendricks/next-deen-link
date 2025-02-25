'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBookingAction } from '../actions';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// You would need to replace this with your actual publishable key from environment variables
const stripePromise = loadStripe('pk_test_your_publishable_key');

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teacherId = searchParams.get('teacherId');
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState('');
  const [bookingForm, setBookingForm] = useState({
    subjectId: '',
    date: '',
    startTime: '',
    endTime: '',
    notes: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeacherData = async () => {
      if (!teacherId) {
        router.push('/teachers');
        return;
      }

      try {
        const response = await fetch(`/api/teachers/${teacherId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch teacher profile');
        }

        const data = await response.json();
        setTeacherProfile(data.teacherProfile);
        setSubjects(data.subjects || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching teacher data:', err);
        setError('Failed to load teacher information. Please try again.');
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, [teacherId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookingForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!bookingForm.subjectId) {
      setError('Please select a subject');
      return;
    }

    if (!bookingForm.date || !bookingForm.startTime || !bookingForm.endTime) {
      setError('Please select date and time');
      return;
    }

    try {
      const startDateTime = new Date(`${bookingForm.date}T${bookingForm.startTime}`);
      const endDateTime = new Date(`${bookingForm.date}T${bookingForm.endTime}`);

      if (startDateTime >= endDateTime) {
        setError('Start time must be before end time');
        return;
      }

      const currentDate = new Date();
      if (startDateTime <= currentDate) {
        setError('Cannot book sessions in the past');
        return;
      }

      const result = await createBookingAction({
        teacherProfileId: parseInt(teacherId as string),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        subjectId: parseInt(bookingForm.subjectId),
        notes: bookingForm.notes,
      });

      if (result.error) {
        setError(result.error);
      } else {
        // If successful, the backend should return a client secret for Stripe
        if (result.clientSecret) {
          setClientSecret(result.clientSecret);
          // This would trigger showing the payment form in the UI
        } else {
          // If no payment is needed, or for development/testing
          router.push(`/dashboard/bookings/${result.bookingId}`);
        }
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      setError('Failed to create booking. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container py-8 mx-auto">
        <div className="max-w-2xl p-6 mx-auto bg-white rounded-lg shadow">
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-center">Loading teacher information...</p>
        </div>
      </div>
    );
  }

  // If clientSecret is set, show payment form
  if (clientSecret) {
    const options = {
      clientSecret,
      appearance: {
        theme: 'stripe',
      },
    };

    return (
      <div className="container py-8 mx-auto">
        <div className="max-w-2xl p-6 mx-auto bg-white rounded-lg shadow">
          <h1 className="mb-6 text-2xl font-bold">Complete Payment</h1>
          <Elements stripe={stripePromise} options={options as any}>
            {/* Implement your Stripe payment form component here */}
            <p>Payment form would be rendered here with Stripe Elements</p>
          </Elements>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 mx-auto">
      <div className="max-w-2xl p-6 mx-auto bg-white rounded-lg shadow">
        <h1 className="mb-6 text-2xl font-bold">Book a Session</h1>
        
        {error && (
          <div className="p-4 mb-6 text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}
        
        {teacherProfile && (
          <div className="flex items-center p-4 mb-6 border rounded-md">
            <div className="flex-shrink-0 mr-4">
              {teacherProfile.profilePicture ? (
                <img
                  src={teacherProfile.profilePicture}
                  alt={teacherProfile.name}
                  className="object-cover w-16 h-16 rounded-full"
                />
              ) : (
                <div className="flex items-center justify-center w-16 h-16 text-white bg-blue-500 rounded-full">
                  {teacherProfile.name?.charAt(0).toUpperCase() || 'T'}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{teacherProfile.name}</h2>
              <p className="text-gray-600">
                ${(teacherProfile.hourlyRate / 100).toFixed(2)}/hour
              </p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="subjectId" className="block mb-1 font-medium">
              Subject
            </label>
            <select
              id="subjectId"
              name="subjectId"
              value={bookingForm.subjectId}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="date" className="block mb-1 font-medium">
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={bookingForm.date}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="startTime" className="block mb-1 font-medium">
                Start Time
              </label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={bookingForm.startTime}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            
            <div>
              <label htmlFor="endTime" className="block mb-1 font-medium">
                End Time
              </label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={bookingForm.endTime}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="notes" className="block mb-1 font-medium">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={bookingForm.notes}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              rows={4}
              placeholder="Let the teacher know about your specific needs or questions"
            ></textarea>
          </div>
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Book & Pay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
