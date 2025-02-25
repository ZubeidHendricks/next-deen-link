import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getConversation } from '@/lib/db/messaging-queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const conversationId = parseInt(params.id);
    
    if (isNaN(conversationId)) {
      return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
    }
    
    const conversation = await getConversation(conversationId);
    
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    // Check if user is part of this conversation
    if (conversation.parent.id !== user.id && conversation.teacher.id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to view this conversation' }, { status: 403 });
    }
    
    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}
