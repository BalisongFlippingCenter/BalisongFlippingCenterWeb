import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft, faEnvelope, faPaperPlane, faCircleUser, faEllipsisV, faTrash,
  faPaperclip, faTimes, faReply, faPen, faFlag,
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "motion/react";
import { axiosApiInstanceAuth } from "../api/axios";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  setConversations, setMessages, prependMessages,
  markConversationRead, addMessage, updateMessage,
} from "../redux/messages/messagesSlice";
import { ConversationDto, MessageDto } from "../modals/Message";

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)  return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

// ── Avatar ────────────────────────────────────────────────────────────────────

const Avatar = ({ img, size = "md" }: { name: string; img: string | null; size?: "sm" | "md" | "lg" }) => {
  const cls = size === "sm" ? "w-8 h-8 text-sm" : size === "lg" ? "w-12 h-12 text-lg" : "w-10 h-10 text-base";
  return (
    <div className={`${cls} rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center bg-blue-primary/20 border border-blue-primary/25`}>
      {img
        ? <img src={img} alt="" className="w-full h-full object-cover" />
        : <FontAwesomeIcon icon={faCircleUser} className="text-blue-primary/70" />
      }
    </div>
  );
};

// ── Conversation row ──────────────────────────────────────────────────────────

const ConvRow = ({ conv, isActive, onClick }: { conv: ConversationDto; isActive: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 ${
      isActive ? "bg-blue-primary/10" : "hover:bg-white/[0.03]"
    }`}
  >
    <Avatar name={conv.otherDisplayName} img={conv.otherProfileImg} />
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[15px] font-semibold truncate ${conv.unreadCount > 0 ? "text-white" : "text-white/75"}`}>
          {conv.otherDisplayName}
        </span>
        <span className="text-[11px] text-white/30 flex-shrink-0">{formatTime(conv.lastMessageAt)}</span>
      </div>
      <div className="flex items-center justify-between gap-2 mt-0.5">
        <span className={`text-[13px] truncate ${conv.unreadCount > 0 ? "text-white/70" : "text-white/35"}`}>
          {conv.lastMessagePreview}
        </span>
        {conv.unreadCount > 0 && (
          <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-primary text-white text-[9px] font-bold flex items-center justify-center">
            {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
          </span>
        )}
      </div>
    </div>
  </button>
);

// ── Message bubble ────────────────────────────────────────────────────────────

interface BubbleProps {
  msg: MessageDto;
  isMine: boolean;
  onReply: (msg: MessageDto) => void;
  onEdit:  (msg: MessageDto) => void;
  onDelete:(msg: MessageDto) => void;
  onFlag:  (msg: MessageDto) => void;
}

const Bubble = ({ msg, isMine, onReply, onEdit, onDelete, onFlag }: BubbleProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  if (msg.isDeleted) {
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1.5`}>
        <p className="text-white/25 text-[13px] italic px-1">This message was deleted</p>
      </div>
    );
  }

  const hasMedia = !!msg.mediaUrl;
  const hasBody  = !!msg.body;

  const MenuBtn = (
    <div className="relative flex-shrink-0 self-center">
      <button
        type="button"
        onClick={() => setMenuOpen((p) => !p)}
        className="w-6 h-6 flex items-center justify-center text-white/20 hover:text-white/60 transition-colors duration-150"
      >
        <FontAwesomeIcon icon={faEllipsisV} className="text-[11px]" />
      </button>
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* backdrop to close */}
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 4 }}
              animate={{ opacity: 1, scale: 1,    y: 0 }}
              exit={{    opacity: 0, scale: 0.92, y: 4 }}
              transition={{ duration: 0.1 }}
              className={`absolute bottom-full mb-1.5 z-20 w-36 rounded-xl overflow-hidden ${isMine ? "right-0" : "left-0"}`}
              style={{ background: "#1a1d25", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}
            >
              {isMine ? (
                <>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onEdit(msg); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-white/70 hover:bg-white/[0.06] text-[13px] transition-colors duration-150"
                  >
                    <FontAwesomeIcon icon={faPen} className="text-[11px] text-white/40 w-3" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onDelete(msg); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-red/70 hover:bg-red/10 text-[13px] transition-colors duration-150"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-[11px] w-3" />
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onReply(msg); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-white/70 hover:bg-white/[0.06] text-[13px] transition-colors duration-150"
                  >
                    <FontAwesomeIcon icon={faReply} className="text-[11px] text-white/40 w-3" />
                    Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onFlag(msg); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-white/70 hover:bg-white/[0.06] text-[13px] transition-colors duration-150"
                  >
                    <FontAwesomeIcon icon={faFlag} className="text-[11px] text-white/40 w-3" />
                    Flag
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1.5 group`}>
      <div className={`flex items-end gap-1 max-w-[80%] ${isMine ? "flex-row-reverse" : ""}`}>
        {/* Bubble column */}
        <div className={`flex flex-col ${isMine ? "items-end" : "items-start"} flex-1 min-w-0`}>
          {/* Reply preview */}
          {msg.replyToId && (
            <div
              className={`mb-1 border-l-2 border-blue-primary/50 pl-2 pr-3 py-1 rounded-r-lg max-w-full ${
                isMine ? "bg-white/[0.04]" : "bg-white/[0.04]"
              }`}
              style={{ maxWidth: "240px" }}
            >
              <p className="text-blue-primary text-[10px] font-semibold truncate leading-tight">
                {msg.replyPreviewSenderName ?? "Unknown"}
              </p>
              <p className="text-white/40 text-[11px] truncate leading-tight">
                {msg.replyPreviewBody === "" ? "Deleted message" : (msg.replyPreviewBody ?? "[Media]")}
              </p>
            </div>
          )}

          {/* Main bubble */}
          <div
            className={`rounded-2xl text-[15px] leading-relaxed overflow-hidden ${
              isMine
                ? "bg-blue-primary text-white rounded-br-sm"
                : "bg-white/[0.07] text-white/85 rounded-bl-sm"
            } ${!hasMedia ? "px-3.5 py-2" : ""}`}
          >
            {hasMedia && !msg.isVideo && (
              <img src={msg.mediaUrl!} alt="" className="block w-full max-w-[240px] object-cover" />
            )}
            {hasMedia && msg.isVideo && (
              <video src={msg.mediaUrl!} controls className="block w-full max-w-[240px]" />
            )}
            {hasBody && (
              <p className={hasMedia ? "px-3.5 pt-2" : ""}>{msg.body}</p>
            )}
            <div className={`text-[11px] mt-1 ${isMine ? "text-white/50 text-right" : "text-white/30"} ${hasMedia ? "px-3.5 pb-2" : ""}`}>
              {new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {msg.editedAt && <span className="ml-1 opacity-70">· Edited</span>}
              {isMine && msg.readAt && <span className="ml-1">· Read</span>}
            </div>
          </div>
        </div>

        {/* Context menu button */}
        {MenuBtn}
      </div>
    </div>
  );
};

// ── Inbox panel ───────────────────────────────────────────────────────────────

interface InboxProps {
  conversations: ConversationDto[];
  loading: boolean;
  activeId: string | null;
  onSelect: (conv: ConversationDto) => void;
}

const Inbox = ({ conversations, loading, activeId, onSelect }: InboxProps) => (
  <div className="flex flex-col h-full">
    <div className="px-4 py-4 border-b border-white/[0.06] flex-shrink-0">
      <h1 className="text-white font-bold text-xl">Messages</h1>
    </div>

    <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 rounded-full border-2 border-blue-primary border-t-transparent animate-spin" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 px-6 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: "rgba(16,129,152,0.08)", border: "1px solid rgba(16,129,152,0.15)" }}>
            <FontAwesomeIcon icon={faEnvelope} className="text-blue-primary/40 text-xl" />
          </div>
          <p className="text-white/40 text-sm font-medium">No messages yet</p>
          <p className="text-white/25 text-xs leading-relaxed">
            Visit someone's profile and tap Message to start a conversation.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {conversations.map((conv) => (
            <ConvRow key={conv.id} conv={conv} isActive={conv.id === activeId} onClick={() => onSelect(conv)} />
          ))}
        </div>
      )}
    </div>
  </div>
);

