import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAllSubjects, searchTeachers } from '@/lib/db/teacher-queries';

interface PageProps {
  searchParams: {
    query?: string;
    subject?: string;
    minRate?: string;
    maxRate?: string;
    minRating?: string;
  };
}

export default async function TeachersPage({ searchParams }: PageProps) {
  const query = searchParams.query || '';
  const subjectIds = searchParams.subject ? [parseInt(searchParams.subject)] : [];
  const minRate = searchParams.minRate ? parseInt(searchParams.minRate) : undefined;
  const maxRate = searchParams.maxRate ? parseInt(searchParams.maxRate) : undefined;
  const minRating = searchParams.minRating ? parseInt(searchParams.minRating) : undefined;

  const teachers = await searchTeachers(
    query,
    subjectIds,
    minRate,
    maxRate, 
    minRating
  );

  const subjects = await getAllSubjects();

  return (
    <div className="container px-4 py-8 mx-auto">
      <h1 className="mb-6 text-3xl font-bold">Find a Teacher</h1>
      
      {/* Search Form */}
      <form className="p-6 mb-8 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="col-span-2">
            <label htmlFor="query" className="block mb-1 text-sm font-medium">
              Search by name or keyword
            </label>
            <input
              type="text"
              name="query"
              id="query"
              defaultValue={query}
              placeholder="Enter name, subject or keyword"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div>
            <label htmlFor="subject" className="block mb-1 text-sm font-medium">
              Subject
            </label>
            <select
              name="subject"
              id="subject"
              defaultValue={searchParams.subject || ''}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id.toString()}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="minRating" className="block mb-1 text-sm font-medium">
              Minimum Rating
            </label>
            <select
              name="minRating"
              id="minRating"
              defaultValue={searchParams.minRating || ''}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Any Rating</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
              <option value="1">1+ Stars</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-4">
          <div>
            <label htmlFor="minRate" className="block mb-1 text-sm font-medium">
              Min. Hourly Rate ($)
            </label>
            <input
              type="number"
              name="minRate"
              id="minRate"
              defaultValue={searchParams.minRate || ''}
              placeholder="Min"
              min="0"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div>
            <label htmlFor="maxRate" className="block mb-1 text-sm font-medium">
              Max. Hourly Rate ($)
            </label>
            <input
              type="number"
              name="maxRate"
              id="maxRate"
              defaultValue={searchParams.maxRate || ''}
              placeholder="Max"
              min="0"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div className="flex items-end md:col-span-2">
            <button
              type="submit"
              className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </div>
      </form>
      
      {/* Results */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teachers.length > 0 ? (
          teachers.map((teacher) => (
            <div key={teacher.teacherProfile.id} className="overflow-hidden bg-white rounded-lg shadow">
              <div className="p-4">
                <div className="flex items-center mb-4">
                  <div className="mr-4">
                    {teacher.teacherProfile.profilePicture ? (
                      <img
                        src={teacher.teacherProfile.profilePicture}
                        alt={teacher.user.name}
                        className="object-cover w-16 h-16 rounded-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-16 h-16 text-white bg-blue-500 rounded-full">
                        {teacher.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{teacher.user.name}</h3>
                    <div className="flex items-center">
                      <div className="flex items-center">
                        <span className="mr-1 text-yellow-500">★</span>
                        <span>{teacher.averageRating.toFixed(1)}</span>
                      </div>
                      <span className="mx-2">•</span>
                      <span>${(teacher.teacherProfile.hourlyRate / 100).toFixed(2)}/hr</span>
                    </div>
                  </div>
                </div>
                
                <p className="mb-4 text-sm line-clamp-3">
                  {teacher.teacherProfile.bio}
                </p>
                
                <div className="flex justify-between mt-4">
                  <Link
                    href={`/teachers/${teacher.teacherProfile.id}`}
                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    View Profile
                  </Link>
                  
                  <Link
                    href={`/dashboard/bookings/new?teacherId=${teacher.teacherProfile.id}`}
                    className="px-4 py-2 text-sm text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50"
                  >
                    Book Session
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-8 text-center">
            <h3 className="mb-2 text-xl font-semibold">No teachers found</h3>
            <p className="text-gray-600">
              Try adjusting your search filters or search for a different subject.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
