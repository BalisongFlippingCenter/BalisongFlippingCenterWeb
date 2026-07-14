import { useEffect, useState, useRef } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import Header from "../components/header/Header";
import HeaderNavbarBottom from "../components/navigation/HeaderNavbarBottom";
import { useAppSelector } from "../redux/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { faFlag, faBug, faXmark, faChevronRight } from "@fortawesome/free-solid-svg-icons";

const DISCORD_URL = "https://discord.gg/k6JPnkbBC";

// Routes that show the footer
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const SiteFooter = () => (
  <footer className="w-full bg-[#0a0c10] border-t border-white/[0.06]">
    {/* Mobile layout */}
    <div className="md:hidden flex flex-col items-center gap-5 px-6 pt-8 pb-28">
      {/* Discord CTA */}
      <a
        href={DISCORD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/25 text-[#5865F2] text-sm font-semibold hover:bg-[#5865F2]/20 transition-colors duration-200"
      >
        <FontAwesomeIcon icon={faDiscord} className="text-base" />
        Join our Discord
      </a>

      {/* Nav links */}
      <div className="flex items-center gap-5 text-white/40 text-xs font-medium">
        <Link to="/about"   className="hover:text-white/70 transition-colors duration-200">About</Link>
        <Link to="/about"   className="hover:text-white/70 transition-colors duration-200">Contact</Link>
        <Link to="/terms"   className="hover:text-white/70 transition-colors duration-200">Terms</Link>
        <Link to="/privacy" className="hover:text-white/70 transition-colors duration-200">Privacy</Link>
      </div>

      {/* Brand + copyright */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-white/60 font-semibold text-xs">Balisong Flipping Center</span>
        <span className="text-white/25 text-[11px]">© {new Date().getFullYear()} All rights reserved.</span>
      </div>
    </div>

    {/* Desktop layout */}
    <div className="hidden md:flex max-w-[1775px] mx-auto px-6 py-14 flex-row items-center justify-between gap-6">
      <div className="flex flex-col items-start gap-1">
        <span className="text-white font-bold text-sm">Balisong Flipping Center</span>
        <span className="text-white/30 text-xs">© {new Date().getFullYear()} All rights reserved.</span>
      </div>

      <div className="flex items-center gap-6 text-white/40 text-xs font-medium">
        <Link to="/about"   className="hover:text-white/70 transition-colors duration-200">About</Link>
        <Link to="/about"   className="hover:text-white/70 transition-colors duration-200">Contact</Link>
        <Link to="/terms"   className="hover:text-white/70 transition-colors duration-200">Terms</Link>
        <Link to="/privacy" className="hover:text-white/70 transition-colors duration-200">Privacy</Link>
      </div>

      <a
        href={DISCORD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5865F2]/10 border border-[#5865F2]/25 text-[#5865F2] text-xs font-semibold hover:bg-[#5865F2]/20 transition-colors duration-200"
      >
        <FontAwesomeIcon icon={faDiscord} className="text-sm" />
        Join our Discord
      </a>
    </div>
  </footer>
);

const ReportButton = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="fixed bottom-24 right-0 md:bottom-8 md:right-8 z-50 flex flex-col items-end gap-2">

      {/* Popover */}
      {open && (
        <div className="bg-[#13161d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden w-64 mr-0 md:mr-0">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-semibold">Report via Discord</p>
              <p className="text-white/40 text-xs">Use our Discord bot to submit</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="text-white/30 hover:text-white/70 transition-colors">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          {/* Options */}
          <div className="flex flex-col divide-y divide-white/[0.05]">
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-colors duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red/10 border border-red/20 flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faBug} className="text-red text-xs" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Report a Bug</p>
                  <p className="text-white/35 text-xs">Something broken?</p>
                </div>
              </div>
              <FontAwesomeIcon icon={faChevronRight} className="text-white/20 text-xs" />
            </a>

            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-colors duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faFlag} className="text-gold text-xs" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Flag Content</p>
                  <p className="text-white/35 text-xs">Report inappropriate content</p>
                </div>
              </div>
              <FontAwesomeIcon icon={faChevronRight} className="text-white/20 text-xs" />
            </a>
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-[#0d0f14] flex items-center gap-1.5">
            <FontAwesomeIcon icon={faDiscord} className="text-[#5865F2] text-xs" />
            <span className="text-white/30 text-[11px]">Handled via our Discord bot</span>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`shadow-lg flex items-center justify-center transition-all duration-200 border
          w-9 h-16 rounded-l-xl rounded-r-none md:w-12 md:h-12 md:rounded-full
          ${open
            ? "bg-[#5865F2] border-[#5865F2] text-white"
            : "bg-[#13161d] border-white/10 text-white/40 hover:text-white hover:border-white/25"
          }`}
        title="Report a bug or flag content"
      >
        <FontAwesomeIcon icon={faFlag} className="text-sm" />
      </button>
    </div>
  );
};

const MainLayout = () => {
  const location    = useLocation();
  const showFooter  = !location.pathname.startsWith("/messages");
  const user        = useAppSelector((state) => state.auth.user);
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  return (
    <>
      <ScrollToTop />
      <Header />
      <main>
        <Outlet />
      </main>
      {showFooter && <SiteFooter />}
      <ReportButton />
      {user && accessToken && (
        <aside
          className="fixed bottom-0 z-30 overflow-visible left-0 right-0 w-full"
          style={{ willChange: 'transform', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <HeaderNavbarBottom />
        </aside>
      )}
    </>
  );
};

export default MainLayout;
