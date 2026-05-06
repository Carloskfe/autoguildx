export interface Course {
  id: string;
  instructorId: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string;
  price: number;
  tags: string[];
  published: boolean;
  lessonCount: number;
  enrollmentCount: number;
  createdAt: string;
  instructor?: {
    id: string;
    email: string;
    profile?: { name?: string; profileImageUrl?: string; isVerified?: boolean };
  };
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content?: string;
  videoUrl?: string;
  order: number;
  durationMinutes: number;
  createdAt: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  completedAt?: string;
  enrolledAt: string;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  certificateNumber: string;
  issuedAt: string;
  course?: Course;
}
