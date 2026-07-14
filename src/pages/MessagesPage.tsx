import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft, faEnvelope, faPaperPlane, faCircleUser, faEllipsisV, faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "motion/react";
import { axiosApiInstanceAuth } from "../api/axios";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  setConversations, setMessages, prependMessages,
  markConversationRead, addMessage,
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

const Bubble = ({ msg, isMine }: { msg: MessageDto; isMine: boolean }) => (
  <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1.5`}>
    <div
      className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-[15px] leading-relaxed ${
        isMine
          ? "bg-blue-primary text-white rounded-br-sm"
          : "bg-white/[0.07] text-white/85 rounded-bl-sm"
      }`}
    >
      {msg.body}
      <div className={`text-[11px] mt-1 ${isMine ? "text-white/50 text-right" : "text-white/30"}`}>
        {new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        {isMine && msg.readAt && <span className="ml-1">· Read</span>}
      </div>
    </div>
  </div>
);

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

const PAGE_SIZE = 30;

const ChatPanel = ({ conv, newRecipient, messages, myId, onBack, onDelete, onMessageSent }: ChatProps) => {
  const [body,         setBody]         = useState("");
  const [sending,      setSending]      = useState(false);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [hasMore,      setHasMore]      = useState(false);
  const [page,         setPage]         = useState(0);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const dispatch  = useAppDispatch();

  const recipientId   = conv?.otherParticipantId ?? newRecipient?.id ?? "";
  const displayName   = conv?.otherDisplayName   ?? newRecipient?.displayName ?? "";
  const identCode     = conv?.otherIdentifierCode ?? newRecipient?.identifierCode ?? "";
  const profileImg    = conv?.otherProfileImg    ?? newRecipient?.profileImg    ?? null;

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Fetch messages for existing conversation
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

    // Mark as read
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

  const handleSend = async () => {
    const trimmed = body.trim();
    if (!trimmed || !recipientId || sending) return;
    setSending(true);
    try {
      const res = await axiosApiInstanceAuth.post(
        `/conversations/${recipientId}/messages`,
        { body: trimmed }
      );
      const sentMsg: MessageDto         = res.data?.message      ?? res.data;
      const updatedConv: ConversationDto | null = res.data?.conversation ?? null;
      setBody("");
      if (sentMsg) {
        dispatch(addMessage(sentMsg));
      }
      if (sentMsg && updatedConv) {
        onMessageSent(sentMsg, updatedConv);
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!conv && !newRecipient) return null;

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
          <Bubble key={msg.id} msg={msg} isMine={msg.senderId === myId} />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 pt-2 border-t border-white/[0.06]" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
        <div className="flex items-end gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
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
            onClick={handleSend}
            disabled={!body.trim() || sending}
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

  const myId         = useAppSelector((state) => state.auth.user?.id ?? "");
  const conversations = useAppSelector((state) => state.messages.conversations);
  const allMessages  = useAppSelector((state) => state.messages.messages);

  const [loading,     setLoading]     = useState(false);
  const [activeConv,  setActiveConv]  = useState<ConversationDto | null>(null);
  const [newRecipient, setNewRecipient] = useState<NewRecipient | null>(null);
  const [showChat,    setShowChat]    = useState(false);

  // Parse recipient from navigation state (coming from profile "Message" button)
  const locationState = location.state as { recipient?: NewRecipient } | null;

  // Fetch inbox on mount
  useEffect(() => {
    // Try to open from already-loaded Redux state immediately (avoids waiting for API)
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

        // If opened via URL param and not yet resolved, find in fresh data
        if (conversationId) {
          const found = convs.find((c) => String(c.id) === String(conversationId));
          if (found) { setActiveConv(found); setShowChat(true); }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Handle "Message" button from profile page
  useEffect(() => {
    if (!locationState?.recipient) return;
    const r = locationState.recipient;
    // Check if a conversation with this person already exists
    const existing = conversations.find((c) => c.otherParticipantId === r.id);
    if (existing) {
      setActiveConv(existing);
      setNewRecipient(null);
    } else {
      setActiveConv(null);
      setNewRecipient(r);
    }
    setShowChat(true);
    // Clear the state so refreshing doesn't re-trigger
    navigate("/messages", { replace: true, state: null });
  }, [locationState?.recipient?.id]);

  // When WS pushes a new message to the active conversation, mark it read
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

  const handleDelete = async (convId: string) => {
    try {
      await axiosApiInstanceAuth.delete(`/conversations/${convId}`);
      dispatch(setConversations(conversations.filter((c) => c.id !== convId)));
      handleBack();
    } catch {
      // silent
    }
  };

  const handleMessageSent = (_msg: MessageDto, updatedConv: ConversationDto) => {
    // If this was a new conversation, update state with real conv data
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
  void activeMessages; // suppress unused warning — used via chatMessages

  return (
    <div className="w-full" style={{ background: "#080a0e" }}>
      {/* Mobile: stack inbox / chat */}
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
                onDelete={handleDelete}
                onMessageSent={handleMessageSent}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop: side-by-side. 80px header + 76px bottom nav + 20px gap */}
      <div className="hidden md:flex w-full overflow-hidden" style={{ height: "calc(100vh - 176px)" }}>
        {/* Inbox sidebar */}
        <div className="w-80 flex-shrink-0 border-r border-white/[0.06] flex flex-col h-full">
          <Inbox
            conversations={conversations}
            loading={loading}
            activeId={activeConv?.id ?? null}
            onSelect={handleSelectConv}
          />
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {activeConv || newRecipient ? (
            <ChatPanel
              conv={activeConv}
              newRecipient={newRecipient}
              messages={chatMessages}
              myId={myId}
              onBack={handleBack}
              onDelete={handleDelete}
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
