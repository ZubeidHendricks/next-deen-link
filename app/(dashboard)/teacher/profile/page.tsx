'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateTeacherProfileAction } from '../actions';

export default function TeacherProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    bio: '',
    qualifications: '',
    yearsOfExperience: 0,
    hourlyRate: 0,
    profilePicture: '',
    isAvailableForNewStudents: true,
  });

  // Fetch teacher profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/teacher/profile');
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setFormData({
            bio: data.bio || '',
            qualifications: data.qualifications || '',
            yearsOfExperience: data.yearsOfExperience || 0,
            hourlyRate: data.hourlyRate ? data.hourlyRate / 100 : 0, // Convert cents to dollars
            profilePicture: data.profilePicture || '',
            isAvailableForNewStudents: data.isAvailableForNewStudents !== false,
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile information');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData((prev) => ({
        ...prev,
        [name]: target.checked,
      }));
    } else if (type === 'number') {
      setFormData((prev) => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const result = await updateTeacherProfileAction({
        bio: formData.bio,
        qualifications: formData.qualifications,
        yearsOfExperience: formData.yearsOfExperience,
        hourlyRate: formData.hourlyRate, // Will be converted to cents in the server action
        profilePicture: formData.profilePicture,
        isAvailableForNewStudents: formData.isAvailableForNewStudents,
      });

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess(result.success);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8 mx-auto">
        <div className="max-w-2xl p-6 mx-auto bg-white rounded-lg shadow">
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-center">Loading profile information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 mx-auto">
      <div className="max-w-2xl p-6 mx-auto bg-white rounded-lg shadow">
        <h1 className="mb-6 text-2xl font-bold">Teacher Profile</h1>
        
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
        
        <form onSubmit={handleSubmit}>
          {/* Profile Picture */}
          <div className="mb-6">
            <label htmlFor="profilePicture" className="block mb-1 font-medium">
              Profile Picture URL
            </label>
            <input
              type="text"
              id="profilePicture"
              name="profilePicture"
              value={formData.profilePicture}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              placeholder="https://example.com/your-photo.jpg"
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter a URL to your profile picture. For a production app, we would implement file upload.
            </p>
          </div>
          
          {/* Bio */}
          <div className="mb-6">
            <label htmlFor="bio" className="block mb-1 font-medium">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              rows={5}
              placeholder="Tell students about yourself, your teaching style, and experience"
              required
              minLength={10}
              maxLength={1000}
            ></textarea>
            <p className="mt-1 text-sm text-gray-500">
              {formData.bio.length}/1000 characters
            </p>
          </div>
          
          {/* Qualifications */}
          <div className="mb-6">
            <label htmlFor="qualifications" className="block mb-1 font-medium">
              Qualifications & Certifications
            </label>
            <textarea
              id="qualifications"
              name="qualifications"
              value={formData.qualifications}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              rows={4}
              placeholder="List your education, degrees, certifications, etc."
              required
              minLength={10}
              maxLength={1000}
            ></textarea>
            <p className="mt-1 text-sm text-gray-500">
              {formData.qualifications.length}/1000 characters
            </p>
          </div>
          
          {/* Years of Experience */}
          <div className="mb-6">
            <label htmlFor="yearsOfExperience" className="block mb-1 font-medium">
              Years of Experience
            </label>
            <input
              type="number"
              id="yearsOfExperience"
              name="yearsOfExperience"
              value={formData.yearsOfExperience}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              min={0}
              max={100}
              required
            />
          </div>
          
          {/* Hourly Rate */}
          <div className="mb-6">
            <label htmlFor="hourlyRate" className="block mb-1 font-medium">
              Hourly Rate (USD)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600">
                $
              </span>
              <input
                type="number"
                id="hourlyRate"
                name="hourlyRate"
                value={formData.hourlyRate}
                onChange={handleInputChange}
                className="w-full p-2 pl-8 border rounded-md"
                min={1}
                max={1000}
                step={0.01}
                required
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Set your hourly rate between $1 and $1000
            </p>
          </div>
          
          {/* Availability Toggle */}
          <div className="mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAvailableForNewStudents"
                name="isAvailableForNewStudents"
                checked={formData.isAvailableForNewStudents}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="isAvailableForNewStudents" className="ml-2 font-medium">
                Available for new students
              </label>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              When turned off, you won't appear in search results and can't be booked by new students
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => router.push('/dashboard/teacher')}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
