import { createPortal } from "react-dom";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import HeaderProfileDisplay from "./HeaderProfileDisplay";
import HeaderNavbar from "../navigation/HeaderNavbar";
import { useEffect, useState } from "react";
import SearchBar from "../SearchBar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBarsStaggered,
  faCircleUser,
  faMagnifyingGlass,
  faGlobe,
  faEarthAmericas,
  faCircleInfo,
  faChevronDown,
  faBookOpen,
  faEnvelope,
  faFileLines,
  faShield,
} from "@fortawesome/free-solid-svg-icons";
import { faHubspot } from "@fortawesome/free-brands-svg-icons";
import { RootState } from "../../redux/store";
import useWindowSize from "../../hooks/useWindowSize";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "motion/react";

const ABOUT_SUBITEMS = [
  { to: "/learn",   icon: faBookOpen,  label: "Learn",            tagline: "Guides & hardware explained" },
  { to: "/about",   icon: faEnvelope,  label: "Contact",          tagline: "Get in touch with us" },
  { to: "/terms",   icon: faFileLines, label: "Terms of Service", tagline: "Rules & user agreements" },
  { to: "/privacy", icon: faShield,    label: "Privacy Policy",   tagline: "How we handle your data" },
];

const Navbar = () => {
  const [hidden, setHidden] = useState(false);
  const [navToggle, toggleNav] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [searchBarToggle, setSearchBarToggle] = useState(false);
  const [accountToggle, setAccountToggle] = useState(false);
  const [currURL, setCurrURL] = useState("");

  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const user = useSelector((state: RootState) => state.auth.user);

  const navigate = useNavigate();
  const location = useLocation();
  const windowSize = useWindowSize();
  const { scrollY } = useScroll();

  const toggleSearchBar = () => setSearchBarToggle((prev) => !prev);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = scrollY.getPrevious() ?? latest;
    if (latest > prev && latest > 40) {
      setHidden(true);
    } else if (prev - latest > 5) {
      setHidden(false);
    }
  });

  useEffect(() => {
    if (location.pathname !== currURL) {
      setCurrURL(location.pathname);
      toggleNav(false);
      setAboutExpanded(false);
      if (accountToggle) setAccountToggle(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  useEffect(() => {
    setCurrURL(location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isMobile = (windowSize[1] ?? 0) < 1150;

  return (
    <>
      <motion.header
        variants={{ visible: { y: 0 }, hidden: { y: "-100%" } }}
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.353, ease: "easeInOut" }}
        className={`relative flex items-center sticky top-0 w-full px-4 md:px-8 py-3 short:py-1.5 z-30 text-white backdrop-blur-xl border-b border-white/10 shadow-lg transition-colors duration-500 ${
          location.pathname === "/"
            ? "bg-transparent"
            : "bg-dark-neutral/80"
        }`}
      >
        {/* Search overlay — all screen sizes */}
        {searchBarToggle && (
          <div className="absolute inset-0 flex items-center bg-black z-40 px-4">
            <SearchBar toggleSearchBar={toggleSearchBar} mobile />
          </div>
        )}

        {/* Three-column grid: logo | nav | search+icon */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full">

          {/* Left — hamburger (mobile only) + logo */}
          <div className="flex items-center gap-2">
            {isMobile && (
              <div className="hover:cursor-pointer text-xl mr-1" onClick={() => toggleNav((prev) => !prev)}>
                <FontAwesomeIcon icon={faBarsStaggered} />
              </div>
            )}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 540 110"
              onClick={() => navigate(user ? "/community" : "/")}
              className="hover:cursor-pointer h-9 md:h-14 short:md:h-10 w-auto"
              aria-label="Balisong Flipping Center"
            >
              <path d="M 52,55 L 6,12 L 0,18 L 4,26 L 44,59 Z" fill="white" opacity="0.95"/>
              <path d="M 52,55 L 6,12 L 10,8 L 56,51 Z" fill="white" opacity="0.3"/>
              <path d="M 52,55 L 6,98 L 0,92 L 4,84 L 44,51 Z" fill="white" opacity="0.95"/>
              <path d="M 52,55 L 6,98 L 10,102 L 56,59 Z" fill="white" opacity="0.3"/>
              <path d="M 52,55 C 70,54 92,50 112,46 C 130,42 142,38 148,35 C 142,41 130,47 112,52 C 92,57 70,58 52,57 Z" fill="white" opacity="0.95"/>
              <circle cx="52" cy="55" r="4.5" fill="white"/>
              <circle cx="52" cy="55" r="2" fill="black"/>
              <text x="178" y="52" fontFamily="'Bebas Neue','Impact',sans-serif" fontSize="44" letterSpacing="4" fill="white">BALISONG</text>
              <rect x="182" y="61" width="240" height="1.5" rx="0.75" fill="white" opacity="0.75"/>
              <text x="182" y="84" fontFamily="'Barlow','Arial Narrow',sans-serif" fontSize="20" fontWeight="600" letterSpacing="4" fill="white" opacity="0.7">FLIPPING CENTER</text>
            </svg>
          </div>

          {/* Center — nav links (desktop only) */}
          {!isMobile ? (
            <div className="flex items-center justify-center">
              <HeaderNavbar />
            </div>
          ) : (
            <div />
          )}

          {/* Right — search + user icon */}
          <div className="flex items-center gap-3 justify-end pl-[35px]">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              size="lg"
              onClick={toggleSearchBar}
              className="cursor-pointer"
            />

            <span className="w-px h-4 bg-white/20 flex-shrink-0" />

            {user && accessToken ? (
              <HeaderProfileDisplay />
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 py-1.5 px-[7px] rounded-full text-blue-primary hover:bg-white/10 transition-colors duration-200 cursor-pointer"
              >
                <FontAwesomeIcon icon={faCircleUser} size="xl" />
                <span className="text-sm font-medium whitespace-nowrap xsm:hidden md:inline">Sign In</span>
              </button>
            )}
          </div>

        </div>

        {/* Mobile dropdown nav */}
        {isMobile && navToggle && (
          <>
            {/* Scrim via portal — renders at document.body so it escapes the sticky header's
                stacking context and correctly covers the full viewport */}
            {createPortal(
              <div
                className="fixed inset-0 bg-black/85 z-[25]"
                onClick={() => toggleNav(false)}
              />,
              document.body
            )}
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute top-full left-0 right-0 w-full z-40"
              style={{
                background: "#13161d",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.85)",
              }}
            >
              <div className="flex flex-col">
                {/* Top-level nav links */}
                {[
                  { to: "/community",       icon: faGlobe,         label: "Community",       tagline: "Posts, flips & the feed"    },
                  { to: "/tutorial-center", icon: faHubspot,       label: "Tutorial Center", tagline: "Tricks, combos & tutorials" },
                  { to: "/product-world",   icon: faEarthAmericas, label: "Product World",   tagline: "Knives, makers & gear"      },
                ].map(({ to, icon, label, tagline }) => {
                  const isActive = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => toggleNav(false)}
                      className={`flex items-center gap-4 pl-4 pr-5 py-3.5 transition-colors duration-150 border-l-[3px] border-b-2 border-b-black ${
                        isActive
                          ? "border-blue-primary bg-blue-primary/10"
                          : "border-transparent hover:bg-white/[0.03]"
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={icon}
                        className={`text-base flex-shrink-0 transition-colors duration-150 ${isActive ? "text-blue-primary" : "text-white/40"}`}
                      />
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <span className={`text-sm font-semibold leading-snug transition-colors duration-150 ${isActive ? "text-blue-primary" : "text-white/80"}`}>
                          {label}
                        </span>
                        <span className="text-white/45 text-xs leading-none">{tagline}</span>
                      </div>
                    </NavLink>
                  );
                })}

                {/* About — accordion */}
                {(() => {
                  const aboutActive = ["/about", "/learn", "/terms", "/privacy"].some(
                    (p) => location.pathname === p || location.pathname.startsWith(p + "/")
                  );
                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => setAboutExpanded((prev) => !prev)}
                        className={`flex items-center gap-4 pl-4 pr-5 py-3.5 transition-colors duration-150 border-l-[3px] border-b-2 border-b-black w-full text-left ${
                          aboutActive
                            ? "border-blue-primary bg-blue-primary/10"
                            : "border-transparent hover:bg-white/[0.03]"
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={faCircleInfo}
                          className={`text-base flex-shrink-0 transition-colors duration-150 ${aboutActive ? "text-blue-primary" : "text-white/40"}`}
                        />
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                          <span className={`text-sm font-semibold leading-snug transition-colors duration-150 ${aboutActive ? "text-blue-primary" : "text-white/80"}`}>
                            About
                          </span>
                          <span className="text-white/45 text-xs leading-none">What is this place?</span>
                        </div>
                        <FontAwesomeIcon
                          icon={faChevronDown}
                          className={`text-[10px] text-white/30 transition-transform duration-200 flex-shrink-0 ${aboutExpanded ? "rotate-180" : ""}`}
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {aboutExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden"
                            style={{ background: "rgba(255,255,255,0.02)" }}
                          >
                            {ABOUT_SUBITEMS.map(({ to, icon, label, tagline }) => {
                              const isActive = location.pathname === to;
                              return (
                                <NavLink
                                  key={to}
                                  to={to}
                                  onClick={() => toggleNav(false)}
                                  className={`flex items-center gap-4 pl-10 pr-5 py-3 transition-colors duration-150 border-l-[3px] border-b border-b-black/30 ${
                                    isActive
                                      ? "border-blue-primary bg-blue-primary/10"
                                      : "border-transparent hover:bg-white/[0.03]"
                                  }`}
                                >
                                  <div
                                    className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                                    style={{ background: isActive ? "rgba(16,129,152,0.2)" : "rgba(255,255,255,0.06)" }}
                                  >
                                    <FontAwesomeIcon
                                      icon={icon}
                                      className={`text-[10px] ${isActive ? "text-blue-primary" : "text-white/35"}`}
                                    />
                                  </div>
                                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                    <span className={`text-sm font-semibold leading-snug transition-colors duration-150 ${isActive ? "text-blue-primary" : "text-white/80"}`}>
                                      {label}
                                    </span>
                                    <span className="text-white/35 text-xs leading-none">{tagline}</span>
                                  </div>
                                </NavLink>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </>
        )}
      </motion.header>

    </>
  );
};

export default Navbar;
