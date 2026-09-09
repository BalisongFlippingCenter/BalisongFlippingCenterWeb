import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlag, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { getReports } from "../../api/adminApi";

const AdminDashboardPage = () => {
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useEffect(() => {
    getReports({ status: "PENDING", page: 0, size: 1 })
      .then((res) => setPendingCount(res.totalElements))
      .catch(() => setPendingCount(null));
  }, []);

  return (
    <div className="px-8 py-8 max-w-3xl">
      <h1 className="text-white text-2xl font-bold">Dashboard</h1>
      <p className="text-white/40 text-sm mt-1">Overview of what needs attention.</p>

      <Link
        to="/admin/reports"
        className="mt-6 flex items-center justify-between gap-4 px-5 py-4 rounded-xl border border-white/[0.08] bg-dark-neutral-offset hover:border-white/20 transition-colors duration-150 group"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red/10 border border-red/20 flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={faFlag} className="text-red text-sm" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Pending reports</p>
            <p className="text-white/40 text-xs mt-0.5">
              {pendingCount === null ? "—" : `${pendingCount} awaiting review`}
            </p>
          </div>
        </div>
        <FontAwesomeIcon
          icon={faArrowRight}
          className="text-white/20 group-hover:text-white/50 transition-colors duration-150"
        />
      </Link>
    </div>
  );
};

export default AdminDashboardPage;
