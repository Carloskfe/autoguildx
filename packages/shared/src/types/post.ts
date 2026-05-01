export interface Post {
  id: string;
  userId: string;
  content: string;
  mediaUrls: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  visibility: string;
  mediaMode: string;
  linkUrl?: string;
  linkPreviewType?: string;
  sharedPostId?: string;
  sharedContentType?: string;
  sharedContentId?: string;
  sharedContent?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId?: string;
  forumPostId?: string;
  userId: string;
  content: string;
  parentId?: string;
  replies?: Comment[];
  voteScore: number;
  createdAt: string;
}
