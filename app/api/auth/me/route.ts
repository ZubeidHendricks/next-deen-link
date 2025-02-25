import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getTeacherProfile } from '@/lib/db/teacher-queries';

export async function GET() {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(null);
    }
    
    // Check if user is a teacher
    const teacherProfile = await getTeacherProfile(user.id);
    
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isTeacher: !!teacherProfile,
      teacherProfileId: teacherProfile?.id,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user information' }, { status: 500 });
  }
}
