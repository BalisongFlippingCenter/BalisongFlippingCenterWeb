import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import { useAppSelector, useAppDispatch } from "../redux/hooks";
import { toggleLikedPost } from "../redux/auth/authSlice";
import { axiosApiInstanceAuth } from "../api/axios";

interface LikeButtonProps {
  postId: string;
  initialCount: number;
  isOwner?: boolean;
  className?: string;
}

const LikeButton = ({ postId, initialCount, isOwner = false, className = "" }: LikeButtonProps) => {
  const dispatch     = useAppDispatch();
  const isLoggedIn   = useAppSelector((state) => !!state.auth.user);
  const likedPostIds = useAppSelector((state) => state.auth.user?.likedPostIds ?? []);
  const postIdNum    = Number(postId);

  const [liked,     setLiked]     = useState(() => likedPostIds.includes(postIdNum));
  const [likeCount, setLikeCount] = useState(initialCount);
  const inFlight = useRef(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn || isOwner || inFlight.current) return;
    inFlight.current = true;
    const nowLiked = !liked;
    setLiked(nowLiked);
    setLikeCount((c) => c + (nowLiked ? 1 : -1));
    dispatch(toggleLikedPost(postIdNum));
    try {
      if (nowLiked) {
        await axiosApiInstanceAuth.post(`/posts/${postId}/like`);
      } else {
        await axiosApiInstanceAuth.delete(`/posts/${postId}/like`);
      }
    } catch {
      setLiked(!nowLiked);
      setLikeCount((c) => c + (nowLiked ? -1 : 1));
      dispatch(toggleLikedPost(postIdNum));
    } finally {
      inFlight.current = false;
    }
  };

  return (
    <button
      type="button"
      onClick={handleLike}
      className={`flex items-center gap-1.5 text-xs transition-colors duration-150 ${
        isOwner ? "text-white/15 cursor-not-allowed" : liked ? "text-red" : "text-white/30 hover:text-white/60"
      } ${!isLoggedIn || isOwner ? "cursor-default" : "cursor-pointer"} ${className}`}
    >
      <FontAwesomeIcon
        icon={faHeart}
        className={`text-[11px] transition-transform duration-150 ${liked ? "scale-110" : "scale-100"}`}
      />
      <span className="font-medium">{likeCount.toLocaleString()}</span>
      <span className={liked ? "text-red/60" : "text-white/20"}>{likeCount === 1 ? "like" : "likes"}</span>
    </button>
  );
};

export default LikeButton;
