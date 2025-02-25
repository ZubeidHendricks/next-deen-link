import React from 'react';
import Link from 'next/link';
import { getUser } from '@/lib/db/queries';
import { 
  getTeacherProfile, 
  getTeacherProfileWithDetails 
} from '@/lib/db/teacher-queries';
import { 
  getUserBookings 
} from '@/lib/db/booking-queries';
import { redirect } from 'next/navigation';

export default async function TeacherDashboardPage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/sign-in');
  }
  
  const teacherProfile = await getTeacherProfile(user.id);
  
  // If no teacher profile exists, prompt to create one
  if (!teacherProfile) {
    return (
      <div className="container py-8 mx-auto">
        <div className="max-w-4xl p-6 mx-auto bg-white rounded-lg shadow">
          <h1 className="mb-6 text-3xl font-bold">Become a Teacher</h1>
          <p className="mb-6 text-lg">
            You haven't set up your teacher profile yet. Create your profile to start teaching and accepting bookings.
          </p>
          <div className="flex justify-center">
            <Link
              href="/dashboard/teacher/profile"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Create Teacher Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Get teacher details with subjects, availability, and ratings
  const teacherDetails = await getTeacherProfileWithDetails(teacherProfile.id);
  
  // Get upcoming bookings
  const upcomingBookings = await getUserBookings(user.id, 'teacher', 'confirmed');
  const pendingBookings = await getUserBookings(user.id, 'teacher', 'pending');
  
  return (
    <div className="container py-8 mx-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-start justify-between pb-6 mb-6 border-b md:flex-row md:items-center">
          <div>
            <h1 className="mb-2 text-3xl font-bold">Teacher Dashboard</h1>
            <p className="text-lg text-gray-600">
              Manage your teaching profile, availability, and bookings
            </p>
          </div>
          
          <div className="flex items-center mt-4 space-x-2 md:mt-0">
            <div className="px-3 py-1 text-sm border rounded-full">
              {teacherDetails?.teacherProfile.isAvailableForNewStudents 
                ? '✅ Available for students' 
                : '❌ Not accepting students'}
            </div>
            
            <div className="flex items-center px-3 py-1 text-sm border rounded-full">
              <span className="mr-1 text-yellow-500">★</span>
              <span>{teacherDetails?.averageRating.toFixed(1)}</span>
            </div>
            
            <div className="px-3 py-1 text-sm border rounded-full">
              ${(teacherDetails?.teacherProfile.hourlyRate / 100).toFixed(2)}/hr
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="mb-2 text-lg font-semibold">Upcoming Sessions</h3>
            <p className="text-4xl font-bold">{upcomingBookings.length}</p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="mb-2 text-lg font-semibold">Pending Requests</h3>
            <p className="text-4xl font-bold">{pendingBookings.length}</p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="mb-2 text-lg font-semibold">Subjects</h3>
            <p className="text-4xl font-bold">{teacherDetails?.subjects.length || 0}</p>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2">
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-semibold">Profile Management</h2>
            <div className="space-y-2">
              <div>
                <Link
                  href="/dashboard/teacher/profile"
                  className="inline-block mb-2 text-blue-600 hover:underline"
                >
                  Update Teacher Profile
                </Link>
                <p className="text-sm text-gray-600">
                  Edit your bio, qualifications, and pricing
                </p>
              </div>
              
              <div>
                <Link
                  href="/dashboard/teacher/subjects"
                  className="inline-block mb-2 text-blue-600 hover:underline"
                >
                  Manage Subjects
                </Link>
                <p className="text-sm text-gray-600">
                  Add or remove subjects you teach
                </p>
              </div>
              
              <div>
                <Link
                  href="/dashboard/teacher/availability"
                  className="inline-block mb-2 text-blue-600 hover:underline"
                >
                  Set Availability
                </Link>
                <p className="text-sm text-gray-600">
                  Update your teaching schedule
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-semibold">Quick Links</h2>
            <div className="space-y-2">
              <div>
                <Link
                  href="/dashboard/bookings"
                  className="inline-block mb-2 text-blue-600 hover:underline"
                >
                  View All Bookings
                </Link>
                <p className="text-sm text-gray-600">
                  Manage your upcoming and past sessions
                </p>
              </div>
              
              <div>
                <Link
                  href="/dashboard/messages"
                  className="inline-block mb-2 text-blue-600 hover:underline"
                >
                  Messages
                </Link>
                <p className="text-sm text-gray-600">
                  Communicate with your students
                </p>
              </div>
              
              <div>
                <Link
                  href={`/teachers/${teacherProfile.id}`}
                  className="inline-block mb-2 text-blue-600 hover:underline"
                >
                  View Public Profile
                </Link>
                <p className="text-sm text-gray-600">
                  See how students view your profile
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Upcoming Sessions */}
        <div className="p-6 mb-8 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-xl font-semibold">Upcoming Sessions</h2>
          
          {upcomingBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left border">Student</th>
                    <th className="p-2 text-left border">Date</th>
                    <th className="p-2 text-left border">Time</th>
                    <th className="p-2 text-left border">Subject</th>
                    <th className="p-2 text-left border">Status</th>
                    <th className="p-2 text-center border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingBookings.slice(0, 5).map((booking) => (
                    <tr key={booking.booking.id}>
                      <td className="p-2 border">{booking.parent.name}</td>
                      <td className="p-2 border">
                        {new Date(booking.booking.startTime).toLocaleDateString()}
                      </td>
                      <td className="p-2 border">
                        {new Date(booking.booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                        {new Date(booking.booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-2 border">{booking.subject?.name || 'N/A'}</td>
                      <td className="p-2 border">
                        <span className="px-2 py-1 text-xs text-white bg-green-500 rounded-full">
                          {booking.booking.status}
                        </span>
                      </td>
                      <td className="p-2 text-center border">
                        <Link
                          href={`/dashboard/bookings/${booking.booking.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No upcoming sessions scheduled</p>
          )}
          
          {upcomingBookings.length > 5 && (
            <div className="mt-4 text-center">
              <Link
                href="/dashboard/bookings"
                className="text-blue-600 hover:underline"
              >
                View all bookings
              </Link>
            </div>
          )}
        </div>
        
        {/* Pending Booking Requests */}
        {pendingBookings.length > 0 && (
          <div className="p-6 mb-8 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-semibold">Pending Booking Requests</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left border">Student</th>
                    <th className="p-2 text-left border">Date</th>
                    <th className="p-2 text-left border">Time</th>
                    <th className="p-2 text-left border">Subject</th>
                    <th className="p-2 text-center border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingBookings.map((booking) => (
                    <tr key={booking.booking.id}>
                      <td className="p-2 border">{booking.parent.name}</td>
                      <td className="p-2 border">
                        {new Date(booking.booking.startTime).toLocaleDateString()}
                      </td>
                      <td className="p-2 border">
                        {new Date(booking.booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                        {new Date(booking.booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-2 border">{booking.subject?.name || 'N/A'}</td>
                      <td className="p-2 text-center border">
                        <Link
                          href={`/dashboard/bookings/${booking.booking.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          Respond
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
