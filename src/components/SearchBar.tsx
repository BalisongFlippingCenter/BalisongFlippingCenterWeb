import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faXmark,
  faChevronRight,
  faArrowRight,
  faClockRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { SITE_ROUTES, matchRoute, SiteRoute } from "../data/siteRoutes";
import { axiosApiInstance } from "../api/axios";
import knivesData from "../data/knives.json";
import makersData from "../data/makers.json";
import tricksData from "../data/tricks.json";

// ── Types ─────────────────────────────────────────────────────────────────────

interface KnifeEntry  { slug: string; maker: string; name: string; bladeStyle: string; priceRange: string }
interface MakerEntry  { slug: string; name: string; country: string; knownFor: string }
interface TrickEntry  { slug: string; level: string; name: string; aliases?: string[] }

interface UserEntry {
  accountId:      string;
  displayName:    string;
  identifierCode: string;
  profileImg:     string | null;
  profileCaption: string | null;
}

interface SearchResults {
  pages:  SiteRoute[];
  tricks: TrickEntry[];
  knives: KnifeEntry[];
  makers: MakerEntry[];
}

const MAX = 3;

const LEVEL_COLOR: Record<string, string> = {
  beginner:     "text-green",
  intermediate: "text-gold",
  advanced:     "text-red",
};

// ── History helpers ────────────────────────────────────────────────────────────

const HISTORY_KEY = "search_history";
const MAX_HISTORY = 5;

function getHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"); }
  catch { return []; }
}

function addToHistory(term: string) {
  const t = term.trim();
  if (!t) return;
  const h = getHistory().filter((x) => x !== t);
  h.unshift(t);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, MAX_HISTORY)));
}

function removeFromHistory(term: string) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(getHistory().filter((x) => x !== term)));
}

// ── Search logic ──────────────────────────────────────────────────────────────

function tokenMatch(haystack: string, query: string): boolean {
  const h = haystack.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return false;
  if (h.includes(q)) return true;
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.length > 1 && tokens.every((t) => h.includes(t));
}

