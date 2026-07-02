import { useRef, KeyboardEvent, ClipboardEvent } from "react";

interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  length?: number;
}

const OtpInput = ({ value, onChange, length = 6 }: OtpInputProps) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const update = (next: string[]) => onChange(next.join(""));

  const handleChange = (i: number, char: string) => {
    const d = char.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = d;
    update(next);
    if (d && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...digits];
      if (next[i]) {
        next[i] = "";
        update(next);
      } else if (i > 0) {
        next[i - 1] = "";
        update(next);
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    const next = [...digits];
    pasted.split("").forEach((ch, idx) => { next[idx] = ch; });
    update(next);
    const focusIdx = Math.min(pasted.length, length - 1);
    refs.current[focusIdx]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-3">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={`w-12 h-14 text-center text-xl font-bold rounded-xl border bg-[#1c1f27] text-white outline-none transition-all duration-200 ${
            digit
              ? "border-blue-primary/60 bg-blue-primary/5"
              : "border-white/10 focus:border-blue-primary/40"
          }`}
        />
      ))}
    </div>
  );
};

export default OtpInput;
