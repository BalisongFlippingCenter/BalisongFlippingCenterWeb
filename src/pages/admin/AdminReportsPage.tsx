import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import {
  getReports,
  updateReportStatus,
  AdminReport,
  ReportStatus,
  ReportTargetType,
} from "../../api/adminApi";
import { addUIToast } from "../../redux/uiToast/uiToastSlice";
import { useAppDispatch } from "../../redux/hooks";

const STATUS_FILTERS: (ReportStatus | "ALL")[] = ["ALL", "PENDING", "REVIEWED", "DISMISSED", "ACTIONED"];
const TARGET_TYPE_FILTERS: (ReportTargetType | "ALL")[] = ["ALL", "POST", "COMMENT", "PROFILE", "CONVERSATION", "MESSAGE"];

const STATUS_STYLES: Record<ReportStatus, string> = {
  PENDING: "bg-gold/10 text-gold border-gold/25",
  REVIEWED: "bg-blue-primary/10 text-blue-primary border-blue-primary/25",
  DISMISSED: "bg-white/[0.06] text-white/40 border-white/10",
  ACTIONED: "bg-green/10 text-green border-green/25",
};

const humanize = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");

const AdminReportsPage = () => {
  const dispatch = useAppDispatch();

  const [reports, setReports] = useState<AdminReport[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "ALL">("PENDING");
  const [targetTypeFilter, setTargetTypeFilter] = useState<ReportTargetType | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchReports = () => {
    setIsLoading(true);
    getReports({
      status: statusFilter === "ALL" ? undefined : statusFilter,
      targetType: targetTypeFilter === "ALL" ? undefined : targetTypeFilter,
      page,
      size: 20,
    })
      .then((res) => {
        setReports(res.content);
        setTotalPages(res.totalPages);
      })
      .catch(() => dispatch(addUIToast({ type: "error", message: "Failed to load reports." })))
      .finally(() => setIsLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchReports();
  }, [statusFilter, targetTypeFilter, page]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter, targetTypeFilter]);

  const handleStatusChange = (report: AdminReport, newStatus: ReportStatus) => {
    setUpdatingId(report.id);
    updateReportStatus(report.id, newStatus)
      .then((updated) => {
        setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        dispatch(addUIToast({ type: "success", message: `Report marked ${humanize(newStatus)}.` }));
      })
      .catch(() => dispatch(addUIToast({ type: "error", message: "Failed to update report status." })))
      .finally(() => setUpdatingId(null));
  };

  const viewLink = (report: AdminReport) => (report.targetType === "POST" ? `/post/${report.targetId}` : null);

  return (
    <div className="px-8 py-8">
      <h1 className="text-white text-2xl font-bold">Reports</h1>
      <p className="text-white/40 text-sm mt-1">Review and act on user-submitted reports.</p>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ReportStatus | "ALL")}
          className="bg-dark-neutral-offset border border-white/[0.08] rounded-lg text-white text-sm px-3 py-2 outline-none focus:border-blue-primary transition-colors duration-150"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>{s === "ALL" ? "All statuses" : humanize(s)}</option>
          ))}
        </select>

        <select
          value={targetTypeFilter}
          onChange={(e) => setTargetTypeFilter(e.target.value as ReportTargetType | "ALL")}
          className="bg-dark-neutral-offset border border-white/[0.08] rounded-lg text-white text-sm px-3 py-2 outline-none focus:border-blue-primary transition-colors duration-150"
        >
          {TARGET_TYPE_FILTERS.map((t) => (
            <option key={t} value={t}>{t === "ALL" ? "All target types" : humanize(t)}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="mt-6 flex flex-col gap-3">
        {isLoading ? (
          <p className="text-white/40 text-sm">Loading...</p>
        ) : reports.length === 0 ? (
          <p className="text-white/40 text-sm">No reports match these filters.</p>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="px-5 py-4 rounded-xl border border-white/[0.08] bg-dark-neutral-offset flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-sm font-semibold">{humanize(report.targetType)} #{report.targetId}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${STATUS_STYLES[report.status]}`}>
                      {humanize(report.status)}
                    </span>
                  </div>
                  <p className="text-white/60 text-sm">{humanize(report.reason)}</p>
                  {report.additionalNote && (
                    <p className="text-white/40 text-sm leading-relaxed">{report.additionalNote}</p>
                  )}
                  <p className="text-white/25 text-xs mt-1">{new Date(report.createdAt).toLocaleString()}</p>
                </div>

                {viewLink(report) && (
                  <Link
                    to={viewLink(report)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-primary text-xs font-medium hover:brightness-125 transition-[filter] duration-150 flex-shrink-0"
                  >
                    View <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[10px]" />
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
                {(["PENDING", "REVIEWED", "DISMISSED", "ACTIONED"] as ReportStatus[])
                  .filter((s) => s !== report.status)
                  .map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={updatingId === report.id}
                      onClick={() => handleStatusChange(report, s)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/25 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Mark {humanize(s)}
                    </button>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <span className="text-white/40 text-sm">Page {page + 1} of {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150"
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminReportsPage;
