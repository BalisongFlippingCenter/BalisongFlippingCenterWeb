import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faFileImport, faPen, faTrash, faIndustry } from "@fortawesome/free-solid-svg-icons";
import { listMakers, deleteMaker, MakerSummary } from "../../api/adminCatalogApi";
import { addUIToast } from "../../redux/uiToast/uiToastSlice";
import { useAppDispatch } from "../../redux/hooks";

const AdminCatalogPage = () => {
  const dispatch = useAppDispatch();
  const [makers, setMakers] = useState<MakerSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const fetchMakers = () => {
    setIsLoading(true);
    listMakers()
      .then(setMakers)
      .catch(() => dispatch(addUIToast({ type: "error", message: "Failed to load makers." })))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchMakers();
  }, []);

  const handleDelete = (slug: string) => {
    setDeletingSlug(slug);
    deleteMaker(slug)
      .then(() => {
        setMakers((prev) => prev.filter((m) => m.slug !== slug));
        dispatch(addUIToast({ type: "success", message: "Maker deleted." }));
      })
      .catch((err) => {
        const msg = err?.response?.data ?? "Failed to delete maker.";
        dispatch(addUIToast({ type: "error", message: typeof msg === "string" ? msg : "Failed to delete maker." }));
      })
      .finally(() => setDeletingSlug(null));
  };

  return (
    <div className="px-8 py-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-white text-2xl font-bold">Catalog</h1>
          <p className="text-white/40 text-sm mt-1">Makers and knives shown in Product World.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/catalog/import"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white/60 text-sm font-medium hover:text-white hover:border-white/25 transition-colors duration-150"
          >
            <FontAwesomeIcon icon={faFileImport} />
            Bulk Import
          </Link>
          <Link
            to="/admin/catalog/makers/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-primary text-white text-sm font-semibold hover:brightness-110 transition-[filter] duration-150"
          >
            <FontAwesomeIcon icon={faPlus} />
            New Maker
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {isLoading ? (
          <p className="text-white/40 text-sm">Loading...</p>
        ) : makers.length === 0 ? (
          <p className="text-white/40 text-sm">No makers yet.</p>
        ) : (
          makers.map((maker) => (
            <div
              key={maker.slug}
              className="px-5 py-4 rounded-xl border border-white/[0.08] bg-dark-neutral-offset flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {maker.logoUrl ? (
                    <img src={maker.logoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FontAwesomeIcon icon={faIndustry} className="text-white/20" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{maker.name}</p>
                  <p className="text-white/40 text-xs truncate">{maker.country ?? "—"} · {maker.slug}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  to={`/admin/catalog/makers/${maker.slug}/edit`}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors duration-150"
                >
                  <FontAwesomeIcon icon={faPen} className="text-xs" />
                </Link>
                <button
                  type="button"
                  disabled={deletingSlug === maker.slug}
                  onClick={() => handleDelete(maker.slug)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red hover:bg-red/10 transition-colors duration-150 disabled:opacity-40"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminCatalogPage;
