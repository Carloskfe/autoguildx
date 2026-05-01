export interface Forum {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  rules?: string;
  createdByUserId: string;
  memberCount: number;
  postCount: number;
  createdAt: string;
  isMember?: boolean;
}

export interface ForumPost {
  id: string;
  forumId: string;
  userId: string;
  title: string;
  content: string;
  mediaUrls: string[];
  voteScore: number;
  commentCount: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  myVote?: 1 | -1 | null;
}

export interface ForumComment {
  id: string;
  forumPostId?: string;
  postId?: string;
  userId: string;
  content: string;
  parentId?: string;
  replies?: ForumComment[];
  voteScore: number;
  createdAt: string;
}
