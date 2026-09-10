import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faFileImport, faTrash, faIndustry, faTag, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import {
  listMakers, deleteMaker, MakerSummary,
  listKnives, deleteKnife, KnifeSummary,
} from "../../api/adminCatalogApi";
import { addUIToast } from "../../redux/uiToast/uiToastSlice";
import { useAppDispatch } from "../../redux/hooks";

const AdminCatalogPage = () => {
  const dispatch = useAppDispatch();
  const [makers, setMakers] = useState<MakerSummary[]>([]);
  const [knives, setKnives] = useState<KnifeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const filteredMakers = useMemo(
    () => makers.filter((m) => !query || m.name.toLowerCase().includes(query) || m.slug.toLowerCase().includes(query) || m.country?.toLowerCase().includes(query)),
    [makers, query]
  );
  const filteredKnives = useMemo(
    () => knives.filter((k) => !query || k.name.toLowerCase().includes(query) || k.slug.toLowerCase().includes(query) || k.makerName.toLowerCase().includes(query)),
    [knives, query]
  );

  const fetchAll = () => {
    setIsLoading(true);
    Promise.all([listMakers(), listKnives()])
      .then(([makerResults, knifeResults]) => {
        setMakers(makerResults);
        setKnives(knifeResults);
      })
      .catch(() => dispatch(addUIToast({ type: "error", message: "Failed to load catalog." })))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleDeleteMaker = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
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

  const handleDeleteKnife = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingSlug(slug);
    deleteKnife(slug)
      .then(() => {
        setKnives((prev) => prev.filter((k) => k.slug !== slug));
        dispatch(addUIToast({ type: "success", message: "Knife deleted." }));
      })
      .catch((err) => {
        const msg = err?.response?.data ?? "Failed to delete knife.";
        dispatch(addUIToast({ type: "error", message: typeof msg === "string" ? msg : "Failed to delete knife." }));
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
        <Link
          to="/admin/catalog/import"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white/60 text-sm font-medium hover:text-white hover:border-white/25 transition-colors duration-150"
        >
          <FontAwesomeIcon icon={faFileImport} />
          Bulk Import
        </Link>
      </div>

      <div className="relative mt-6 max-w-sm">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 text-xs pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search makers or knives..."
          className="w-full bg-dark-neutral border border-white/10 focus:border-blue-primary rounded-lg text-white text-sm pl-9 pr-3 py-2 outline-none transition-colors duration-200 placeholder:text-white/25"
        />
      </div>

      {/* Makers */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <h2 className="text-white text-lg font-semibold">Makers</h2>
        <Link
          to="/admin/catalog/makers/new"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-primary text-white text-xs font-semibold hover:brightness-110 transition-[filter] duration-150"
        >
          <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
          New Maker
        </Link>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {isLoading ? (
          <p className="text-white/40 text-sm">Loading...</p>
        ) : filteredMakers.length === 0 ? (
          <p className="text-white/40 text-sm">{query ? "No makers match your search." : "No makers yet."}</p>
        ) : (
          filteredMakers.map((maker) => (
            <Link
              key={maker.slug}
              to={`/admin/catalog/makers/${maker.slug}/edit`}
              className="px-5 py-4 rounded-xl border border-white/[0.08] bg-dark-neutral-offset flex items-center justify-between gap-4 hover:border-white/20 transition-colors duration-150"
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
                <button
                  type="button"
                  disabled={deletingSlug === maker.slug}
                  onClick={(e) => handleDeleteMaker(e, maker.slug)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red hover:bg-red/10 transition-colors duration-150 disabled:opacity-40"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                </button>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Knives */}
      <div className="mt-10 flex items-center justify-between gap-4">
        <h2 className="text-white text-lg font-semibold">Knives</h2>
        <Link
          to="/admin/catalog/knives/new"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-primary text-white text-xs font-semibold hover:brightness-110 transition-[filter] duration-150"
        >
          <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
          New Knife
        </Link>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {isLoading ? (
          <p className="text-white/40 text-sm">Loading...</p>
        ) : filteredKnives.length === 0 ? (
          <p className="text-white/40 text-sm">{query ? "No knives match your search." : "No knives yet."}</p>
        ) : (
          filteredKnives.map((knife) => (
            <Link
              key={knife.slug}
              to={`/admin/catalog/knives/${knife.slug}/edit`}
              className="px-5 py-4 rounded-xl border border-white/[0.08] bg-dark-neutral-offset flex items-center justify-between gap-4 hover:border-white/20 transition-colors duration-150"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faTag} className="text-white/20" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{knife.name}</p>
                  <p className="text-white/40 text-xs truncate">
                    {knife.makerName} · {knife.slug} {!knife.hasActiveVersion && "· All discontinued"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  disabled={deletingSlug === knife.slug}
                  onClick={(e) => handleDeleteKnife(e, knife.slug)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red hover:bg-red/10 transition-colors duration-150 disabled:opacity-40"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                </button>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminCatalogPage;
