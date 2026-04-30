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
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
}
