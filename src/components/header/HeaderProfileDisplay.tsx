import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCircleUser,
  faUser,
  faGear,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import ProfileImageDisplay from "../ProfileImageDisplay";
import { logout } from "../../redux/auth/authActions";
import { clearCollection } from "../../redux/collection/collectionSlice";
import { clearNotifications } from "../../redux/notifications/notificationSlice";
import { addUIToast } from "../../redux/uiToast/uiToastSlice";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import useWindowSize from "../../hooks/useWindowSize";
import { motion, AnimatePresence } from "motion/react";

import NotificationPanel from "../NotificationPanel";

const HeaderProfileDisplay = () => {
  const [userNav,    displayUserNav] = useState(false);
  const [notifOpen,  setNotifOpen]   = useState(false);
  const [currURL,    setCurrURL]     = useState("");

  const user        = useAppSelector((state) => state.auth.user);
  const unreadCount = useAppSelector((state) => state.notifications.unreadCount);
  const dispatch    = useAppDispatch();

  const navigate   = useNavigate();
  const location   = useLocation();
  const windowSize = useWindowSize();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    dispatch(logout())
      .unwrap()
      .finally(() => {
        dispatch(clearCollection());
        dispatch(clearNotifications());
        dispatch(addUIToast({ type: "success", message: "You've been signed out." }));
        navigate("/login");
      });
  };

  // Close on route change
  useEffect(() => { setCurrURL(location.pathname); }, []);
  useEffect(() => {
    if (location.pathname !== currURL) {
      setCurrURL(location.pathname);
      displayUserNav(false);
      setNotifOpen(false);
    }
  }, [location]);

  // Close both panels on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Mobile notif panel is a full-screen portal — only the back button closes it
      if (notifOpen && window.innerWidth < 950) return;
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        displayUserNav(false);
        setNotifOpen(false);
      }
    };
    if (userNav || notifOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userNav, notifOpen]);

  const toggleNotif = () => {
    setNotifOpen((p) => !p);
    if (userNav) displayUserNav(false);
  };

  const toggleUserNav = () => {
    displayUserNav((p) => !p);
    if (notifOpen) setNotifOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex gap-2 items-center">

      {/* Notifications bell */}
      <div className="relative">
        <button
          type="button"
          onClick={toggleNotif}
          className={`relative text-white/60 hover:text-white transition-colors duration-200 ${notifOpen ? "text-white" : ""}`}
        >
          <FontAwesomeIcon icon={faBell} size="lg" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red text-white text-[10px] font-bold flex items-center justify-center leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      </div>

      {/* Profile trigger */}
      <button
        type="button"
        onClick={toggleUserNav}
        className="flex items-center gap-2 py-1.5 px-2 rounded-full hover:bg-white/10 transition-colors duration-200 cursor-pointer"
      >
        {user?.profileImg && user.profileImg !== "" ? (
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
            <ProfileImageDisplay />
          </div>
        ) : (
          <FontAwesomeIcon icon={faCircleUser} size="xl" className="text-white/80" />
        )}

        {windowSize.at(1)! > 950 && (
          <span className="text-sm font-medium text-white/80">
            {user?.displayName && user.displayName !== "" ? user.displayName : user?.id}
          </span>
        )}
      </button>

      {/* Profile dropdown */}
      <AnimatePresence>
        {userNav && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute top-full right-0 mt-2 w-48 rounded-xl border border-white/10 bg-dark-neutral-offset overflow-hidden z-50"
            style={{ boxShadow: "0 0 40px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.8)" }}
          >
            {/* Profile header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-white/10 flex items-center justify-center">
                {user?.profileImg && user.profileImg !== "" ? (
                  <ProfileImageDisplay />
                ) : (
                  <FontAwesomeIcon icon={faCircleUser} className="text-white/50 text-xl" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.displayName || user?.id}
                </p>
                <p className="text-xs text-white/40 truncate mt-0.5">{user?.email}</p>
              </div>
            </div>

            <ul className="py-1">
              <li>
                <button
                  type="button"
                  onClick={() => navigate(`/${user?.displayName}/${user?.identifierCode}`)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-white/5 ${
                    location.pathname === `/${user?.displayName}/${user?.identifierCode}`
                      ? "text-white bg-white/5" : "text-white/70 hover:text-white"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={faUser}
                    className={`w-4 ${location.pathname === `/${user?.displayName}/${user?.identifierCode}` ? "text-blue-primary" : "text-white/40"}`}
                  />
                  Profile
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() => navigate("/configure")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-white/5 ${
                    location.pathname.startsWith("/configure")
                      ? "text-white bg-white/5" : "text-white/70 hover:text-white"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={faGear}
                    className={`w-4 ${location.pathname.startsWith("/configure") ? "text-blue-primary" : "text-white/40"}`}
                  />
                  Settings
                </button>
              </li>

              <li className="my-1 border-t border-white/10" />

              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red hover:bg-white/5 transition-colors duration-150"
                >
                  <FontAwesomeIcon icon={faRightFromBracket} className="w-4" />
                  Logout
                </button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default HeaderProfileDisplay;
