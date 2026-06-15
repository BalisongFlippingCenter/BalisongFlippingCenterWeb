import { useLocation, useNavigate } from "react-router-dom";
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
} from "@fortawesome/free-solid-svg-icons";
import HeaderNavbarBottom from "../navigation/HeaderNavbarBottom";
import { RootState } from "../../redux/store";
import useWindowSize from "../../hooks/useWindowSize";
import { motion, useScroll, useMotionValueEvent } from "motion/react";

const Navbar = () => {
  const [hidden, setHidden] = useState(false);
  const [navToggle, toggleNav] = useState(false);
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
      if (accountToggle) setAccountToggle(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  useEffect(() => {
    setCurrURL(location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isMobile = windowSize.at(1)! < 1150;
  const isSmall = windowSize.at(1)! < 950;

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
        {/* Mobile search overlay */}
        {isSmall && searchBarToggle && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-40 px-4">
            <SearchBar toggleSearchBar={toggleSearchBar} />
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
            {!isSmall ? (
              <SearchBar toggleSearchBar={toggleSearchBar} />
            ) : (
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                size="lg"
                onClick={toggleSearchBar}
                className="cursor-pointer"
              />
            )}

            <span className="xsm:hidden md:block w-px h-4 bg-white/20 flex-shrink-0" />

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
          <aside className={`absolute top-full left-0 right-0 w-full backdrop-blur-xl shadow-lg ${
            location.pathname === "/" ? "bg-[#0a0c10]" : "bg-dark-neutral"
          }`}>
            <HeaderNavbar />
          </aside>
        )}
      </motion.header>

      {user && accessToken && (
        <aside className="fixed bottom-0 z-30 overflow-visible xsm:left-0 xsm:right-0 xsm:w-full md:left-1/2 md:right-auto md:w-auto md:-translate-x-1/2">
          <HeaderNavbarBottom />
        </aside>
      )}
    </>
  );
};

export default Navbar;
