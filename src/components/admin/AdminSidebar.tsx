import { Link, NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGaugeHigh, faFlag, faIndustry, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { logout } from "../../redux/auth/authActions";
import { clearCollection } from "../../redux/collection/collectionSlice";
import { clearNotifications } from "../../redux/notifications/notificationSlice";
import { addUIToast } from "../../redux/uiToast/uiToastSlice";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: faGaugeHigh, end: true },
  { to: "/admin/reports", label: "Reports", icon: faFlag, end: false },
  { to: "/admin/catalog", label: "Catalog", icon: faIndustry, end: false },
];

// Shared between AdminLayout (the /admin/* dashboard) and MainLayout (the
// handful of public/read-only pages an admin session is still allowed to
// view) -- an admin never sees the normal site header/footer/nav, only
// this sidebar, no matter which of those two it's rendering inside.
const AdminSidebar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

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

  return (
    <aside className="w-60 flex-shrink-0 border-r border-white/[0.08] bg-dark-neutral-offset flex flex-col">
      <Link to="/admin" className="block px-5 py-6 border-b border-white/[0.08] hover:bg-white/[0.03] transition-colors duration-150">
        <p className="text-white/30 text-sm font-medium">
          <span className="text-blue-primary">Balisong</span> Flipping Center
        </p>
        <p className="text-white font-bold text-2xl mt-0.5">Admin</p>
      </Link>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
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
  );
};

export default AdminSidebar;
