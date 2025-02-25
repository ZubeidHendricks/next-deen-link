import { and, eq, gte, lte, sql, desc, or } from 'drizzle-orm';
import { db } from './drizzle';
import {
  bookings,
  reviews,
  teacherProfiles,
  subjects,
  Booking,
  NewBooking,
  NewReview,
} from './schema-extensions';
import { users } from './schema';

export async function createBooking(data: Omit<NewBooking, 'id' | 'createdAt' | 'updatedAt'>) {
  const [result] = await db.insert(bookings).values(data).returning();
  return result;
}

export async function getBookingById(bookingId: number) {
  const result = await db
    .select({
      booking: bookings,
      teacher: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      parent: {
        id: sql<number>`parent.id`,
        name: sql<string>`parent.name`,
        email: sql<string>`parent.email`,
      },
      subject: subjects,
    })
    .from(bookings)
    .innerJoin(teacherProfiles, eq(bookings.teacherProfileId, teacherProfiles.id))
    .innerJoin(users, eq(teacherProfiles.userId, users.id))
    .innerJoin(users, eq(bookings.parentId, users.id), 'parent')
    .leftJoin(subjects, eq(bookings.subjectId, subjects.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  return result[0] || null;
}

export async function getUserBookings(userId: number, role: 'teacher' | 'parent', status?: string) {
  let query = db
    .select({
      booking: bookings,
      teacher: {
        id: users.id,
        name: users.name,
      },
      parent: {
        id: sql<number>`parent.id`,
        name: sql<string>`parent.name`,
      },
      subject: subjects,
    })
    .from(bookings)
    .innerJoin(teacherProfiles, eq(bookings.teacherProfileId, teacherProfiles.id))
    .innerJoin(users, eq(teacherProfiles.userId, users.id))
    .innerJoin(users, eq(bookings.parentId, users.id), 'parent')
    .leftJoin(subjects, eq(bookings.subjectId, subjects.id));

  if (role === 'teacher') {
    query = query.where(
      and(
        eq(users.id, userId),
        status ? eq(bookings.status, status) : sql`1=1`
      )
    );
  } else {
    query = query.where(
      and(
        eq(bookings.parentId, userId),
        status ? eq(bookings.status, status) : sql`1=1`
      )
    );
  }

  return query.orderBy(desc(bookings.startTime));
}

export async function updateBookingStatus(bookingId: number, status: string) {
  const [result] = await db
    .update(bookings)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId))
    .returning();
  return result;
}

export async function updateBookingPayment(bookingId: number, paymentIntentId: string, paymentStatus: string) {
  const [result] = await db
    .update(bookings)
    .set({
      stripePaymentIntentId: paymentIntentId,
      paymentStatus,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId))
    .returning();
  return result;
}

export async function getTeacherBookings(teacherProfileId: number, startDate?: Date, endDate?: Date, status?: string) {
  let query = db
    .select({
      booking: bookings,
      parent: {
        id: users.id,
        name: users.name,
      },
      subject: subjects,
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.parentId, users.id))
    .leftJoin(subjects, eq(bookings.subjectId, subjects.id))
    .where(eq(bookings.teacherProfileId, teacherProfileId));

  if (startDate) {
    query = query.where(gte(bookings.startTime, startDate));
  }

  if (endDate) {
    query = query.where(lte(bookings.endTime, endDate));
  }

  if (status) {
    query = query.where(eq(bookings.status, status));
  }

  return query.orderBy(bookings.startTime);
}

export async function checkAvailabilityConflict(
  teacherProfileId: number,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: number
) {
  const query = db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.teacherProfileId, teacherProfileId),
        or(
          and(
            gte(bookings.startTime, startTime),
            lte(bookings.startTime, endTime)
          ),
          and(
            gte(bookings.endTime, startTime),
            lte(bookings.endTime, endTime)
          ),
          and(
            lte(bookings.startTime, startTime),
            gte(bookings.endTime, endTime)
          )
        ),
        eq(bookings.status, 'confirmed')
      )
    );

  if (excludeBookingId) {
    query.where(sql`${bookings.id} != ${excludeBookingId}`);
  }

  const conflicts = await query;
  return conflicts.length > 0;
}

export async function createReview(data: Omit<NewReview, 'id' | 'createdAt'>) {
  const [result] = await db.insert(reviews).values(data).returning();
  return result;
}

export async function getUserReviews(userId: number, asReviewer: boolean) {
  if (asReviewer) {
    return db
      .select({
        review: reviews,
        toUser: {
          id: users.id,
          name: users.name,
        },
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.toUserId, users.id))
      .where(eq(reviews.fromUserId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  return db
    .select({
      review: reviews,
      fromUser: {
        id: users.id,
        name: users.name,
      },
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.fromUserId, users.id))
    .where(eq(reviews.toUserId, userId))
    .orderBy(desc(reviews.createdAt));
}

export async function getBookingReview(bookingId: number) {
  const result = await db
    .select()
    .from(reviews)
    .where(eq(reviews.bookingId, bookingId))
    .limit(1);

  return result[0] || null;
}