// ── Chat panel ────────────────────────────────────────────────────────────────

interface ChatProps {
  conv: ConversationDto | null;
  newRecipient: NewRecipient | null;
  messages: MessageDto[];
  myId: string;
  onBack: () => void;
  onDelete: (convId: string) => void;
  onMessageSent: (msg: MessageDto, conv: ConversationDto) => void;
}

interface NewRecipient {
  id: string;
  displayName: string;
  identifierCode: string;
  profileImg: string | null;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 150 * 1024 * 1024;
const PAGE_SIZE = 30;

const ChatPanel = ({ conv, newRecipient, messages, myId, onBack, onDelete, onMessageSent }: ChatProps) => {
  const [body,          setBody]          = useState("");
  const [sending,       setSending]       = useState(false);
  const [loadingMore,   setLoadingMore]   = useState(false);
  const [hasMore,       setHasMore]       = useState(false);
  const [page,          setPage]          = useState(0);
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [attachedFile,  setAttachedFile]  = useState<File | null>(null);
  const [attachPreview, setAttachPreview] = useState<string | null>(null);
  const [replyTo,       setReplyTo]       = useState<MessageDto | null>(null);
  const [editingMsg,    setEditingMsg]    = useState<MessageDto | null>(null);
  const [editBody,      setEditBody]      = useState("");
  const [editSaving,    setEditSaving]    = useState(false);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const dispatch     = useAppDispatch();

  const recipientId = conv?.otherParticipantId ?? newRecipient?.id ?? "";
  const displayName = conv?.otherDisplayName   ?? newRecipient?.displayName ?? "";
  const identCode   = conv?.otherIdentifierCode ?? newRecipient?.identifierCode ?? "";
  const profileImg  = conv?.otherProfileImg    ?? newRecipient?.profileImg ?? null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!conv) return;
    setPage(0);
    setHasMore(false);
    axiosApiInstanceAuth
      .get(`/conversations/${conv.id}/messages`, { params: { page: 0, size: PAGE_SIZE } })
      .then((res) => {
        const content: MessageDto[] = res.data?.content ?? res.data ?? [];
        const total: number = res.data?.totalPages ?? 1;
        dispatch(setMessages({ conversationId: conv.id, messages: content.reverse() }));
        setHasMore(total > 1);
      })
      .catch(() => {});

