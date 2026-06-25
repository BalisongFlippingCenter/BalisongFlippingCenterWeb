import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import { useAppSelector, useAppDispatch } from "../redux/hooks";
import { toggleLikedComment } from "../redux/auth/authSlice";
import { axiosApiInstanceAuth } from "../api/axios";

interface CommentLikeButtonProps {
  postId: number;
  commentId: number;
  initialCount: number;
  isOwner?: boolean;
}

const CommentLikeButton = ({ postId, commentId, initialCount, isOwner = false }: CommentLikeButtonProps) => {
  const dispatch        = useAppDispatch();
  const isLoggedIn      = useAppSelector((state) => !!state.auth.user);
  const likedCommentIds = useAppSelector((state) => state.auth.user?.likedCommentIds ?? []);

  const [liked,     setLiked]     = useState(() => likedCommentIds.includes(commentId));
  const [likeCount, setLikeCount] = useState(initialCount);
  const inFlight = useRef(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn || isOwner || inFlight.current) return;
    inFlight.current = true;
    const nowLiked = !liked;
    setLiked(nowLiked);
    setLikeCount((c) => c + (nowLiked ? 1 : -1));
    dispatch(toggleLikedComment(commentId));
    try {
      if (nowLiked) {
        await axiosApiInstanceAuth.post(`/posts/${postId}/comments/${commentId}/like`);
      } else {
        await axiosApiInstanceAuth.delete(`/posts/${postId}/comments/${commentId}/like`);
      }
    } catch {
      setLiked(!nowLiked);
      setLikeCount((c) => c + (nowLiked ? -1 : 1));
      dispatch(toggleLikedComment(commentId));
    } finally {
      inFlight.current = false;
    }
  };

  return (
    <button
      type="button"
      onClick={handleLike}
      className={`flex items-center gap-1 text-[11px] transition-colors duration-150 ${
        isOwner ? "text-white/15 cursor-not-allowed" : liked ? "text-red" : "text-white/30 hover:text-white/55"
      } ${!isLoggedIn || isOwner ? "cursor-default" : "cursor-pointer"}`}
    >
      <FontAwesomeIcon icon={faHeart} className="text-[10px]" />
      {likeCount > 0 && <span className="font-medium">{likeCount}</span>}
    </button>
  );
};

export default CommentLikeButton;
