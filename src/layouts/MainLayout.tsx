import { useEffect } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import Header from "../components/header/Header";
import HeaderNavbarBottom from "../components/navigation/HeaderNavbarBottom";
import { useAppSelector } from "../redux/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";

const DISCORD_URL = "https://discord.gg/k6JPnkbBC";

// Routes that show the footer
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const SiteFooter = ({ isLoggedIn }: { isLoggedIn: boolean }) => (
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
    <div className={`hidden md:flex max-w-[1775px] mx-auto px-6 pt-14 flex-row items-center justify-between gap-6 ${isLoggedIn ? "pb-[132px]" : "pb-14"}`}>
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
      {showFooter && <SiteFooter isLoggedIn={!!(user && accessToken)} />}
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
