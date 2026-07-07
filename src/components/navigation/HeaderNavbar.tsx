import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGlobe, faEarthAmericas, faCircleInfo, faChevronDown,
  faBookOpen, faEnvelope, faFileLines, faShield,
} from "@fortawesome/free-solid-svg-icons";
import { faHubspot } from "@fortawesome/free-brands-svg-icons";
import { AnimatePresence, motion } from "motion/react";

const linkClass = "flex justify-center items-center gap-2 text-white/80 hover:text-blue-primary transition-colors duration-200 relative group whitespace-nowrap xsm:border-b xsm:border-white/10 xsm:pb-4 xsm:pt-2 nav:border-b-0 nav:py-0";
const activeLinkClass = "text-blue-primary";
const divider = <span className="xsm:hidden nav:block w-px h-4 bg-white/20 flex-shrink-0" />;

const ABOUT_ITEMS = [
  { to: "/learn",   icon: faBookOpen,   label: "Learn",            desc: "Guides & hardware explained" },
  { to: "/about",   icon: faEnvelope,   label: "Contact",          desc: "Get in touch with us" },
  { to: "/terms",   icon: faFileLines,  label: "Terms of Service", desc: "Rules & user agreements" },
  { to: "/privacy", icon: faShield,     label: "Privacy Policy",   desc: "How we handle your data" },
];

const HeaderNavbar = () => {
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const isAboutActive = ["/about", "/learn", "/terms", "/privacy"].some(
    (p) => location.pathname === p || location.pathname.startsWith(p + "/")
  );

  // Close on click outside
  useEffect(() => {
    if (!aboutOpen) return;
    const handler = (e: MouseEvent) => {
      if (aboutRef.current && !aboutRef.current.contains(e.target as Node)) {
        setAboutOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [aboutOpen]);

  return (
    <nav className="flex nav:justify-center xsm:gap-4 nav:gap-3 nav:text-sm lg:text-base xsm:text-lg nav:flex-row xsm:flex-col xsm:h-auto nav:h-auto xsm:pt-2 xsm:pb-6 nav:py-0 xsm:px-6 nav:px-0 nav:items-center">

      <NavLink to="/community" className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ""}`}>
        {({ isActive }) => (<>
          <FontAwesomeIcon icon={faGlobe} className="nav:hidden" />
          <span>Community</span>
          <span className={`absolute bottom-0 left-0 h-[2px] bg-blue-primary transition-all duration-200 group-hover:w-full ${isActive ? "w-full" : "w-0"}`} />
        </>)}
      </NavLink>

      {divider}

      <NavLink to="/tutorial-center" className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ""}`}>
        {({ isActive }) => (<>
          <FontAwesomeIcon icon={faHubspot} className="nav:hidden" />
          <span>Tutorial Center</span>
          <span className={`absolute bottom-0 left-0 h-[2px] bg-blue-primary transition-all duration-200 group-hover:w-full ${isActive ? "w-full" : "w-0"}`} />
        </>)}
      </NavLink>

      {divider}

      <NavLink to="/product-world" className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ""}`}>
        {({ isActive }) => (<>
          <FontAwesomeIcon icon={faEarthAmericas} className="nav:hidden" />
          <span>Product World</span>
          <span className={`absolute bottom-0 left-0 h-[2px] bg-blue-primary transition-all duration-200 group-hover:w-full ${isActive ? "w-full" : "w-0"}`} />
        </>)}
      </NavLink>

      {divider}

      {/* About — dropdown trigger (desktop only) */}
      <div ref={aboutRef} className="relative xsm:hidden nav:block">
        {/* Trigger row: "About" navigates, chevron toggles */}
        <div className={`flex items-center gap-1 transition-colors duration-200 ${isAboutActive ? "text-blue-primary" : "text-white/80"}`}>
          <button
            type="button"
            onClick={() => navigate("/about")}
            className={`relative group flex items-center gap-2 hover:text-blue-primary transition-colors duration-200 py-0`}
          >
            <span>About</span>
            <span className={`absolute bottom-0 left-0 h-[2px] bg-blue-primary transition-all duration-200 group-hover:w-full ${isAboutActive ? "w-full" : "w-0"}`} />
          </button>
          <button
            type="button"
            onClick={() => setAboutOpen((prev) => !prev)}
            className="hover:text-blue-primary transition-colors duration-200 p-1 -ml-0.5"
            aria-label="Toggle About menu"
          >
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`text-[9px] transition-transform duration-200 ${aboutOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Dropdown — wrapper div owns the centering transform, motion.div owns animation transforms */}
        <AnimatePresence>
          {aboutOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-50">
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0,  scale: 1 }}
                exit={{    opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="w-56 rounded-2xl overflow-hidden"
                style={{
                  background: "#13161d",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 16px 48px rgba(0,0,0,0.85)",
                }}
              >
                {ABOUT_ITEMS.map((item, i) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setAboutOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors duration-150 ${
                        i < ABOUT_ITEMS.length - 1 ? "border-b" : ""
                      } ${isActive ? "bg-blue-primary/10" : "hover:bg-white/[0.04]"}`}
                      style={{ borderColor: "rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: isActive ? "rgba(16,129,152,0.2)" : "rgba(255,255,255,0.05)" }}
                      >
                        <FontAwesomeIcon
                          icon={item.icon}
                          className={`text-[11px] ${isActive ? "text-blue-primary" : "text-white/40"}`}
                        />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className={`text-sm font-medium leading-none ${isActive ? "text-blue-primary" : "text-white/80"}`}>
                          {item.label}
                        </span>
                        <span className="text-white/30 text-[11px] leading-snug">{item.desc}</span>
                      </div>
                    </NavLink>
                  );
                })}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* About — plain link on mobile (inside hamburger menu, no dropdown needed) */}
      <NavLink
        to="/about"
        className={({ isActive }) => `${linkClass} xsm:border-b-0 nav:hidden ${isActive ? activeLinkClass : ""}`}
      >
        {({ isActive }) => (<>
          <FontAwesomeIcon icon={faCircleInfo} />
          <span>About</span>
          <span className={`absolute bottom-0 left-0 h-[2px] bg-blue-primary transition-all duration-200 group-hover:w-full ${isActive ? "w-full" : "w-0"}`} />
        </>)}
      </NavLink>

    </nav>
  );
};

export default HeaderNavbar;
