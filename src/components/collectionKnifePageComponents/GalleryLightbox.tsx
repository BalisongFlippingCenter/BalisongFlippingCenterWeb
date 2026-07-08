import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

const isVideo = (url: string) => /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(url);

interface GalleryLightboxProps {
  items: { fileId: string }[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const GalleryLightbox = ({ items, index, onClose, onNavigate }: GalleryLightboxProps) => {
  const total = items.length;
  const canPrev = index > 0;
  const canNext = index < total - 1;

  const prev = useCallback(() => { if (canPrev) onNavigate(index - 1); }, [canPrev, index, onNavigate]);
  const next = useCallback(() => { if (canNext) onNavigate(index + 1); }, [canNext, index, onNavigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  const file = items[index];

  return createPortal(
    <motion.div
      key="lightbox"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors duration-150 z-10"
      >
        <FontAwesomeIcon icon={faXmark} className="text-lg" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm font-medium z-10">
        {index + 1} / {total}
      </div>

      {/* Prev arrow */}
      {canPrev && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-3 md:left-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors duration-150 z-10"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
      )}

      {/* Next arrow */}
      {canNext && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-3 md:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors duration-150 z-10"
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      )}

      {/* Media */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="max-w-[90vw] max-h-[88vh] flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {isVideo(file.fileId) ? (
            <video
              key={file.fileId}
              src={file.fileId}
              className="max-w-full max-h-[88vh] rounded-lg"
              controls
              autoPlay
              playsInline
            />
          ) : (
            <img
              src={file.fileId}
              alt={`Gallery item ${index + 1}`}
              className="max-w-full max-h-[88vh] rounded-lg object-contain"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dot strip — only when more than 1 item */}
      {total > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => { e.stopPropagation(); onNavigate(i); }}
              className={`rounded-full transition-all duration-200 ${
                i === index ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </motion.div>,
    document.body
  );
};

export default GalleryLightbox;
