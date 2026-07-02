import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#080a0e] flex flex-col items-center justify-center px-6 relative overflow-hidden">

      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 30%, rgba(16,129,152,0.10) 0%, transparent 70%)",
        }}
      />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-10 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 540 110"
          className="w-52 sm:w-64 opacity-60"
        >
          <path d="M 52,55 L 6,12 L 0,18 L 4,26 L 44,59 Z" fill="white" opacity="0.95" />
          <path d="M 52,55 L 6,12 L 10,8 L 56,51 Z" fill="white" opacity="0.3" />
          <path d="M 52,55 L 6,98 L 0,92 L 4,84 L 44,51 Z" fill="white" opacity="0.95" />
          <path d="M 52,55 L 6,98 L 10,102 L 56,59 Z" fill="white" opacity="0.3" />
          <path d="M 52,55 C 70,54 92,50 112,46 C 130,42 142,38 148,35 C 142,41 130,47 112,52 C 92,57 70,58 52,57 Z" fill="white" opacity="0.95" />
          <circle cx="52" cy="55" r="4.5" fill="white" />
          <circle cx="52" cy="55" r="2" fill="black" />
          <text x="178" y="52" fontFamily="'Bebas Neue','Impact',sans-serif" fontSize="44" letterSpacing="4" fill="white">BALISONG</text>
          <rect x="182" y="61" width="209" height="1.5" rx="0.75" fill="white" opacity="0.75" />
          <text x="182" y="82" fontFamily="'Barlow','Arial Narrow',sans-serif" fontSize="16" fontWeight="600" letterSpacing="6" fill="white" opacity="0.7">FLIPPING CENTER</text>
        </svg>
      </motion.div>

      {/* 404 number */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="relative flex items-center justify-center mb-4"
      >
        <span
          className="select-none pointer-events-none absolute text-[160px] sm:text-[220px] font-black leading-none"
          style={{
            fontFamily: "'Bebas Neue','Impact',sans-serif",
            color: "transparent",
            WebkitTextStroke: "1.5px rgba(255,255,255,0.06)",
            letterSpacing: "-0.02em",
          }}
        >
          404
        </span>
        <span
          className="relative text-[80px] sm:text-[110px] font-black leading-none tracking-tight"
          style={{
            fontFamily: "'Bebas Neue','Impact',sans-serif",
            background: "linear-gradient(135deg, rgba(255,255,255,0.90) 0%, rgba(255,255,255,0.35) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </span>
      </motion.div>

      {/* Divider */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.25 }}
        className="w-16 h-px bg-white/15 mb-6"
      />

      {/* Message */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3 }}
        className="flex flex-col gap-2 text-center mb-10 max-w-[340px]"
      >
        <h1 className="text-white font-bold text-xl">Page not found</h1>
        <p className="text-white/35 text-sm leading-relaxed">
          This page doesn't exist or was moved. Head back to the community feed to pick up where you left off.
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.4 }}
        className="flex flex-col sm:flex-row items-center gap-3"
      >
        <button
          onClick={() => navigate("/community")}
          className="px-7 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200"
          style={{
            background: "linear-gradient(135deg,#108198,#0a6475)",
            boxShadow: "0 4px 24px rgba(16,129,152,0.35)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 32px rgba(16,129,152,0.55)")}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 4px 24px rgba(16,129,152,0.35)")}
        >
          Go to Community
        </button>
        <button
          onClick={() => navigate(-1)}
          className="px-7 py-3 rounded-xl text-sm font-semibold text-white/50 border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:text-white/70 hover:border-white/20 transition-all duration-200"
        >
          Go Back
        </button>
      </motion.div>

    </div>
  );
};

export default NotFoundPage;
