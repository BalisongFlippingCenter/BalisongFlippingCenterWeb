import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import { motion, useAnimation } from "motion/react";
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
  const inFlight     = useRef(false);
  const heartControls = useAnimation();

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn || isOwner || inFlight.current) return;
    inFlight.current = true;
    const nowLiked = !liked;
    setLiked(nowLiked);
    setLikeCount((c) => c + (nowLiked ? 1 : -1));
    dispatch(toggleLikedPost(postIdNum));
    if (nowLiked) {
      heartControls.start({
        scale: [1, 1.5, 0.8, 1.2, 1],
        transition: { duration: 0.4, times: [0, 0.2, 0.5, 0.75, 1] },
      });
    }
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
        isOwner ? "text-white/15 cursor-not-allowed" : liked ? "text-red" : "text-white/55 hover:text-white/80"
      } ${!isLoggedIn || isOwner ? "cursor-default" : "cursor-pointer"} ${className}`}
    >
      <motion.span animate={heartControls} className="inline-flex items-center justify-center">
        <FontAwesomeIcon icon={faHeart} className="text-[11px]" />
      </motion.span>
      <span className="font-medium">{likeCount.toLocaleString()}</span>
      <span className={liked ? "text-red/70" : "text-white/40"}>{likeCount === 1 ? "like" : "likes"}</span>
    </button>
  );
};

export default LikeButton;
