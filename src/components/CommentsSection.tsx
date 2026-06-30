import { useCallback, useEffect, useRef, useState } from "react";
import { useAppSelector } from "../redux/hooks";
import { axiosApiInstance, axiosApiInstanceAuth } from "../api/axios";
import { Comment, mapComment } from "../modals/Comment";
import CommentItem from "./CommentItem";
import CommentInput from "./CommentInput";

const PAGE_SIZE = 20;

interface CommentsSectionProps {
  postId: string;
  commentCount: number;
  focusInput?: boolean;
  onTotalChange?: (total: number) => void;
}

const CommentsSection = ({ postId, commentCount: initialCount, focusInput, onTotalChange }: CommentsSectionProps) => {
  const isLoggedIn   = useAppSelector((state) => !!state.auth.user);
  const sectionRef   = useRef<HTMLDivElement>(null);

  const [comments,    setComments]    = useState<Comment[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore,     setHasMore]     = useState(false);
  const [page,        setPage]        = useState(0);
  const [total,       setTotal]       = useState(initialCount);

  const updateTotal = (updater: number | ((prev: number) => number)) => {
    setTotal((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      onTotalChange?.(next);
      return next;
    });
  };

  const fetchComments = useCallback(async (pageNum: number, replace: boolean) => {
    try {
      const res = await axiosApiInstance.get(`/posts/any/${postId}/comments`, {
        params: { page: pageNum, size: PAGE_SIZE },
      });
      const fetched: Comment[] = (res.data.content ?? res.data ?? []).map(mapComment);
      setComments((prev) => replace ? fetched : [...prev, ...fetched]);
      setHasMore(fetched.length === PAGE_SIZE);
      if (res.data.totalElements != null) setTotal(res.data.totalElements);
    } catch {
      // backend not yet ready — silently show empty state
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments(0, true);
  }, [fetchComments]);

  useEffect(() => {
    if (!focusInput || !isLoggedIn) return;
    const timer = setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(timer);
  }, [focusInput, isLoggedIn]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    setLoadingMore(true);
    fetchComments(next, false);
  };

  const handlePost = async (content: string) => {
    const res = await axiosApiInstanceAuth.post(`/posts/${postId}/comments`, {
      content,
      parentCommentId: null,
    });
    const newComment = mapComment(res.data);
    setComments((prev) => [newComment, ...prev]);
    updateTotal((c) => c + 1);
  };

  const handleReply = async (commentId: number, content: string) => {
    await axiosApiInstanceAuth.post(`/posts/${postId}/comments`, {
      content,
      parentCommentId: commentId,
    });
    // reply count on parent is updated optimistically in CommentItem
  };

  const handleDelete = async (commentId: number) => {
    await axiosApiInstanceAuth.delete(`/posts/${postId}/comments/${commentId}`);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    updateTotal((c) => Math.max(0, c - 1));
  };

  return (
    <div ref={sectionRef} className="w-full bg-[#13161d] border-t-0 border-b border-x-0 lg:border-t-0 lg:border lg:rounded-b-2xl border-white/10 overflow-hidden">

      {/* Input */}
      <div className="px-4 pt-3 pb-3">
        {isLoggedIn
          ? <CommentInput onSubmit={handlePost} />
          : <p className="text-white/25 text-xs text-center py-2">Log in to leave a comment.</p>
        }
      </div>

      {/* Divider with count */}
      {(loading || comments.length > 0) && (
        <div className="flex items-center gap-3 px-4 pb-3">
          <div className="flex-1 h-px bg-white/[0.06]" />
          {!loading && total > 0 && (
            <span className="text-white/20 text-[10px] font-semibold uppercase tracking-widest flex-shrink-0">
              {total} {total === 1 ? "comment" : "comments"}
            </span>
          )}
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>
      )}

      {/* List */}
      <div className="px-4 pb-4 flex flex-col gap-5">
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 rounded-full border-2 border-blue-primary/50 border-t-transparent animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-white/20 text-xs text-center py-4">No comments yet. Be the first.</p>
        ) : (
          <>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                postId={Number(postId)}
                comment={comment}
                onReply={handleReply}
                onDelete={handleDelete}
              />
            ))}
            {hasMore && (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="text-blue-primary/60 text-xs font-semibold hover:text-blue-primary transition-colors duration-150 text-center py-2 disabled:opacity-40"
              >
                {loadingMore ? "Loading..." : "Load more comments"}
              </button>
            )}
          </>
        )}
      </div>

    </div>
  );
};

export default CommentsSection;
