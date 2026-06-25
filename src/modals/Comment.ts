export interface Comment {
  id: number;
  postId: number;
  parentCommentId?: number | null;
  creationDate: string;
  creatorId: string;
  creatorDisplayName: string;
  creatorIdentifierCode: string;
  creatorProfileImg?: string | null;
  content: string;
  likes: number;
  replyCount: number;
  replies?: Comment[];
}

// Response shape: { comment: {...}, author: {...} }
export const mapComment = (raw: any): Comment => {
  const c = raw.comment ?? raw;
  const a = raw.author ?? {};
  return {
    id: c.id,
    postId: c.postId,
    parentCommentId: c.parentCommentId ?? null,
    creationDate: c.creationDate ?? "",
    creatorId: String(a.accountId ?? c.accountId ?? ""),
    creatorDisplayName: a.displayName ?? "",
    creatorIdentifierCode: a.identifierCode ?? "",
    creatorProfileImg: a.profileImg ?? null,
    content: c.content ?? "",
    likes: c.likeCount ?? c.likes ?? 0,
    replyCount: c.replyCount ?? 0,
    replies: [],
  };
};
