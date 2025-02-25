import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getTeacherProfile, getTeacherAvailability } from '@/lib/db/teacher-queries';

export async function GET() {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const profile = await getTeacherProfile(user.id);
    
    if (!profile) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }
    
    const availability = await getTeacherAvailability(profile.id);
    
    return NextResponse.json(availability);
  } catch (error) {
    console.error('Error fetching teacher availability:', error);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}
