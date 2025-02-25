import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getConversation, getConversationMessages } from '@/lib/db/messaging-queries';

export async function GET(
  request: Request,
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
    
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const before = searchParams.get('before');
    const limit = searchParams.get('limit');
    
    // Parse parameters
    const beforeDate = before ? new Date(before) : undefined;
    const limitNum = limit ? parseInt(limit) : 20;
    
    const messages = await getConversationMessages(conversationId, beforeDate, limitNum);
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
