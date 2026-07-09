import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleXmark, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { removeUIToast, UIToast } from "../redux/uiToast/uiToastSlice";

const DURATION = 4000;

const Toast = ({ toast }: { toast: UIToast }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const t = setTimeout(() => dispatch(removeUIToast(toast.id)), DURATION);
    return () => clearTimeout(t);
  }, [toast.id]);

  const isSuccess = toast.type === "success";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      exit={{    opacity: 0, y: 16, scale: 0.96 }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="flex items-center gap-3 min-w-[260px] max-w-[340px]"
      style={{
        background: "#13161d",
        border: `1px solid ${isSuccess ? "rgba(34,197,94,0.25)" : "rgba(185,28,28,0.25)"}`,
        borderRadius: "14px",
        boxShadow: `0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px ${isSuccess ? "rgba(34,197,94,0.06)" : "rgba(185,28,28,0.06)"}`,
        padding: "12px 14px",
      }}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: isSuccess ? "rgba(34,197,94,0.12)" : "rgba(185,28,28,0.12)" }}
      >
        <FontAwesomeIcon
          icon={isSuccess ? faCircleCheck : faCircleXmark}
          className={isSuccess ? "text-green" : "text-red"}
          style={{ fontSize: "16px" }}
        />
      </div>

      {/* Message */}
      <p className="flex-1 text-sm text-white/80 leading-snug">{toast.message}</p>

      {/* Dismiss */}
      <button
        type="button"
        onClick={() => dispatch(removeUIToast(toast.id))}
        className="flex-shrink-0 text-white/20 hover:text-white/50 transition-colors duration-150 ml-1"
      >
        <FontAwesomeIcon icon={faXmark} className="text-xs" />
      </button>
    </motion.div>
  );
};

const UIToastContainer = () => {
  const toasts = useAppSelector((state) => state.uiToast.toasts);

  return (
    <div className="hidden md:flex fixed bottom-8 right-8 z-[300] flex-col gap-2.5 items-end pointer-events-none">
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default UIToastContainer;