function computeResults(query: string): SearchResults {
  const q = query.trim();
  if (!q) return { pages: [], tricks: [], knives: [], makers: [] };

  const pages = SITE_ROUTES.filter((r) => matchRoute(r, q)).slice(0, MAX);

  const tricks = (tricksData as TrickEntry[])
    .filter((t) => [t.name, ...(t.aliases ?? [])].some((c) => tokenMatch(c, q)))
    .slice(0, MAX);

  const knives = (knivesData as KnifeEntry[])
    .filter((k) => tokenMatch(k.name, q) || tokenMatch(k.maker, q))
    .slice(0, MAX);

  const makers = (makersData as MakerEntry[])
    .filter((m) => tokenMatch(m.name, q) || tokenMatch(m.knownFor ?? "", q))
    .slice(0, MAX);

  return { pages, tricks, knives, makers };
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  toggleSearchBar: () => void;
  mobile?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

const SearchBar = ({ toggleSearchBar, mobile = false }: Props) => {
  const [query,       setQuery]       = useState("");
  const [results,     setResults]     = useState<SearchResults | null>(null);
  const [userResults, setUserResults] = useState<UserEntry[]>([]);
  const [isOpen,      setIsOpen]      = useState(false);
  const [isFocused,   setIsFocused]   = useState(false);
  const [history,     setHistory]     = useState<string[]>([]);
  const [dropdownTop, setDropdownTop] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRowRef  = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const navigate     = useNavigate();

  // Track the bottom edge of the input row for portal positioning
  useEffect(() => {
    if (!mobile) return;
    const update = () => {
      if (inputRowRef.current) {
        setDropdownTop(inputRowRef.current.getBoundingClientRect().bottom + 8);
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [mobile]);

  // On mount in mobile/overlay mode, focus input and load history
  useEffect(() => {
    if (mobile) {
      inputRef.current?.focus();
      setHistory(getHistory());
      setIsFocused(true);
    }
  }, [mobile]);

  // Close dropdown on outside click (desktop only)
  useEffect(() => {
    if (mobile) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobile]);

  // Debounced static search
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = query.trim();
      if (trimmed.length >= 2) {
        setResults(computeResults(trimmed));
        setIsOpen(true);
      } else {
        setResults(null);
        setUserResults([]);
        setIsOpen(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Debounced user search (live API)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) { setUserResults([]); return; }
    const timer = setTimeout(() => {
      axiosApiInstance
        .get("/accounts/any/search", { params: { q: trimmed } })
        .then((res) => setUserResults((res.data ?? []).slice(0, 3)))
        .catch(() => setUserResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const hasResults =
    userResults.length > 0 ||
    (results && (results.pages.length > 0 || results.tricks.length > 0 ||
     results.knives.length > 0 || results.makers.length > 0));

  const goTo = (path: string) => {
    const trimmed = query.trim();
    if (trimmed) { addToHistory(trimmed); setHistory(getHistory()); }
    navigate(path);
    setQuery("");
    setIsOpen(false);
    setIsFocused(false);
    if (mobile) toggleSearchBar();
  };

  const goToHistoryItem = (term: string) => {
    addToHistory(term);
    navigate(`/search?q=${encodeURIComponent(term)}`);
    setQuery("");
    setIsOpen(false);
    setIsFocused(false);
    if (mobile) toggleSearchBar();
  };

  const submitSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    addToHistory(trimmed);
    setHistory(getHistory());
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    setQuery("");
    setIsOpen(false);
    setIsFocused(false);
    if (mobile) toggleSearchBar();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter")  submitSearch();
    if (e.key === "Escape") { setIsOpen(false); setIsFocused(false); if (mobile) toggleSearchBar(); }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setHistory(getHistory());
  };

  // ── Dropdown visibility ───────────────────────────────────────────────────────

  const showHistory = isFocused && query.trim().length < 2 && history.length > 0;
  const showResults = isOpen && query.trim().length >= 2;
  const showDropdown = showHistory || showResults;

  // ── Dropdown ─────────────────────────────────────────────────────────────────

  const dropdownInner = (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#13161d",
        border:     "1px solid rgba(255,255,255,0.09)",
        boxShadow:  "0 20px 60px rgba(0,0,0,0.85)",
      }}
    >
      {showHistory ? (
        /* ── Recent searches ──────────────────────────────────────────────── */
        <div className="p-2 flex flex-col gap-0.5">
          <div className="flex items-center justify-between px-2 pt-1 pb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Recent</p>
            <button
              type="button"
              onClick={() => { localStorage.removeItem(HISTORY_KEY); setHistory([]); }}
              className="text-[11px] text-white/30 hover:text-white/60 transition-colors duration-150"
            >
              Clear all
            </button>
          </div>
          {history.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => goToHistoryItem(term)}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.05] transition-colors duration-100 text-left group"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <FontAwesomeIcon icon={faClockRotateLeft} className="text-white/30 text-[11px]" />
              </div>
              <span className="text-white/70 text-sm flex-1 truncate">{term}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromHistory(term);
                  setHistory(getHistory());
                }}
                className="text-white/20 hover:text-white/55 transition-colors duration-100 flex-shrink-0 opacity-0 group-hover:opacity-100 p-1"
              >
                <FontAwesomeIcon icon={faXmark} className="text-xs" />
              </button>
            </button>
          ))}
        </div>
      ) : (
        /* ── Search results ───────────────────────────────────────────────── */
        <div className="overflow-y-auto max-h-[70vh] p-2 flex flex-col gap-0.5">

          {!hasResults ? (
            <div className="px-3 py-5 text-center">
              <p className="text-white/30 text-sm">No quick results</p>
              <p className="text-white/20 text-xs mt-1">Press Enter to search posts &amp; more</p>
            </div>
          ) : (
            <>
              {/* Users */}
              {userResults.length > 0 && (
                <div className="mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 px-2 pt-1.5 pb-1.5">
                    Users
                  </p>
                  {userResults.map((u) => (
                    <button
                      key={u.accountId}
                      type="button"
                      onClick={() => goTo(`/${u.displayName}/${u.identifierCode}`)}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.05] transition-colors duration-100 text-left group"
                    >
                      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-white/10 bg-white/5">
                        {u.profileImg ? (
                          <img src={u.profileImg} alt={u.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/30 text-xs font-bold">
                            {u.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/85 text-sm font-medium leading-tight truncate">
                          {u.displayName}
                          <span className="text-white/30 font-normal text-[11px]"> #{u.identifierCode}</span>
                        </p>
                        {u.profileCaption && (
                          <p className="text-white/30 text-[11px] truncate">{u.profileCaption}</p>
                        )}
                      </div>
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className="text-white/15 group-hover:text-white/40 text-[10px] flex-shrink-0 transition-colors"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* App Pages */}
              {results && results.pages.length > 0 && (
                <div className="mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 px-2 pt-1.5 pb-1.5">
                    App Pages
                  </p>
                  {results.pages.map((r) => (
                    <button
                      key={r.path}
                      type="button"
                      onClick={() => goTo(r.path)}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.05] transition-colors duration-100 text-left group"
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(16,129,152,0.15)" }}
                      >
                        <FontAwesomeIcon icon={r.icon} className="text-blue-primary text-[11px]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/85 text-sm font-medium leading-tight truncate">{r.title}</p>
                        <p className="text-white/30 text-[11px] truncate">{r.subtitle}</p>
                      </div>
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className="text-white/15 group-hover:text-white/40 text-[10px] flex-shrink-0 transition-colors"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Tricks */}
              {results && results.tricks.length > 0 && (
                <div className="mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 px-2 pt-1.5 pb-1.5">
                    Tricks
                  </p>
                  {results.tricks.map((t) => (
                    <button
                      key={`${t.level}-${t.slug}`}
                      type="button"
                      onClick={() => goTo(`/tutorial-center/${t.level}/${t.slug}`)}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.05] transition-colors duration-100 text-left group"
                    >
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider w-7 text-center flex-shrink-0 ${
                          LEVEL_COLOR[t.level] ?? "text-white/40"
                        }`}
                      >
                        {t.level.slice(0, 3)}
                      </span>
                      <span className="text-white/80 text-sm flex-1 truncate">{t.name}</span>
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className="text-white/15 group-hover:text-white/40 text-[10px] flex-shrink-0 transition-colors"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Knives */}
              {results && results.knives.length > 0 && (
                <div className="mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 px-2 pt-1.5 pb-1.5">
                    Knives
                  </p>
                  {results.knives.map((k) => (
                    <button
                      key={k.slug}
                      type="button"
                      onClick={() => goTo(`/product-world/knife/${k.slug}`)}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.05] transition-colors duration-100 text-left group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm font-medium truncate">{k.name}</p>
                        <p className="text-white/30 text-[11px] truncate">{k.maker}</p>
                      </div>
                      {k.priceRange && (
                        <span className="text-gold/60 text-xs flex-shrink-0">{k.priceRange}</span>
                      )}
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className="text-white/15 group-hover:text-white/40 text-[10px] flex-shrink-0 transition-colors"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Makers */}
              {results && results.makers.length > 0 && (
                <div className="mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 px-2 pt-1.5 pb-1.5">
                    Makers
                  </p>
                  {results.makers.map((m) => (
                    <button
                      key={m.slug}
                      type="button"
                      onClick={() => goTo(`/product-world/maker/${m.slug}`)}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.05] transition-colors duration-100 text-left group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm font-medium truncate">{m.name}</p>
                        <p className="text-white/30 text-[11px] truncate">{m.country}</p>
                      </div>
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className="text-white/15 group-hover:text-white/40 text-[10px] flex-shrink-0 transition-colors"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* See all results footer */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} className="pt-1.5 mt-0.5">
            <button
              type="button"
              onClick={submitSearch}
              className="w-full flex items-center justify-between px-2 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors duration-100 group"
            >
              <span className="text-white/40 text-sm">
                See all results for{" "}
                <span className="text-white/70 font-medium">"{query.trim()}"</span>
              </span>
              <FontAwesomeIcon
                icon={faArrowRight}
                className="text-white/20 group-hover:text-white/50 text-xs flex-shrink-0 transition-colors"
              />
            </button>
          </div>

        </div>
      )}
    </div>
  );

  // Mobile: render via portal with fixed position so it escapes the header's
  // flex-centering context and always starts just below the header.
  // Desktop: absolute positioned relative to the SearchBar container.
  const dropdown = showDropdown ? (
    mobile
      ? createPortal(
          <div
            className="fixed left-0 right-0 z-[999] px-4"
            style={{ top: dropdownTop }}
          >
            {dropdownInner}
          </div>,
          document.body
        )
      : (
          <div className="absolute top-full right-0 mt-2 w-[340px] z-50">
            {dropdownInner}
          </div>
        )
  ) : null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className={mobile ? "w-full flex flex-col" : "relative flex flex-col"}
    >
      {/* Input pill */}
      <div ref={inputRowRef} className="flex items-center">
        <div
          className={`flex items-center py-2 pl-4 pr-3 gap-3 bg-white/5 border rounded-full transition-colors duration-200 ${
            isOpen || isFocused ? "border-blue-primary/60" : "border-white/15 focus-within:border-blue-primary/60"
          } ${mobile ? "flex-1" : ""}`}
        >
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="text-white/50 flex-shrink-0"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder="Search..."
            className={`outline-none text-white bg-transparent placeholder-white/35 text-sm ${
              mobile ? "flex-1" : "lg:w-48 md:w-36 xsm:w-32"
            }`}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="text-white/25 hover:text-white/55 transition-colors flex-shrink-0"
            >
              <FontAwesomeIcon icon={faXmark} className="text-sm" />
            </button>
          )}
        </div>

        {/* Mobile cancel button */}
        {mobile && (
          <button
            className="ml-3 text-white/50 hover:text-white transition-colors duration-150 text-sm font-medium flex-shrink-0"
            type="button"
            onClick={toggleSearchBar}
          >
            Cancel
          </button>
        )}
      </div>

      {dropdown}
    </div>
  );
};

export default SearchBar;
