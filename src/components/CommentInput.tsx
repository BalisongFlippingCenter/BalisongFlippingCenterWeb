import { useRef, useState } from "react";
import { useAppSelector } from "../redux/hooks";

interface CommentInputProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  onCancel?: () => void;
  autoFocus?: boolean;
  initialValue?: string;
}

const CommentInput = ({ onSubmit, placeholder = "Write a comment...", onCancel, autoFocus, initialValue = "" }: CommentInputProps) => {
  const user = useAppSelector((state) => state.auth.user);
  const [content,    setContent]    = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setContent("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  if (!user) return (
    <p className="text-white/25 text-xs text-center py-2">
      <span className="text-blue-primary cursor-pointer hover:underline">Log in</span> to leave a comment.
    </p>
  );

  const avatar = user.profileImg;
  const hasContent = content.trim().length > 0;

  return (
    <div className="flex items-center gap-2.5">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-blue-primary/20 border border-blue-primary/30 flex-shrink-0 overflow-hidden flex items-center justify-center">
        {avatar
          ? <img src={avatar} alt="" className="w-full h-full object-cover" />
          : <span className="text-blue-primary text-[10px] font-bold">{user.displayName?.charAt(0).toUpperCase() ?? "?"}</span>
        }
      </div>

      {/* Input row */}
      <div className="flex-1 flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] focus-within:border-blue-primary/40 rounded-xl px-3 py-2 transition-colors duration-150">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          maxLength={1000}
          rows={1}
          className="flex-1 text-sm text-white placeholder-white/25 focus:outline-none resize-none leading-5 overflow-hidden"
          style={{ height: "20px", background: "transparent" }}
        />
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-white/25 text-[11px] hover:text-white/50 transition-colors duration-150 px-1"
            >
              Cancel
            </button>
          )}
          {hasContent && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-2.5 py-1 rounded-lg bg-blue-primary/20 border border-blue-primary/30 text-blue-primary text-[11px] font-semibold hover:bg-blue-primary/30 disabled:opacity-40 transition-all duration-150"
            >
              {submitting ? "..." : "Post"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentInput;
