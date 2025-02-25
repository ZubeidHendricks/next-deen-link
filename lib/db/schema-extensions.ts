import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  decimal,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './schema';

// Teacher Profiles
export const teacherProfiles = pgTable('teacher_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  bio: text('bio'),
  qualifications: text('qualifications'),
  yearsOfExperience: integer('years_of_experience'),
  profilePicture: varchar('profile_picture', { length: 255 }),
  hourlyRate: integer('hourly_rate'), // Store in cents
  isAvailableForNewStudents: boolean('is_available_for_new_students').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Teaching Areas/Subjects
export const subjects = pgTable('subjects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  ageGroupStart: integer('age_group_start'), // minimum age this is suitable for
  ageGroupEnd: integer('age_group_end'), // maximum age this is suitable for
});

// Many-to-many relationship between teachers and subjects
export const teacherSubjects = pgTable('teacher_subjects', {
  id: serial('id').primaryKey(),
  teacherProfileId: integer('teacher_profile_id')
    .notNull()
    .references(() => teacherProfiles.id),
  subjectId: integer('subject_id')
    .notNull()
    .references(() => subjects.id),
});

// Teacher Availability
export const availability = pgTable('availability', {
  id: serial('id').primaryKey(),
  teacherProfileId: integer('teacher_profile_id')
    .notNull()
    .references(() => teacherProfiles.id),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6 (Sunday-Saturday)
  startTime: varchar('start_time', { length: 5 }).notNull(), // Format: "HH:MM" in 24-hour
  endTime: varchar('end_time', { length: 5 }).notNull(), // Format: "HH:MM" in 24-hour
  isRecurring: boolean('is_recurring').default(true),
});

// Bookings
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  teacherProfileId: integer('teacher_profile_id')
    .notNull()
    .references(() => teacherProfiles.id),
  parentId: integer('parent_id')
    .notNull()
    .references(() => users.id),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, confirmed, cancelled, completed
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  subjectId: integer('subject_id')
    .references(() => subjects.id),
  notes: text('notes'),
  price: integer('price'), // Total price in cents
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  paymentStatus: varchar('payment_status', { length: 20 }).default('pending'), // pending, paid, refunded
});

// Reviews
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id')
    .notNull()
    .references(() => bookings.id),
  fromUserId: integer('from_user_id')
    .notNull()
    .references(() => users.id),
  toUserId: integer('to_user_id')
    .notNull()
    .references(() => users.id),
  rating: integer('rating').notNull(), // 1-5 stars
  comment: text('comment'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Messages
export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  parentId: integer('parent_id')
    .notNull()
    .references(() => users.id),
  teacherId: integer('teacher_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id')
    .notNull()
    .references(() => conversations.id),
  senderId: integer('sender_id')
    .notNull()
    .references(() => users.id),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const teacherProfilesRelations = relations(teacherProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [teacherProfiles.userId],
    references: [users.id],
  }),
  teacherSubjects: many(teacherSubjects),
  availability: many(availability),
  bookings: many(bookings),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  teacherSubjects: many(teacherSubjects),
}));

export const teacherSubjectsRelations = relations(teacherSubjects, ({ one }) => ({
  teacherProfile: one(teacherProfiles, {
    fields: [teacherSubjects.teacherProfileId],
    references: [teacherProfiles.id],
  }),
  subject: one(subjects, {
    fields: [teacherSubjects.subjectId],
    references: [subjects.id],
  }),
}));

export const availabilityRelations = relations(availability, ({ one }) => ({
  teacherProfile: one(teacherProfiles, {
    fields: [availability.teacherProfileId],
    references: [teacherProfiles.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  teacherProfile: one(teacherProfiles, {
    fields: [bookings.teacherProfileId],
    references: [teacherProfiles.id],
  }),
  parent: one(users, {
    fields: [bookings.parentId],
    references: [users.id],
  }),
  subject: one(subjects, {
    fields: [bookings.subjectId],
    references: [subjects.id],
  }),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  booking: one(bookings, {
    fields: [reviews.bookingId],
    references: [bookings.id],
  }),
  fromUser: one(users, {
    fields: [reviews.fromUserId],
    references: [users.id],
  }),
  toUser: one(users, {
    fields: [reviews.toUserId],
    references: [users.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  parent: one(users, {
    fields: [conversations.parentId],
    references: [users.id],
  }),
  teacher: one(users, {
    fields: [conversations.teacherId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

// Type definitions
export type TeacherProfile = typeof teacherProfiles.$inferSelect;
export type NewTeacherProfile = typeof teacherProfiles.$inferInsert;
export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;
export type TeacherSubject = typeof teacherSubjects.$inferSelect;
export type NewTeacherSubject = typeof teacherSubjects.$inferInsert;
export type Availability = typeof availability.$inferSelect;
export type NewAvailability = typeof availability.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
