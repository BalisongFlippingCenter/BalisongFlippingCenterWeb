import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faPaperPlane, faTrash } from "@fortawesome/free-solid-svg-icons";
import { streamAiChat } from "../../api/aiChat";
import { getAiChatSessionId, resetAiChatSessionId } from "../../utils/aiChatSession";
import { useAppSelector } from "../../redux/hooks";
import BalisongMark from "../icons/BalisongMark";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const LINK_PATTERN = /(?<=^|\s|\()(https?:\/\/[^\s]+|\/[\w-]+(?:\/[\w-]+)*\/?)/g;
const TRAILING_PUNCTUATION = /[.,!?;:)\]]+$/;

const renderMessageContent = (content: string) => {
  const sanitized = content.replace(/\*\*/g, "").replace(/`/g, "");
  const segments = sanitized.split(LINK_PATTERN);
  return segments.map((segment, i) => {
    if (i % 2 === 0) return segment;

    const trailingMatch = segment.match(TRAILING_PUNCTUATION);
    const trailing = trailingMatch ? trailingMatch[0] : "";
    const link = trailing ? segment.slice(0, -trailing.length) : segment;

    return (
      <Fragment key={i}>
        {link.startsWith("http") ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-latch underline hover:text-latch/80"
          >
            {link}
          </a>
        ) : (
          <Link to={link} className="text-latch underline hover:text-latch/80">
            {link}
          </Link>
        )}
        {trailing}
      </Fragment>
    );
  });
};

const WORD_REVEAL_INTERVAL_MS = 40;

const nextWordBoundary = (content: string, from: number): number => {
  const nextSpace = content.indexOf(" ", from);
  return nextSpace === -1 ? content.length : nextSpace + 1;
};

const AiChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [typingIndex, setTypingIndex] = useState<number | null>(null);
  const [revealLength, setRevealLength] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef(getAiChatSessionId());
  const location = useLocation();
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, revealLength]);

  useEffect(() => {
    if (typingIndex === null) return;
    const target = messages[typingIndex]?.content.length ?? 0;
    if (revealLength >= target) {
      if (!isStreaming) setTypingIndex(null);
      return;
    }
    const timer = setTimeout(() => {
      setRevealLength(nextWordBoundary(messages[typingIndex].content, revealLength));
    }, WORD_REVEAL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [typingIndex, revealLength, messages, isStreaming]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const assistantIndex = messages.length + 1;
    setMessages((prev) => [...prev, { role: "user", content: trimmed }, { role: "assistant", content: "" }]);
    setTypingIndex(assistantIndex);
    setRevealLength(0);
    setInput("");
    setIsStreaming(true);

    try {
      await streamAiChat({
        sessionId: sessionIdRef.current,
        message: trimmed,
        accessToken,
        currentPath: location.pathname,
        onChunk: (chunk) => {
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              ...next[next.length - 1],
              content: next[next.length - 1].content + chunk,
            };
            return next;
          });
        },
      });
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: "Something went wrong reaching Latch. Please try again.",
        };
        return next;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    if (isStreaming) return;
    sessionIdRef.current = resetAiChatSessionId();
    setMessages([]);
    setTypingIndex(null);
    setRevealLength(0);
  };

  const openTransition = { type: "spring" as const, damping: 32, stiffness: 480 };
  const closeTransition = { type: "spring" as const, damping: 30, stiffness: 300 };

  return (
    <div className="fixed bottom-[75px] right-8 z-[300]">
      <AnimatePresence initial={false} mode="popLayout">
        {isOpen ? (
          <motion.div
            key="panel"
            layoutId="latch-widget"
            transition={openTransition}
            className="absolute bottom-0 right-0 w-[calc(100vw-4rem)] max-w-[440px] h-[600px] lg:max-w-[480px] lg:h-[640px] flex flex-col overflow-hidden"
            style={{
              background: "#13161d",
              border: "1px solid rgba(139,92,246,0.25)",
              borderRadius: 16,
              boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.08)",
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.1, duration: 0.15 } }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
              className="flex flex-col h-full min-h-0"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-latch/15">
                    <BalisongMark className="w-5 h-auto" fill="#8b5cf6" pupilFill="#13161d" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-base font-semibold text-white/90">Latch</span>
                    <span className="text-xs text-white/35">AI Assistant</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {messages.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClear}
                      disabled={isStreaming}
                      title="Clear chat"
                      className="text-white/30 hover:text-white/60 transition-colors duration-150 disabled:opacity-30"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-sm" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-white/30 hover:text-white/60 transition-colors duration-150"
                  >
                    <FontAwesomeIcon icon={faXmark} className="text-base" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="chat-scroll flex-1 overflow-y-auto overscroll-contain px-5 py-4 flex flex-col gap-4">
                {messages.length === 0 && (
                  <div className="text-sm text-white/40 leading-relaxed">
                    <p className="mb-3">Hey, I'm Latch. Here's how I can help:</p>
                    <ul className="flex flex-col gap-1.5">
                      <li>
                        <span className="text-latch/80">•</span> Find your way around the site
                      </li>
                      <li>
                        <span className="text-latch/80">•</span> Answer questions about balisong flipping
                      </li>
                      <li>
                        <span className="text-latch/80">•</span> Search knives, makers, and balisong content
                      </li>
                      <li>
                        <span className="text-latch/80">•</span> Report bug or flag content (once you're logged in)
                      </li>
                    </ul>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const displayContent = i === typingIndex ? msg.content.slice(0, revealLength) : msg.content;
                  return (
                    <div
                      key={i}
                      className={`max-w-[85%] px-4 py-2.5 rounded-xl text-base leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "self-end bg-white/10 text-white"
                          : "self-start bg-latch/10 text-white/80"
                      }`}
                    >
                      {displayContent
                        ? renderMessageContent(displayContent)
                        : msg.role === "assistant" && isStreaming
                          ? "…"
                          : ""}
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <div className="flex items-center gap-2.5 px-4 py-4 border-t border-white/10">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Latch something..."
                  disabled={isStreaming}
                  className="flex-1 bg-white/5 rounded-lg px-4 py-3 text-base text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-latch/50 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isStreaming || !input.trim()}
                  className="w-11 h-11 flex-shrink-0 rounded-lg flex items-center justify-center bg-latch/20 hover:bg-latch/30 disabled:opacity-30 transition-colors duration-150"
                >
                  <FontAwesomeIcon icon={faPaperPlane} className="text-latch text-sm" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.button
            key="button"
            layoutId="latch-widget"
            transition={closeTransition}
            type="button"
            onClick={() => setIsOpen(true)}
            whileTap={{ scale: 0.92 }}
            className="w-16 h-16 lg:w-20 lg:h-20 flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #4c1d95)",
              boxShadow: "0 8px 24px rgba(139,92,246,0.4)",
              borderRadius: 9999,
            }}
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.15 } }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
            >
              <BalisongMark className="w-9 lg:w-11 h-auto" fill="white" pupilFill="#4c1d95" />
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AiChatWidget;
