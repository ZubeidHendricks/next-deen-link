import { and, eq, lt, desc, sql, or } from 'drizzle-orm';
import { db } from './drizzle';
import {
  conversations,
  messages,
  teacherProfiles,
  Conversation,
  NewConversation,
  Message,
  NewMessage,
} from './schema-extensions';
import { users } from './schema';

export async function getOrCreateConversation(parentId: number, teacherId: number) {
  // Check for existing conversation
  const existingConversation = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.parentId, parentId),
        eq(conversations.teacherId, teacherId)
      )
    )
    .limit(1);

  if (existingConversation.length > 0) {
    return existingConversation[0];
  }

  // Create new conversation
  const [newConversation] = await db
    .insert(conversations)
    .values({
      parentId,
      teacherId,
    })
    .returning();

  return newConversation;
}

export async function getConversation(conversationId: number) {
  const result = await db
    .select({
      conversation: conversations,
      parent: {
        id: sql<number>`parent.id`,
        name: sql<string>`parent.name`,
        email: sql<string>`parent.email`,
      },
      teacher: {
        id: sql<number>`teacher.id`,
        name: sql<string>`teacher.name`,
        email: sql<string>`teacher.email`,
      },
    })
    .from(conversations)
    .innerJoin(users, eq(conversations.parentId, users.id), 'parent')
    .innerJoin(users, eq(conversations.teacherId, users.id), 'teacher')
    .where(eq(conversations.id, conversationId))
    .limit(1);

  return result[0] || null;
}

export async function getUserConversations(userId: number) {
  const result = await db
    .select({
      conversation: conversations,
      parent: {
        id: sql<number>`parent.id`,
        name: sql<string>`parent.name`,
      },
      teacher: {
        id: sql<number>`teacher.id`,
        name: sql<string>`teacher.name`,
      },
      lastMessage: sql<Message | null>`(
        SELECT m.*
        FROM ${messages} m
        WHERE m.conversation_id = ${conversations.id}
        ORDER BY m.created_at DESC
        LIMIT 1
      )`,
      unreadCount: sql<number>`(
        SELECT COUNT(*)
        FROM ${messages} m
        WHERE m.conversation_id = ${conversations.id}
          AND m.sender_id != ${userId}
          AND m.is_read = false
      )`,
    })
    .from(conversations)
    .innerJoin(users, eq(conversations.parentId, users.id), 'parent')
    .innerJoin(users, eq(conversations.teacherId, users.id), 'teacher')
    .where(
      or(
        eq(conversations.parentId, userId),
        eq(conversations.teacherId, userId)
      )
    )
    .orderBy(desc(conversations.updatedAt));

  return result;
}

export async function sendMessage(data: Omit<NewMessage, 'id' | 'createdAt'>) {
  // Insert message
  const [message] = await db.insert(messages).values(data).returning();

  // Update conversation's updatedAt timestamp
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, data.conversationId));

  return message;
}

export async function getConversationMessages(conversationId: number, before?: Date, limit: number = 20) {
  let query = db
    .select({
      message: messages,
      sender: {
        id: users.id,
        name: users.name,
      },
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.conversationId, conversationId));

  if (before) {
    query = query.where(lt(messages.createdAt, before));
  }

  return query.orderBy(desc(messages.createdAt)).limit(limit);
}

export async function markMessagesAsRead(conversationId: number, userId: number) {
  return db
    .update(messages)
    .set({ isRead: true })
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.isRead, false),
        sql`${messages.senderId} != ${userId}`
      )
    );
}

export async function getUnreadMessageCount(userId: number) {
  const result = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(
      and(
        or(
          eq(conversations.parentId, userId),
          eq(conversations.teacherId, userId)
        ),
        eq(messages.isRead, false),
        sql`${messages.senderId} != ${userId}`
      )
    );

  return result[0]?.count || 0;
}

export async function getTeacherConversationsForParent(parentId: number) {
  return db
    .select({
      teacher: {
        id: users.id,
        name: users.name,
      },
      teacherProfile: teacherProfiles,
      conversation: conversations,
    })
    .from(teacherProfiles)
    .innerJoin(users, eq(teacherProfiles.userId, users.id))
    .leftJoin(
      conversations,
      and(
        eq(conversations.teacherId, users.id),
        eq(conversations.parentId, parentId)
      )
    )
    .where(eq(teacherProfiles.isAvailableForNewStudents, true));
}