    dispatch(markConversationRead(conv.id));
    axiosApiInstanceAuth.patch(`/conversations/${conv.id}/read`).catch(() => {});
  }, [conv?.id]);

  const loadMore = () => {
    if (!conv || loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    axiosApiInstanceAuth
      .get(`/conversations/${conv.id}/messages`, { params: { page: nextPage, size: PAGE_SIZE } })
      .then((res) => {
        const content: MessageDto[] = res.data?.content ?? res.data ?? [];
        const total: number = res.data?.totalPages ?? 1;
        dispatch(prependMessages({ conversationId: conv.id, messages: content.reverse() }));
        setHasMore(nextPage < total - 1);
        setPage(nextPage);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

  const removeAttachment = () => {
    if (attachPreview) URL.revokeObjectURL(attachPreview);
    setAttachedFile(null);
    setAttachPreview(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVid = file.type.startsWith("video/");
    const maxBytes = isVid ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      alert(isVid ? "Videos must be under 150 MB." : "Images must be under 10 MB.");
      e.target.value = "";
      return;
    }
    if (attachPreview) URL.revokeObjectURL(attachPreview);
    setAttachedFile(file);
    setAttachPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const enterEditMode = (msg: MessageDto) => {
    setEditingMsg(msg);
    setEditBody(msg.body);
    setReplyTo(null);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const cancelEdit = () => {
    setEditingMsg(null);
    setEditBody("");
  };

  const handleEditSave = async () => {
    if (!editingMsg || !editBody.trim() || editSaving) return;
    setEditSaving(true);
    try {
      const res = await axiosApiInstanceAuth.patch(
        `/conversations/messages/${editingMsg.id}`,
        { body: editBody.trim() }
      );
      dispatch(updateMessage(res.data));
      setEditingMsg(null);
      setEditBody("");
    } catch {
      // silent
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteMsg = async (msg: MessageDto) => {
    try {
      const res = await axiosApiInstanceAuth.delete(`/conversations/messages/${msg.id}`);
      dispatch(updateMessage(res.data));
    } catch {
      // silent
    }
  };

  const handleFlagMsg = async (msg: MessageDto) => {
    try {
      await axiosApiInstanceAuth.post("/reports", {
        targetType: "MESSAGE",
        targetId: Number(msg.id),
        reason: "INAPPROPRIATE",
        additionalNote: null,
      });
    } catch {
      // silent
    }
  };

  const handleSend = async () => {
    const trimmed = body.trim();
    if ((!trimmed && !attachedFile) || !recipientId || sending) return;
    setSending(true);
    try {
      const formData = new FormData();
      if (trimmed) formData.append("body", trimmed);
      if (attachedFile) formData.append("mediaFile", attachedFile);
      if (replyTo) formData.append("replyToId", replyTo.id);

      const res = await axiosApiInstanceAuth.post(
        `/conversations/${recipientId}/messages`,
        formData
      );
      const sentMsg: MessageDto = res.data?.message ?? res.data;
      const updatedConv: ConversationDto | null = res.data?.conversation ?? null;
      setBody("");
      removeAttachment();
      setReplyTo(null);
      if (sentMsg) dispatch(addMessage(sentMsg));
      if (sentMsg && updatedConv) onMessageSent(sentMsg, updatedConv);
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (editingMsg) handleEditSave(); else handleSend();
    }
    if (e.key === "Escape" && editingMsg) cancelEdit();
  };

  if (!conv && !newRecipient) return null;

  const isEditing = editingMsg !== null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06] flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="md:hidden w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-colors duration-200 flex-shrink-0"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
        </button>

        <Avatar name={displayName} img={profileImg} size="sm" />

        <div className="flex-1 min-w-0">
          <p className="text-white text-[16px] font-semibold leading-tight truncate">{displayName}</p>
          {identCode && <p className="text-white/30 text-[13px]">#{identCode}</p>}
        </div>

        {conv && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((p) => !p)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all duration-150"
            >
              <FontAwesomeIcon icon={faEllipsisV} className="text-sm" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1,    y: 0  }}
                  exit={{    opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1.5 w-40 rounded-xl overflow-hidden z-10"
                  style={{ background: "#1a1d25", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}
                >
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onDelete(conv.id); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-3 text-red/70 hover:bg-red/10 text-sm transition-colors duration-150"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                    Delete conversation
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: "none" }}>
        {hasMore && (
          <div className="flex justify-center mb-4">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="text-blue-primary/70 text-sm hover:text-blue-primary transition-colors duration-150 disabled:opacity-40"
            >
              {loadingMore ? "Loading..." : "Load earlier messages"}
            </button>
          </div>
        )}

        {messages.length === 0 && !conv && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <Avatar name={displayName} img={profileImg} size="lg" />
            <div>
              <p className="text-white/60 text-sm font-medium">{displayName}</p>
              <p className="text-white/30 text-xs mt-1">Send a message to start the conversation.</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <Bubble
            key={msg.id}
            msg={msg}
            isMine={msg.senderId === myId}
            onReply={setReplyTo}
            onEdit={enterEditMode}
            onDelete={handleDeleteMsg}
            onFlag={handleFlagMsg}
          />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-4 pt-2 border-t border-white/[0.06]" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>

        {/* Edit mode bar */}
        {isEditing && (
          <div className="mb-2 flex items-center gap-2 border-l-2 border-gold/60 pl-3 pr-2 py-1.5 bg-white/[0.03] rounded-r-lg">
            <div className="flex-1 min-w-0">
              <p className="text-gold text-[11px] font-semibold">Editing message</p>
              <p className="text-white/35 text-[11px] truncate">{editingMsg?.body}</p>
            </div>
            <button type="button" onClick={cancelEdit} className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0 w-5 h-5 flex items-center justify-center">
              <FontAwesomeIcon icon={faTimes} className="text-xs" />
            </button>
          </div>
        )}

        {/* Reply bar */}
        {!isEditing && replyTo && (
          <div className="mb-2 flex items-center gap-2 border-l-2 border-blue-primary/60 pl-3 pr-2 py-1.5 bg-white/[0.03] rounded-r-lg">
            <div className="flex-1 min-w-0">
              <p className="text-blue-primary text-[11px] font-semibold">
                Replying to {replyTo.replyPreviewSenderName ?? displayName}
              </p>
              <p className="text-white/35 text-[11px] truncate">
                {replyTo.body || (replyTo.isVideo ? "[Video]" : "[Photo]")}
              </p>
            </div>
            <button type="button" onClick={() => setReplyTo(null)} className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0 w-5 h-5 flex items-center justify-center">
              <FontAwesomeIcon icon={faTimes} className="text-xs" />
            </button>
          </div>
        )}

        {/* Attachment preview */}
        {!isEditing && attachPreview && attachedFile && (
          <div className="mb-2 relative inline-block">
            {attachedFile.type.startsWith("video/") ? (
              <video src={attachPreview} className="h-20 rounded-xl object-cover" />
            ) : (
              <img src={attachPreview} alt="" className="h-20 rounded-xl object-cover" />
            )}
            <button
              type="button"
              onClick={removeAttachment}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black/80 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors duration-150"
            >
              <FontAwesomeIcon icon={faTimes} className="text-[9px]" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Attachment button (hidden in edit mode) */}
          {!isEditing && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all duration-150 flex-shrink-0"
              >
                <FontAwesomeIcon icon={faPaperclip} className="text-sm" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </>
          )}

          <textarea
            ref={textareaRef}
            value={isEditing ? editBody : body}
            onChange={(e) => isEditing ? setEditBody(e.target.value) : setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isEditing ? "Edit message..." : "Message..."}
            rows={1}
            className="flex-1 bg-white/[0.05] border border-white/[0.09] rounded-2xl px-4 py-3 text-[15px] text-white placeholder-white/25 focus:outline-none focus:border-blue-primary/40 resize-none transition-colors duration-150 leading-relaxed"
            style={{ maxHeight: "120px", overflowY: "auto", scrollbarWidth: "none" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
          />

          <button
            type="button"
            onClick={isEditing ? handleEditSave : handleSend}
            disabled={isEditing ? (!editBody.trim() || editSaving) : ((!body.trim() && !attachedFile) || sending)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-primary hover:bg-blue-primary/80 disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-150 flex-shrink-0"
          >
            <FontAwesomeIcon icon={faPaperPlane} className="text-white text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const MessagesPage = () => {
  const dispatch    = useAppDispatch();
  const navigate    = useNavigate();
  const location    = useLocation();
  const { conversationId } = useParams<{ conversationId?: string }>();

  const myId          = useAppSelector((state) => state.auth.user?.id ?? "");
  const conversations = useAppSelector((state) => state.messages.conversations);
  const allMessages   = useAppSelector((state) => state.messages.messages);

  const [loading,      setLoading]      = useState(false);
  const [activeConv,   setActiveConv]   = useState<ConversationDto | null>(null);
  const [newRecipient, setNewRecipient] = useState<NewRecipient | null>(null);
  const [showChat,     setShowChat]     = useState(false);

  const locationState = location.state as { recipient?: NewRecipient } | null;

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const found = conversations.find((c) => String(c.id) === String(conversationId));
      if (found) { setActiveConv(found); setShowChat(true); }
    }

    setLoading(true);
    axiosApiInstanceAuth
      .get("/conversations/me")
      .then((res) => {
        const convs: ConversationDto[] = res.data ?? [];
        dispatch(setConversations(convs));

        if (conversationId) {
          const found = convs.find((c) => String(c.id) === String(conversationId));
          if (found) { setActiveConv(found); setShowChat(true); }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!locationState?.recipient) return;
    const r = locationState.recipient;
    const existing = conversations.find((c) => c.otherParticipantId === r.id);
    if (existing) {
      setActiveConv(existing);
      setNewRecipient(null);
    } else {
      setActiveConv(null);
      setNewRecipient(r);
    }
    setShowChat(true);
    navigate("/messages", { replace: true, state: null });
  }, [locationState?.recipient?.id]);

  const activeMessages = activeConv ? (allMessages[activeConv.id] ?? []) : [];

  const handleSelectConv = (conv: ConversationDto) => {
    setActiveConv(conv);
    setNewRecipient(null);
    setShowChat(true);
    navigate(`/messages/${conv.id}`, { replace: true });
  };

  const handleBack = () => {
    setShowChat(false);
    setActiveConv(null);
    setNewRecipient(null);
    navigate("/messages", { replace: true });
  };

  const handleDeleteConv = async (convId: string) => {
    try {
      await axiosApiInstanceAuth.delete(`/conversations/${convId}`);
      dispatch(setConversations(conversations.filter((c) => c.id !== convId)));
      handleBack();
    } catch {
      // silent
    }
  };

  const handleMessageSent = (_msg: MessageDto, updatedConv: ConversationDto) => {
    if (!activeConv) {
      setActiveConv(updatedConv);
      setNewRecipient(null);
      navigate(`/messages/${updatedConv.id}`, { replace: true });
    }
    dispatch(setConversations(
      [updatedConv, ...conversations.filter((c) => c.id !== updatedConv.id)]
    ));
  };

  const chatMessages = activeConv ? (allMessages[activeConv.id] ?? []) : [];
  void activeMessages;

  return (
    <div className="w-full" style={{ background: "#080a0e" }}>
      {/* Mobile */}
      <div className="md:hidden w-full flex flex-col" style={{ minHeight: "100dvh" }}>
        <AnimatePresence mode="wait">
          {!showChat ? (
            <motion.div
              key="inbox"
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0,       opacity: 1 }}
              exit={{    x: "-100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              className="flex-1 flex flex-col"
            >
              <Inbox
                conversations={conversations}
                loading={loading}
                activeId={activeConv?.id ?? null}
                onSelect={handleSelectConv}
              />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0,      opacity: 1 }}
              exit={{    x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              className="fixed inset-0 flex flex-col"
              style={{ zIndex: 50, background: "#080a0e" }}
            >
              <ChatPanel
                conv={activeConv}
                newRecipient={newRecipient}
                messages={chatMessages}
                myId={myId}
                onBack={handleBack}
                onDelete={handleDeleteConv}
                onMessageSent={handleMessageSent}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop: side-by-side */}
      <div className="hidden md:flex w-full overflow-hidden" style={{ height: "calc(100vh - 176px)" }}>
        <div className="w-80 flex-shrink-0 border-r border-white/[0.06] flex flex-col h-full">
          <Inbox
            conversations={conversations}
            loading={loading}
            activeId={activeConv?.id ?? null}
            onSelect={handleSelectConv}
          />
        </div>

        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {activeConv || newRecipient ? (
            <ChatPanel
              conv={activeConv}
              newRecipient={newRecipient}
              messages={chatMessages}
              myId={myId}
              onBack={handleBack}
              onDelete={handleDeleteConv}
              onMessageSent={handleMessageSent}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(16,129,152,0.08)", border: "1px solid rgba(16,129,152,0.15)" }}>
                <FontAwesomeIcon icon={faEnvelope} className="text-blue-primary/40 text-2xl" />
              </div>
              <div>
                <p className="text-white/40 text-sm font-medium">Select a conversation</p>
                <p className="text-white/25 text-xs mt-1">or visit a profile to start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
