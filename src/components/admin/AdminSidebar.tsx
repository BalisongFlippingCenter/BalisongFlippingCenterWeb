import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGaugeHigh, faFlag, faIndustry, faUsers, faRightFromBracket, faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import { logout } from "../../redux/auth/authActions";
import { clearCollection } from "../../redux/collection/collectionSlice";
import { clearNotifications } from "../../redux/notifications/notificationSlice";
import { addUIToast } from "../../redux/uiToast/uiToastSlice";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: faGaugeHigh, end: true },
  { to: "/admin/reports", label: "Reports", icon: faFlag, end: false },
  { to: "/admin/accounts", label: "Accounts", icon: faUsers, end: false },
  { to: "/admin/catalog", label: "Catalog", icon: faIndustry, end: false },
];

// Shared between AdminLayout (the /admin/* dashboard) and MainLayout (the
// handful of public/read-only pages an admin session is still allowed to
// view) -- an admin never sees the normal site header/footer/nav, only
// this sidebar, no matter which of those two it's rendering inside.
const AdminSidebar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const [isOpen, setIsOpen] = useState(false);
  const isOnAdminRoute = location.pathname.startsWith("/admin");

  const handleLogout = () => {
    dispatch(logout())
      .unwrap()
      .finally(() => {
        dispatch(clearCollection());
        dispatch(clearNotifications());
        dispatch(addUIToast({ type: "success", message: "You've been signed out." }));
        navigate("/login");
        setIsOpen(false);
      });
  };

  return (
    <>
      {/* Logo badge — below md only, mirrors the hamburger in the opposite corner. Only on /admin/* — the public pages an admin can still browse keep just the hamburger. */}
      {!isOpen && isOnAdminRoute && (
        <Link
          to="/admin"
          aria-label="Balisong Flipping Center"
          className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-lg border border-white/10 bg-dark-neutral-offset flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 110" className="h-6 w-auto" aria-hidden="true">
            <path d="M 52,55 L 6,12 L 0,18 L 4,26 L 44,59 Z" fill="white" opacity="0.95"/>
            <path d="M 52,55 L 6,12 L 10,8 L 56,51 Z" fill="white" opacity="0.3"/>
            <path d="M 52,55 L 6,98 L 0,92 L 4,84 L 44,51 Z" fill="white" opacity="0.95"/>
            <path d="M 52,55 L 6,98 L 10,102 L 56,59 Z" fill="white" opacity="0.3"/>
            <path d="M 52,55 C 70,54 92,50 112,46 C 130,42 142,38 148,35 C 142,41 130,47 112,52 C 92,57 70,58 52,57 Z" fill="white" opacity="0.95"/>
            <circle cx="52" cy="55" r="4.5" fill="white"/>
            <circle cx="52" cy="55" r="2" fill="black"/>
          </svg>
        </Link>
      )}

      {/* Hamburger toggle — below md only, sidebar is always visible at md+ */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="md:hidden fixed top-4 right-4 z-50 w-10 h-10 rounded-lg border border-white/10 bg-dark-neutral-offset text-white/70 hover:text-white flex items-center justify-center transition-colors duration-150"
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
      )}

      {/* Backdrop — below md only, while the drawer is open */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`w-72 max-w-[80vw] md:w-60 flex-shrink-0 border-l md:border-l-0 md:border-r border-white/[0.08] bg-dark-neutral-offset flex flex-col fixed md:static inset-y-0 right-0 z-50 transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08]">
          <Link
            to="/admin"
            onClick={() => setIsOpen(false)}
            className="flex-1 block px-5 py-6 hover:bg-white/[0.03] transition-colors duration-150"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 540 110"
              preserveAspectRatio="none"
              className="h-14 w-full"
              aria-label="Balisong Flipping Center"
            >
              <path d="M 52,55 L 6,12 L 0,18 L 4,26 L 44,59 Z" fill="white" opacity="0.95"/>
              <path d="M 52,55 L 6,12 L 10,8 L 56,51 Z" fill="white" opacity="0.3"/>
              <path d="M 52,55 L 6,98 L 0,92 L 4,84 L 44,51 Z" fill="white" opacity="0.95"/>
              <path d="M 52,55 L 6,98 L 10,102 L 56,59 Z" fill="white" opacity="0.3"/>
              <path d="M 52,55 C 70,54 92,50 112,46 C 130,42 142,38 148,35 C 142,41 130,47 112,52 C 92,57 70,58 52,57 Z" fill="white" opacity="0.95"/>
              <circle cx="52" cy="55" r="4.5" fill="white"/>
              <circle cx="52" cy="55" r="2" fill="black"/>
              <text x="170" y="55" fontFamily="'Bebas Neue','Impact',sans-serif" fontSize="54" letterSpacing="4" fill="white">BALISONG</text>
              <rect x="174" y="66" width="270" height="1.5" rx="0.75" fill="white" opacity="0.75"/>
              <text x="174" y="90" fontFamily="'Barlow','Arial Narrow',sans-serif" fontSize="26" fontWeight="600" letterSpacing="4" fill="white" opacity="0.7">FLIPPING CENTER</text>
            </svg>
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="md:hidden w-9 h-9 mr-4 rounded-lg flex items-center justify-center text-white/40 hover:text-white transition-colors duration-150 flex-shrink-0"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "bg-blue-primary/15 text-blue-primary"
                    : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                }`
              }
            >
              <FontAwesomeIcon icon={item.icon} className="w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/[0.08] flex flex-col gap-2">
          {user?.displayName && (
            <p className="px-3 text-white/30 text-xs truncate">Signed in as {user.displayName}</p>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors duration-150"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="w-4" />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
