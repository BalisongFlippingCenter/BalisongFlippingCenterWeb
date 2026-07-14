import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark, faHeart, faComment, faUserPlus, faReply, faEnvelope, faCircleUser,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { removeToast, NotificationToast } from "../redux/notifications/notificationSlice";
import { removeMessageToast } from "../redux/messages/messagesSlice";
import { MessageToast } from "../modals/Message";

const TOAST_DURATION = 4500;

const typeConfig = (type: string) => {
  switch (type) {
    case "NEW_FOLLOWER":    return { icon: faUserPlus, color: "text-white", bg: "bg-blue-primary border-blue-primary/60" };
    case "POST_LIKED":
    case "COMMENT_LIKED":  return { icon: faHeart,    color: "text-white", bg: "bg-red border-red/60" };
    case "POST_COMMENTED": return { icon: faComment,  color: "text-white", bg: "bg-green border-green/60" };
    case "COMMENT_REPLIED":return { icon: faReply,    color: "text-white", bg: "bg-gold border-gold/60" };
    case "MESSAGE_RECEIVED": return { icon: faEnvelope, color: "text-white", bg: "bg-blue-primary border-blue-primary/60" };
    default:               return { icon: faComment,  color: "text-white", bg: "bg-white/20 border-white/10" };
  }
};

const actionText = (type: string): string => {
  switch (type) {
    case "NEW_FOLLOWER":    return "started following you";
    case "POST_LIKED":      return "liked your post";
    case "POST_COMMENTED":  return "commented on your post";
    case "COMMENT_REPLIED": return "replied to your comment";
    case "COMMENT_LIKED":   return "liked your comment";
    case "MESSAGE_RECEIVED": return "sent you a message";
    default:                return "";
  }
};

const getPath = (n: NotificationToast["notification"]): string => {
  switch (n.type) {
    case "NEW_FOLLOWER":    return `/${n.actorDisplayName}/${n.actorIdentifierCode}`;
    case "POST_LIKED":
    case "POST_COMMENTED":  return `/post/${n.targetId}`;
    case "COMMENT_REPLIED":
    case "COMMENT_LIKED":   return `/post/${n.targetId}?focus=comments`;
    case "MESSAGE_RECEIVED": return `/messages`;
    default:                return "/";
  }
};

const Toast = ({ toast }: { toast: NotificationToast }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { icon, color, bg } = typeConfig(toast.notification.type);
  const n = toast.notification;

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeToast(toast.toastId)), TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [toast.toastId]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.96 }}
      animate={{ opacity: 1, x: 0,  scale: 1 }}
      exit={{    opacity: 0, x: 60, scale: 0.96 }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="flex items-center gap-3 w-72 md:w-80 cursor-pointer"
      style={{
        background: "#13161d",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.7)",
        padding: "12px 14px",
      }}
      onClick={() => {
        navigate(getPath(n));
        dispatch(removeToast(toast.toastId));
      }}
    >
      {/* Actor avatar + type badge */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-primary/20 border border-blue-primary/30 flex items-center justify-center">
          {n.actorProfileImg ? (
            <img src={n.actorProfileImg} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-blue-primary text-sm font-bold">
              {n.actorDisplayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#13161d] flex items-center justify-center ${bg}`}>
          <FontAwesomeIcon icon={icon} className={`text-[7px] ${color}`} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">
          <span className="font-semibold text-white">{n.actorDisplayName}</span>
          <span className="text-white/30 text-[11px]"> #{n.actorIdentifierCode}</span>
          <span className="text-white/70"> {actionText(n.type)}</span>
        </p>
        <p className="text-white/30 text-[11px] mt-0.5">Just now</p>
      </div>

      {/* Dismiss */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); dispatch(removeToast(toast.toastId)); }}
        className="text-white/20 hover:text-white/50 transition-colors duration-150 flex-shrink-0"
      >
        <FontAwesomeIcon icon={faXmark} className="text-xs" />
      </button>
    </motion.div>
  );
};

const TOAST_DURATION_MSG = 5000;

const MessageToastItem = ({ toast }: { toast: MessageToast }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeMessageToast(toast.toastId)), TOAST_DURATION_MSG);
    return () => clearTimeout(timer);
  }, [toast.toastId]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.96 }}
      animate={{ opacity: 1, x: 0,  scale: 1 }}
      exit={{    opacity: 0, x: 60, scale: 0.96 }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="flex items-center gap-3 w-72 md:w-80 cursor-pointer"
      style={{
        background:   "#13161d",
        border:       "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        boxShadow:    "0 8px 40px rgba(0,0,0,0.7)",
        padding:      "12px 14px",
      }}
      onClick={() => {
        navigate(`/messages/${toast.conversationId}`);
        dispatch(removeMessageToast(toast.toastId));
      }}
    >
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-primary/20 border border-blue-primary/30 flex items-center justify-center">
          {toast.senderImg
            ? <img src={toast.senderImg} alt="" className="w-full h-full object-cover" />
            : <FontAwesomeIcon icon={faCircleUser} className="text-blue-primary/70 text-xl" />
          }
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#13161d] flex items-center justify-center bg-blue-primary border-blue-primary/60">
          <FontAwesomeIcon icon={faEnvelope} className="text-[7px] text-white" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">
          <span className="font-semibold text-white">{toast.senderName}</span>
          {toast.senderCode && <span className="text-white/30 text-[11px]"> #{toast.senderCode}</span>}
        </p>
        <p className="text-white/55 text-[12px] mt-0.5 truncate">{toast.preview}</p>
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); dispatch(removeMessageToast(toast.toastId)); }}
        className="text-white/20 hover:text-white/50 transition-colors duration-150 flex-shrink-0"
      >
        <FontAwesomeIcon icon={faXmark} className="text-xs" />
      </button>
    </motion.div>
  );
};

const NotificationToastContainer = () => {
  const toasts        = useAppSelector((state) => state.notifications.toasts);
  const messageToasts = useAppSelector((state) => state.messages.messageToasts);
  const visibleNotifs = toasts.slice(-4);
  const visibleMsgs   = messageToasts.slice(-2);

  return (
    <div className="hidden md:flex fixed bottom-8 right-8 z-[200] flex-col gap-2.5 items-end pointer-events-none">
      <AnimatePresence mode="sync">
        {visibleNotifs.map((toast) => (
          <div key={toast.toastId} className="pointer-events-auto">
            <Toast toast={toast} />
          </div>
        ))}
        {visibleMsgs.map((toast) => (
          <div key={toast.toastId} className="pointer-events-auto">
            <MessageToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationToastContainer;
