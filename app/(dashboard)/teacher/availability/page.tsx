'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  addAvailabilityAction, 
  updateAvailabilityAction, 
  deleteAvailabilityAction 
} from '../actions';

export default function AvailabilityPage() {
  const router = useRouter();
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    dayOfWeek: 1, // Monday default
    startTime: '09:00',
    endTime: '17:00',
    isRecurring: true,
  });

  const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  // Fetch teacher availability
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const response = await fetch('/api/teacher/availability');
        if (response.ok) {
          const data = await response.json();
          setAvailability(data);
        } else {
          throw new Error('Failed to fetch availability');
        }
      } catch (err) {
        console.error('Error fetching availability:', err);
        setError('Failed to load availability information');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData((prev) => ({
        ...prev,
        [name]: target.checked,
      }));
    } else if (name === 'dayOfWeek') {
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const result = await addAvailabilityAction({
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        isRecurring: formData.isRecurring,
      });

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess(result.success);
        setIsAdding(false);
        
        // Refresh availability data
        const response = await fetch('/api/teacher/availability');
        if (response.ok) {
          const data = await response.json();
          setAvailability(data);
        }
        
        // Reset form
        setFormData({
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
          isRecurring: true,
        });
      }
    } catch (err) {
      console.error('Error adding availability:', err);
      setError('Failed to add availability. Please try again.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (editing === null) return;

    try {
      const result = await updateAvailabilityAction({
        availabilityId: editing,
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        isRecurring: formData.isRecurring,
      });

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess(result.success);
        setEditing(null);
        
        // Refresh availability data
        const response = await fetch('/api/teacher/availability');
        if (response.ok) {
          const data = await response.json();
          setAvailability(data);
        }
      }
    } catch (err) {
      console.error('Error updating availability:', err);
      setError('Failed to update availability. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this availability slot?')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const result = await deleteAvailabilityAction({
        availabilityId: id,
      });

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess(result.success);
        
        // Refresh availability data
        const response = await fetch('/api/teacher/availability');
        if (response.ok) {
          const data = await response.json();
          setAvailability(data);
        }
      }
    } catch (err) {
      console.error('Error deleting availability:', err);
      setError('Failed to delete availability. Please try again.');
    }
  };

  const startEdit = (slot: any) => {
    setFormData({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isRecurring: slot.isRecurring,
    });
    setEditing(slot.id);
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditing(null);
    setFormData({
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
      isRecurring: true,
    });
  };

  if (loading) {
    return (
      <div className="container py-8 mx-auto">
        <div className="max-w-2xl p-6 mx-auto bg-white rounded-lg shadow">
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-center">Loading availability information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 mx-auto">
      <div className="max-w-2xl p-6 mx-auto bg-white rounded-lg shadow">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Manage Availability</h1>
          {!isAdding && editing === null && (
            <button
              onClick={() => setIsAdding(true)}
              className="px-3 py-1 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Add New
            </button>
          )}
        </div>
        
        {error && (
          <div className="p-4 mb-6 text-red-700 bg-red-100 border border-red-400 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-4 mb-6 text-green-700 bg-green-100 border border-green-400 rounded">
            {success}
          </div>
        )}
        
        {/* Add/Edit Form */}
        {(isAdding || editing !== null) && (
          <div className="p-4 mb-6 border border-gray-200 rounded-lg">
            <h2 className="mb-4 text-lg font-semibold">
              {editing !== null ? 'Edit Availability' : 'Add New Availability'}
            </h2>
            
            <form onSubmit={editing !== null ? handleEditSubmit : handleAddSubmit}>
              <div className="mb-4">
                <label htmlFor="dayOfWeek" className="block mb-1 font-medium">
                  Day of Week
                </label>
                <select
                  id="dayOfWeek"
                  name="dayOfWeek"
                  value={formData.dayOfWeek}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  {daysOfWeek.map((day, index) => (
                    <option key={index} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
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
                    value={formData.startTime}
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
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    name="isRecurring"
                    checked={formData.isRecurring}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="isRecurring" className="ml-2 font-medium">
                    Recurring weekly
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={editing !== null ? cancelEdit : () => setIsAdding(false)}
                  className="px-3 py-1 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className="px-3 py-1 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {editing !== null ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Availability List */}
        <div className="mt-6">
          <h2 className="mb-4 text-lg font-semibold">Your Weekly Availability</h2>
          
          {availability.length > 0 ? (
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Day
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Time
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Recurring
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {availability.map((slot) => (
                    <tr key={slot.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {daysOfWeek[slot.dayOfWeek]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {slot.startTime} - {slot.endTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {slot.isRecurring ? 'Yes' : 'No'}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => startEdit(slot)}
                          className="mr-2 text-blue-600 hover:text-blue-900"
                          disabled={editing !== null}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(slot.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={editing !== null}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 text-center border border-gray-200 rounded-lg">
              <p className="text-gray-500">
                You haven't set up any availability yet. Add your weekly availability to start accepting bookings.
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-6">
          <button
            onClick={() => router.push('/dashboard/teacher')}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Back to Teacher Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
