import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getTeacherProfile } from '@/lib/db/teacher-queries';

export async function GET() {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const profile = await getTeacherProfile(user.id);
    
    return NextResponse.json(profile || { userId: user.id });
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    return NextResponse.json({ error: 'Failed to fetch teacher profile' }, { status: 500 });
  }
}
