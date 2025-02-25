import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTeacherProfileWithDetails, getTeacherReviews } from '@/lib/db/teacher-queries';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function TeacherProfilePage({ params }: PageProps) {
  const teacherProfileId = parseInt(params.id);
  
  if (isNaN(teacherProfileId)) {
    notFound();
  }
  
  const teacher = await getTeacherProfileWithDetails(teacherProfileId);
  
  if (!teacher) {
    notFound();
  }
  
  const reviews = await getTeacherReviews(teacherProfileId);
  
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="max-w-4xl mx-auto">
        {/* Teacher Profile Header */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow">
          <div className="flex flex-col md:flex-row md:items-start">
            <div className="flex-shrink-0 mb-4 mr-6 md:mb-0">
              {teacher.teacherProfile.profilePicture ? (
                <img
                  src={teacher.teacherProfile.profilePicture}
                  alt={teacher.user.name}
                  className="object-cover w-32 h-32 rounded-full"
                />
              ) : (
                <div className="flex items-center justify-center w-32 h-32 text-2xl text-white bg-blue-500 rounded-full">
                  {teacher.user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="flex-grow">
              <h1 className="mb-2 text-3xl font-bold">{teacher.user.name}</h1>
              
              <div className="flex items-center mb-4 space-x-4">
                <div className="flex items-center">
                  <span className="mr-1 text-yellow-500">★</span>
                  <span>{teacher.averageRating.toFixed(1)}</span>
                  <span className="ml-1 text-gray-500">({reviews.length} reviews)</span>
                </div>
                
                <div>
                  <span className="font-semibold">${(teacher.teacherProfile.hourlyRate / 100).toFixed(2)}</span>
                  <span className="text-gray-500">/hour</span>
                </div>
                
                <div>
                  <span className="text-gray-500">{teacher.teacherProfile.yearsOfExperience} years experience</span>
                </div>
              </div>
              
              <div className="flex mt-4 space-x-3">
                <Link
                  href={`/dashboard/bookings/new?teacherId=${teacher.teacherProfile.id}`}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Book a Session
                </Link>
                
                <Link
                  href={`/dashboard/messages/new?teacherId=${teacher.teacherProfile.id}`}
                  className="px-4 py-2 text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50"
                >
                  Message
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* About Section */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-xl font-semibold">About</h2>
          <p className="whitespace-pre-line">{teacher.teacherProfile.bio}</p>
        </div>
        
        {/* Subjects Section */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-xl font-semibold">Subjects</h2>
          {teacher.subjects && teacher.subjects.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {teacher.subjects.map((subject) => (
                <span
                  key={subject.id}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                >
                  {subject.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No subjects listed</p>
          )}
        </div>
        
        {/* Qualifications Section */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-xl font-semibold">Qualifications</h2>
          <p className="whitespace-pre-line">{teacher.teacherProfile.qualifications}</p>
        </div>
        
        {/* Availability Section */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-xl font-semibold">Availability</h2>
          {teacher.availability && teacher.availability.length > 0 ? (
            <ul className="space-y-2">
              {teacher.availability.map((slot) => (
                <li key={slot.id} className="flex items-center">
                  <div className="w-32 font-medium">{daysOfWeek[slot.dayOfWeek]}</div>
                  <div>{slot.startTime} - {slot.endTime}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No regular availability listed. Please message to inquire about custom scheduling.</p>
          )}
        </div>
        
        {/* Reviews Section */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-xl font-semibold">Reviews</h2>
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.review.id} className="pb-4 border-b border-gray-200 last:border-0">
                  <div className="flex items-center mb-2">
                    <span className="mr-2 font-medium">{review.fromUser.name}</span>
                    <div className="flex items-center text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <span key={i}>
                          {i < review.review.rating ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-500">
                      {new Date(review.review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No reviews yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
