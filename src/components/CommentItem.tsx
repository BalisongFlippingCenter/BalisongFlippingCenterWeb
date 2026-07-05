import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faChevronDown, faChevronUp, faPenToSquare, faFlag } from "@fortawesome/free-solid-svg-icons";
import { useAppSelector } from "../redux/hooks";
import { axiosApiInstance, axiosApiInstanceAuth } from "../api/axios";
import { Comment, mapComment } from "../modals/Comment";
import CommentLikeButton from "./CommentLikeButton";
import CommentInput from "./CommentInput";
import ReportModal from "./ReportModal";

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const diffMs    = Date.now() - d.getTime();
  const diffMins  = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays  = Math.floor(diffMs / 86_400_000);
  if (diffMins  <  1) return "Just now";
  if (diffMins  < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays  <  7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

interface CommentItemProps {
  postId: number;
  comment: Comment;
  onReply: (commentId: number, content: string) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
  depth?: number;
}

const CommentItem = ({ postId, comment, onReply, onDelete, depth = 0 }: CommentItemProps) => {
  const user    = useAppSelector((state) => state.auth.user);
  const isOwner = !!user && String(user.id) === String(comment.creatorId);

  const [showReply,      setShowReply]      = useState(false);
  const [showReplies,    setShowReplies]    = useState(false);
  const [replies,        setReplies]        = useState<Comment[]>([]);
  const [replyCount,     setReplyCount]     = useState(comment.replyCount);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [isEditing,      setIsEditing]      = useState(false);
  const [content,        setContent]        = useState(comment.content);
  const [reportOpen,     setReportOpen]     = useState(false);

  const loadReplies = async () => {
    if (replies.length > 0) { setShowReplies(true); return; }
    setLoadingReplies(true);
    try {
      const res = await axiosApiInstance.get(
        `/posts/any/${postId}/comments/${comment.id}/replies`,
        { params: { page: 0, size: 20 } }
      );
      const fetched: Comment[] = (res.data.content ?? res.data ?? []).map(mapComment);
      setReplies(fetched);
      setShowReplies(true);
    } catch {
      setShowReplies(true);
    } finally {
      setLoadingReplies(false);
    }
  };

  const toggleReplies = () => {
    if (showReplies) { setShowReplies(false); return; }
    loadReplies();
  };

  const handleReply = async (replyContent: string) => {
    await onReply(comment.id, replyContent);
    setShowReply(false);
    setReplyCount((c) => c + 1);
    const res = await axiosApiInstance.get(
      `/posts/any/${postId}/comments/${comment.id}/replies`,
      { params: { page: 0, size: 20 } }
    );
    setReplies((res.data.content ?? res.data ?? []).map(mapComment));
    setShowReplies(true);
  };

  const handleEdit = async (newContent: string) => {
    await axiosApiInstanceAuth.put(`/posts/${postId}/comments/${comment.id}`, { content: newContent });
    setContent(newContent);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await onDelete(comment.id);
  };

  return (
    <div className={`flex gap-3 ${depth > 0 ? "ml-9 mt-3" : ""}`}>
      {/* Avatar */}
      {(() => {
        const isDeleted = comment.creatorDisplayName === "[deleted]";
        return (
          <div className={`w-9 h-9 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center mt-0.5 ${isDeleted ? "bg-white/[0.04] border border-white/10" : "bg-blue-primary/20 border border-blue-primary/30"}`}>
            {comment.creatorProfileImg
              ? <img src={comment.creatorProfileImg} alt="" className="w-full h-full object-cover" />
              : isDeleted
              ? <span className="text-white/20 text-sm font-bold">?</span>
              : <span className="text-blue-primary text-sm font-bold">{comment.creatorDisplayName.charAt(0).toUpperCase()}</span>
            }
          </div>
        );
      })()}

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={`text-sm font-semibold ${comment.creatorDisplayName === "[deleted]" ? "text-white/30 italic" : "text-white"}`}>{comment.creatorDisplayName}</span>
          {comment.creatorIdentifierCode && (
            <span className="text-white/30 text-xs">#{comment.creatorIdentifierCode}</span>
          )}
          <span className="text-white/20 text-xs">·</span>
          <span className="text-white/30 text-xs">{formatDate(comment.creationDate)}</span>
        </div>

        {/* Content or Edit input */}
        {isEditing ? (
          <div className="mt-1">
            <CommentInput
              onSubmit={handleEdit}
              placeholder="Edit your comment..."
              onCancel={() => setIsEditing(false)}
              initialValue={content}
              autoFocus
            />
          </div>
        ) : (
          <p className="text-white/80 text-[15px] leading-relaxed whitespace-pre-wrap break-words">{content}</p>
        )}

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-3 mt-2">
            <CommentLikeButton postId={postId} commentId={comment.id} initialCount={comment.likes} isOwner={isOwner} />

            {user && depth === 0 && (
              <button
                type="button"
                onClick={() => setShowReply((v) => !v)}
                className="text-white/30 text-xs hover:text-white/60 transition-colors duration-150"
              >
                Reply
              </button>
            )}

            {isOwner && (
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-white/20 text-[11px] hover:text-blue-primary/60 transition-colors duration-150"
                >
                  <FontAwesomeIcon icon={faPenToSquare} />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-white/20 text-[11px] hover:text-red/60 transition-colors duration-150"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            )}

            {!isOwner && user && comment.creatorDisplayName !== "[deleted]" && (
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                title="Report comment"
                className="ml-auto text-white/20 text-[11px] hover:text-red/60 transition-colors duration-150"
              >
                <FontAwesomeIcon icon={faFlag} />
              </button>
            )}
          </div>
        )}

        {/* Inline reply input */}
        {showReply && !isEditing && (
          <div className="mt-3">
            <CommentInput
              onSubmit={handleReply}
              placeholder={comment.creatorDisplayName === "[deleted]" ? "Write a reply..." : `Reply to ${comment.creatorDisplayName}...`}
              onCancel={() => setShowReply(false)}
              autoFocus
            />
          </div>
        )}

        {/* View replies toggle */}
        {replyCount > 0 && depth === 0 && (
          <button
            type="button"
            onClick={toggleReplies}
            disabled={loadingReplies}
            className="flex items-center gap-1.5 mt-3 text-blue-primary/70 text-xs font-semibold hover:text-blue-primary transition-colors duration-150 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={showReplies ? faChevronUp : faChevronDown} className="text-[10px]" />
            {loadingReplies
              ? "Loading..."
              : showReplies
              ? "Hide replies"
              : `View ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`
            }
          </button>
        )}

        {/* Nested replies */}
        {showReplies && replies.length > 0 && (
          <div className="mt-1 border-l border-white/[0.06] pl-0">
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                postId={postId}
                comment={reply}
                onReply={onReply}
                onDelete={onDelete}
                depth={1}
              />
            ))}
          </div>
        )}
      </div>

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="COMMENT"
        targetId={comment.id}
      />
    </div>
  );
};

export default CommentItem;
