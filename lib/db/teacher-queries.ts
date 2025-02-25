import { and, eq, like, or, sql, desc } from 'drizzle-orm';
import { db } from './drizzle';
import {
  teacherProfiles,
  subjects,
  teacherSubjects,
  availability,
  bookings,
  reviews,
  TeacherProfile,
  Subject,
  Availability,
} from './schema-extensions';
import { users } from './schema';

export async function getTeacherProfile(userId: number) {
  const result = await db
    .select()
    .from(teacherProfiles)
    .where(eq(teacherProfiles.userId, userId))
    .limit(1);

  return result[0] || null;
}

export async function getTeacherProfileWithDetails(teacherProfileId: number) {
  const result = await db
    .select({
      teacherProfile: teacherProfiles,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(teacherProfiles)
    .innerJoin(users, eq(teacherProfiles.userId, users.id))
    .where(eq(teacherProfiles.id, teacherProfileId))
    .limit(1);

  if (!result[0]) return null;

  const teacherSubjectsResult = await db
    .select({
      id: teacherSubjects.id,
      subject: subjects,
    })
    .from(teacherSubjects)
    .innerJoin(subjects, eq(teacherSubjects.subjectId, subjects.id))
    .where(eq(teacherSubjects.teacherProfileId, teacherProfileId));

  const availabilityResult = await db
    .select()
    .from(availability)
    .where(eq(availability.teacherProfileId, teacherProfileId));

  const averageRating = await getTeacherAverageRating(teacherProfileId);

  return {
    ...result[0],
    subjects: teacherSubjectsResult.map((ts) => ts.subject),
    availability: availabilityResult,
    averageRating,
  };
}

export async function createTeacherProfile(data: Omit<TeacherProfile, 'id' | 'createdAt' | 'updatedAt'>) {
  const [result] = await db.insert(teacherProfiles).values(data).returning();
  return result;
}

export async function updateTeacherProfile(
  teacherProfileId: number,
  data: Partial<Omit<TeacherProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
) {
  const [result] = await db
    .update(teacherProfiles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(teacherProfiles.id, teacherProfileId))
    .returning();
  return result;
}

export async function getTeacherSubjects(teacherProfileId: number) {
  const result = await db
    .select({
      id: teacherSubjects.id,
      subject: subjects,
    })
    .from(teacherSubjects)
    .innerJoin(subjects, eq(teacherSubjects.subjectId, subjects.id))
    .where(eq(teacherSubjects.teacherProfileId, teacherProfileId));

  return result.map((ts) => ts.subject);
}

export async function addTeacherSubject(teacherProfileId: number, subjectId: number) {
  return db.insert(teacherSubjects).values({
    teacherProfileId,
    subjectId,
  }).onConflictDoNothing();
}

export async function removeTeacherSubject(teacherProfileId: number, subjectId: number) {
  return db
    .delete(teacherSubjects)
    .where(
      and(
        eq(teacherSubjects.teacherProfileId, teacherProfileId),
        eq(teacherSubjects.subjectId, subjectId)
      )
    );
}

export async function getAllSubjects() {
  return db.select().from(subjects);
}

export async function createSubject(data: Omit<Subject, 'id'>) {
  const [result] = await db.insert(subjects).values(data).returning();
  return result;
}

export async function getTeacherAvailability(teacherProfileId: number) {
  return db
    .select()
    .from(availability)
    .where(eq(availability.teacherProfileId, teacherProfileId));
}

export async function addTeacherAvailability(data: Omit<Availability, 'id'>) {
  const [result] = await db.insert(availability).values(data).returning();
  return result;
}

export async function updateTeacherAvailability(
  availabilityId: number,
  data: Partial<Omit<Availability, 'id' | 'teacherProfileId'>>
) {
  const [result] = await db
    .update(availability)
    .set(data)
    .where(eq(availability.id, availabilityId))
    .returning();
  return result;
}

export async function removeTeacherAvailability(availabilityId: number) {
  return db.delete(availability).where(eq(availability.id, availabilityId));
}

export async function searchTeachers(
  query: string = '',
  subjectIds: number[] = [],
  minHourlyRate?: number,
  maxHourlyRate?: number,
  minRating?: number
) {
  let queryBuilder = db
    .select({
      teacherProfile: teacherProfiles,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(teacherProfiles)
    .innerJoin(users, eq(teacherProfiles.userId, users.id))
    .where(eq(teacherProfiles.isAvailableForNewStudents, true));

  // Apply text search filter
  if (query) {
    queryBuilder = queryBuilder.where(
      or(
        like(users.name, `%${query}%`),
        like(teacherProfiles.bio, `%${query}%`),
        like(teacherProfiles.qualifications, `%${query}%`)
      )
    );
  }

  // Apply price range filter
  if (minHourlyRate !== undefined) {
    queryBuilder = queryBuilder.where(
      sql`${teacherProfiles.hourlyRate} >= ${minHourlyRate}`
    );
  }

  if (maxHourlyRate !== undefined) {
    queryBuilder = queryBuilder.where(
      sql`${teacherProfiles.hourlyRate} <= ${maxHourlyRate}`
    );
  }

  const teachers = await queryBuilder;

  // If subject filter is applied, we need to filter the results
  const filteredTeachers = subjectIds.length
    ? await Promise.all(
        teachers.map(async (teacher) => {
          const teacherSubjectsResult = await db
            .select()
            .from(teacherSubjects)
            .where(
              and(
                eq(teacherSubjects.teacherProfileId, teacher.teacherProfile.id),
                sql`${teacherSubjects.subjectId} IN (${subjectIds.join(',')})`
              )
            );
          return teacherSubjectsResult.length > 0 ? teacher : null;
        })
      )
    : teachers;

  // Filter out nulls (teachers who didn't match subject filter)
  const validTeachers = filteredTeachers.filter((t) => t !== null) as typeof teachers;

  // If rating filter is applied, we need to apply it after getting average ratings
  if (minRating !== undefined) {
    const teachersWithRatings = await Promise.all(
      validTeachers.map(async (teacher) => {
        const avgRating = await getTeacherAverageRating(teacher.teacherProfile.id);
        return {
          ...teacher,
          averageRating: avgRating,
        };
      })
    );

    return teachersWithRatings.filter((t) => t.averageRating >= (minRating || 0));
  }

  // Otherwise, just add the ratings data
  return Promise.all(
    validTeachers.map(async (teacher) => {
      const avgRating = await getTeacherAverageRating(teacher.teacherProfile.id);
      return {
        ...teacher,
        averageRating: avgRating,
      };
    })
  );
}

export async function getTeacherAverageRating(teacherProfileId: number) {
  const teacherUser = await db
    .select({ userId: teacherProfiles.userId })
    .from(teacherProfiles)
    .where(eq(teacherProfiles.id, teacherProfileId))
    .limit(1);

  if (!teacherUser[0]) return 0;

  const result = await db
    .select({
      averageRating: sql<number>`AVG(${reviews.rating})`,
    })
    .from(reviews)
    .where(eq(reviews.toUserId, teacherUser[0].userId));

  return result[0]?.averageRating || 0;
}

export async function getTeacherReviews(teacherProfileId: number) {
  const teacherUser = await db
    .select({ userId: teacherProfiles.userId })
    .from(teacherProfiles)
    .where(eq(teacherProfiles.id, teacherProfileId))
    .limit(1);

  if (!teacherUser[0]) return [];

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
    .where(eq(reviews.toUserId, teacherUser[0].userId))
    .orderBy(desc(reviews.createdAt));
}
