import { NextResponse } from 'next/server';
import { getTeacherProfileWithDetails, getTeacherSubjects } from '@/lib/db/teacher-queries';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const teacherId = parseInt(params.id);
    
    if (isNaN(teacherId)) {
      return NextResponse.json({ error: 'Invalid teacher ID' }, { status: 400 });
    }
    
    const teacherProfile = await getTeacherProfileWithDetails(teacherId);
    
    if (!teacherProfile) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      teacherProfile: teacherProfile.teacherProfile,
      user: teacherProfile.user,
      subjects: teacherProfile.subjects,
      availability: teacherProfile.availability,
      averageRating: teacherProfile.averageRating,
    });
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    return NextResponse.json({ error: 'Failed to fetch teacher profile' }, { status: 500 });
  }
}
