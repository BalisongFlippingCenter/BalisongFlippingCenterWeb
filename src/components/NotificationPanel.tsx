import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell, faHeart, faComment, faUserPlus, faReply, faArrowLeft, faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  setNotifications, markAllRead, markOneRead, AppNotification,
} from "../redux/notifications/notificationSlice";
import { axiosApiInstanceAuth } from "../api/axios";
import { formatDate } from "./FeedPostCard";

const typeConfig = (type: string) => {
  switch (type) {
    case "NEW_FOLLOWER":    return { icon: faUserPlus, bg: "bg-blue-primary",  border: "border-[#0d6478]" };
    case "POST_LIKED":
    case "COMMENT_LIKED":  return { icon: faHeart,    bg: "bg-red",           border: "border-[#7f1212]" };
    case "POST_COMMENTED": return { icon: faComment,  bg: "bg-green",         border: "border-[#15803d]" };
    case "COMMENT_REPLIED":return { icon: faReply,    bg: "bg-gold",          border: "border-[#a38000]" };
    default:               return { icon: faBell,     bg: "bg-white/20",      border: "border-white/10"  };
  }
};

const actionText = (type: string): string => {
  switch (type) {
    case "NEW_FOLLOWER":    return "started following you";
    case "POST_LIKED":      return "liked your post";
    case "POST_COMMENTED":  return "commented on your post";
    case "COMMENT_REPLIED": return "replied to your comment";
    case "COMMENT_LIKED":   return "liked your comment";
    default:                return "";
  }
};

const getPath = (n: AppNotification): string => {
  switch (n.type) {
    case "NEW_FOLLOWER":    return `/${n.actorDisplayName}/${n.actorIdentifierCode}`;
    case "POST_LIKED":
    case "POST_COMMENTED":  return `/post/${n.targetId}`;
    case "COMMENT_REPLIED":
    case "COMMENT_LIKED":   return `/post/${n.targetId}?focus=comments`;
    default:                return "/";
  }
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPanel = ({ isOpen, onClose }: Props) => {
  const dispatch   = useAppDispatch();
  const navigate   = useNavigate();
  const { notifications, unreadCount } = useAppSelector((state) => state.notifications);
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    // Optimistically clear unread indicators the moment the panel opens
    dispatch(markAllRead());
    setLoading(true);
    axiosApiInstanceAuth
      .get("/notifications", { params: { unreadOnly: false, page: 0, size: 20 } })
      .then((res) => {
        const items = (res.data?.content ?? res.data ?? []).map(
          (n: AppNotification) => ({ ...n, isRead: true })
        );
        dispatch(setNotifications(items));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // Persist to backend (fire-and-forget)
    axiosApiInstanceAuth.patch("/notifications/read-all").catch(() => {});
  }, [isOpen]);

  // Lock body scroll on mobile when overlay is open
  useEffect(() => {
    const isMobile = window.innerWidth < 950;
    if (isOpen && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleClick = async (n: AppNotification) => {
    if (!n.isRead) {
      try {
        await axiosApiInstanceAuth.patch(`/notifications/${n.id}/read`);
        dispatch(markOneRead(n.id));
      } catch {
        // navigate anyway
      }
    }
    navigate(getPath(n));
    onClose();
  };

  const header = (
    <div className="px-4 py-3.5 flex items-center justify-between flex-shrink-0"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="md:hidden text-white/40 hover:text-white transition-colors duration-150 w-8 h-8 flex items-center justify-center -ml-1 flex-shrink-0"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <FontAwesomeIcon
          icon={faBell}
          className={`text-sm ${unreadCount > 0 ? "text-blue-primary" : "text-white/30"}`}
        />
        <span className="text-white text-sm font-semibold tracking-wide">Notifications</span>
        {unreadCount > 0 && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
            style={{ background: "rgba(16,129,152,0.2)", color: "#108198", border: "1px solid rgba(16,129,152,0.35)" }}
          >
            {unreadCount}
          </span>
        )}
      </div>
    </div>
  );

  const list = (
    <div className="flex-1 overflow-y-auto md:max-h-[440px]" style={{ scrollbarWidth: "none" }}>
      {loading ? (
        <div className="flex items-center justify-center py-14">
          <div className="w-5 h-5 rounded-full border-2 border-blue-primary border-t-transparent animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-center px-6">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <FontAwesomeIcon icon={faBell} className="text-white/20 text-lg" />
          </div>
          <div>
            <p className="text-white/50 text-sm font-medium">All caught up</p>
            <p className="text-white/25 text-xs mt-0.5">No notifications yet</p>
          </div>
        </div>
      ) : (
        notifications.map((n, i) => {
          const { icon, bg, border } = typeConfig(n.type);
          return (
            <div key={n.id}>
              <button
                type="button"
                onClick={() => handleClick(n)}
                className="w-full flex items-center gap-3.5 px-4 py-4 text-left transition-all duration-150 relative group/notif"
                style={{
                  background: !n.isRead ? "rgba(16,129,152,0.13)" : "transparent",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = !n.isRead ? "rgba(16,129,152,0.2)" : "rgba(255,255,255,0.025)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = !n.isRead ? "rgba(16,129,152,0.13)" : "transparent"; }}
              >
                {/* Unread left accent */}
                {!n.isRead && (
                  <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-blue-primary" />
                )}

                {/* Avatar + type badge */}
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center"
                    style={{ background: "rgba(16,129,152,0.15)", border: "1.5px solid rgba(16,129,152,0.25)" }}>
                    {n.actorProfileImg ? (
                      <img src={n.actorProfileImg} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-blue-primary text-sm font-bold">
                        {n.actorDisplayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center ${bg} ${border}`}
                    style={{ border: `2px solid`, borderColor: "inherit" }}>
                    <FontAwesomeIcon icon={icon} className="text-white text-[8px]" />
                  </div>
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] leading-snug">
                    <span className={`font-semibold ${!n.isRead ? "text-white" : "text-white/75"}`}>
                      {n.actorDisplayName}
                    </span>
                    <span className="text-white/25 text-[11px] font-normal"> #{n.actorIdentifierCode}</span>
                  </p>
                  <p className={`text-[12px] mt-0.5 ${!n.isRead ? "text-white/70" : "text-white/40"}`}>
                    {actionText(n.type)}
                  </p>
                  <p className="text-white/25 text-[11px] mt-1">{formatDate(n.createdAt)}</p>
                </div>

                {/* Chevron (hover) + unread dot */}
                <div className="flex-shrink-0 w-5 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="text-white/0 group-hover/notif:text-white/30 transition-all duration-150 text-[11px]"
                  />
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full absolute right-4 group-hover/notif:opacity-0 transition-opacity duration-150" style={{ background: "#108198" }} />
                  )}
                </div>
              </button>

              {/* Inset separator */}
              {i < notifications.length - 1 && (
                <div className="ml-[72px] mr-4 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
              )}
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <>
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 280, mass: 0.9 }}
              className="fixed inset-0 flex flex-col md:hidden"
              style={{ background: "#0d0f14", zIndex: 9999 }}
            >
              {header}
              {list}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="hidden md:flex md:flex-col absolute top-full right-0 mt-[18px] w-80 rounded-2xl overflow-hidden z-50"
            style={{
              background: "#13161d",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 20px 60px rgba(0,0,0,0.9)",
            }}
          >
            {header}
            {list}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NotificationPanel;
