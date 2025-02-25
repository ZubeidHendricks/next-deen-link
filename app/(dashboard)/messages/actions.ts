'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/navigation';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import {
  getOrCreateConversation,
  sendMessage,
  markMessagesAsRead,
  getConversation,
} from '@/lib/db/messaging-queries';
import { getTeacherProfile } from '@/lib/db/teacher-queries';

// Create or get conversation schema
const conversationSchema = z.object({
  teacherId: z.number().positive('Teacher ID is required'),
});

export const getOrCreateConversationAction = validatedActionWithUser(
  conversationSchema,
  async (data, _, user) => {
    try {
      const conversation = await getOrCreateConversation(user.id, data.teacherId);
      return { conversationId: conversation.id };
    } catch (error) {
      console.error('Error creating conversation:', error);
      return { error: 'Failed to create conversation. Please try again.' };
    }
  }
);

// Send message schema
const sendMessageSchema = z.object({
  conversationId: z.number().positive('Conversation ID is required'),
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message is too long'),
});

export const sendMessageAction = validatedActionWithUser(
  sendMessageSchema,
  async (data, _, user) => {
    try {
      const conversation = await getConversation(data.conversationId);
      if (!conversation) {
        return { error: 'Conversation not found' };
      }

      // Verify user is part of this conversation
      if (conversation.parent.id !== user.id && conversation.teacher.id !== user.id) {
        return { error: 'You do not have permission to send messages in this conversation' };
      }

      // Send message
      await sendMessage({
        conversationId: data.conversationId,
        senderId: user.id,
        content: data.content,
      });

      revalidatePath(`/dashboard/messages/${data.conversationId}`);
      return { success: 'Message sent successfully' };
    } catch (error) {
      console.error('Error sending message:', error);
      return { error: 'Failed to send message. Please try again.' };
    }
  }
);

// Mark messages as read schema
const markAsReadSchema = z.object({
  conversationId: z.number().positive('Conversation ID is required'),
});

export const markMessagesAsReadAction = validatedActionWithUser(
  markAsReadSchema,
  async (data, _, user) => {
    try {
      const conversation = await getConversation(data.conversationId);
      if (!conversation) {
        return { error: 'Conversation not found' };
      }

      // Verify user is part of this conversation
      if (conversation.parent.id !== user.id && conversation.teacher.id !== user.id) {
        return { error: 'You do not have permission to access this conversation' };
      }

      await markMessagesAsRead(data.conversationId, user.id);
      revalidatePath(`/dashboard/messages/${data.conversationId}`);
      return { success: 'Messages marked as read' };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return { error: 'Failed to mark messages as read. Please try again.' };
    }
  }
);

// Start conversation with teacher schema
const startTeacherConversationSchema = z.object({
  teacherProfileId: z.number().positive('Teacher profile ID is required'),
  initialMessage: z.string().min(1, 'Message cannot be empty').max(2000, 'Message is too long'),
});

export const startTeacherConversationAction = validatedActionWithUser(
  startTeacherConversationSchema,
  async (data, _, user) => {
    try {
      // Get teacher profile to find the user ID
      const teacherProfile = await getTeacherProfile(data.teacherProfileId);
      if (!teacherProfile) {
        return { error: 'Teacher profile not found' };
      }

      // Create or get conversation
      const conversation = await getOrCreateConversation(user.id, teacherProfile.userId);

      // Send initial message
      await sendMessage({
        conversationId: conversation.id,
        senderId: user.id,
        content: data.initialMessage,
      });

      return { 
        success: 'Conversation started successfully',
        conversationId: conversation.id
      };
    } catch (error) {
      console.error('Error starting conversation:', error);
      return { error: 'Failed to start conversation. Please try again.' };
    }
  }
);
