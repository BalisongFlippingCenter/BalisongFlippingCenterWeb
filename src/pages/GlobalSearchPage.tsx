import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faMagnifyingGlass,
  faXmark,
  faArrowRight,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { axiosApiInstance } from "../api/axios";
import { PostDetail, mapPostDetail } from "../modals/Post";
import FeedPostCard from "../components/FeedPostCard";
import { SITE_ROUTES, matchRoute, SiteRoute } from "../data/siteRoutes";
import knivesData from "../data/knives.json";
import makersData from "../data/makers.json";
import tricksData from "../data/tricks.json";

// ── Types ─────────────────────────────────────────────────────────────────────

interface KnifeVersion { versionSlug: string; version: string; discontinued: boolean }
interface KnifeEntry  { slug: string; maker: string; name: string; bladeStyle: string; priceRange: string; versions: KnifeVersion[] }
interface MakerEntry  { slug: string; name: string; country: string; knownFor: string }
interface TrickEntry  { slug: string; level: string; name: string; duration: string; aliases?: string[] }
interface UserEntry   { accountId: string; displayName: string; identifierCode: string; profileImg: string | null; profileCaption: string | null }

// ── Helpers ───────────────────────────────────────────────────────────────────

function tokenMatch(haystack: string, query: string): boolean {
  const h = haystack.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return false;
  if (h.includes(q)) return true;
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.length > 1 && tokens.every((t) => h.includes(t));
}

const LEVEL_CHIP: Record<string, string> = {
  beginner:     "bg-green/15 border-green/30 text-green",
  intermediate: "bg-gold/15 border-gold/30 text-gold",
  advanced:     "bg-red/15 border-red/30 text-red",
};

// ── Section header ────────────────────────────────────────────────────────────

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">{children}</p>
);

// ── User results ──────────────────────────────────────────────────────────────

const UserResults = ({ query, onNavigate }: { query: string; onNavigate: (p: string) => void }) => {
  const [users,   setUsers]   = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axiosApiInstance
      .get("/accounts/any/search", { params: { q: query } })
      .then((res) => setUsers(res.data ?? []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [query]);

  if (loading) {
    return (
      <div>
        <SectionLabel>Users</SectionLabel>
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#108198", borderTopColor: "transparent" }} />
        </div>
      </div>
    );
  }
  if (users.length === 0) return null;

  return (
    <div>
      <SectionLabel>Users</SectionLabel>
      <div className="flex flex-col gap-2">
        {users.map((u) => (
          <button
            key={u.accountId}
            type="button"
            onClick={() => onNavigate(`/${u.displayName}/${u.identifierCode}`)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-white/[0.16] hover:bg-white/[0.06] transition-all duration-150 text-left group"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-white/10 bg-white/5">
              {u.profileImg ? (
                <img src={u.profileImg} alt={u.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faUser} className="text-white/20 text-sm" />
                </div>
              )}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white/85 text-sm font-semibold truncate">{u.displayName}</span>
                <span className="text-white/30 text-xs font-medium flex-shrink-0">#{u.identifierCode}</span>
              </div>
              {u.profileCaption && (
                <span className="text-white/35 text-xs truncate">{u.profileCaption}</span>
              )}
            </div>
            <FontAwesomeIcon icon={faChevronRight} className="text-[10px] text-white/15 group-hover:text-white/40 transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

// ── App page results ──────────────────────────────────────────────────────────

const PageResults = ({ query, onNavigate }: { query: string; onNavigate: (p: string) => void }) => {
  const matches = SITE_ROUTES.filter((r) => matchRoute(r, query));
  if (matches.length === 0) return null;
  return (
    <div>
      <SectionLabel>App Pages</SectionLabel>
      <div className="flex flex-col gap-2">
        {matches.map((r: SiteRoute) => (
          <button
            key={r.path}
            type="button"
            onClick={() => onNavigate(r.path)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-blue-primary/30 hover:bg-blue-primary/[0.05] transition-all duration-150 text-left group"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(16,129,152,0.15)" }}
            >
              <FontAwesomeIcon icon={r.icon} className="text-blue-primary text-xs" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-white/85 text-sm font-semibold truncate">{r.title}</span>
              <span className="text-white/35 text-xs truncate">{r.subtitle}</span>
            </div>
            <FontAwesomeIcon
              icon={faChevronRight}
              className="text-[10px] text-white/15 group-hover:text-blue-primary/60 transition-colors flex-shrink-0"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Trick results ─────────────────────────────────────────────────────────────

const TrickResults = ({ query, onNavigate }: { query: string; onNavigate: (p: string) => void }) => {
  const matches = (tricksData as TrickEntry[]).filter((t) =>
    [t.name, ...(t.aliases ?? [])].some((c) => tokenMatch(c, query))
  );
  if (matches.length === 0) return null;
  return (
    <div>
      <SectionLabel>Tricks</SectionLabel>
      <div className="flex flex-col gap-2">
        {matches.map((t) => (
          <button
            key={`${t.level}-${t.slug}`}
            type="button"
            onClick={() => onNavigate(`/tutorial-center/${t.level}/${t.slug}`)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-white/[0.16] hover:bg-white/[0.06] transition-all duration-150 text-left group"
          >
            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border flex-shrink-0 ${LEVEL_CHIP[t.level] ?? LEVEL_CHIP.beginner}`}>
              {t.level.slice(0, 3)}
            </span>
            <span className="text-white/80 text-sm font-medium flex-1">{t.name}</span>
            <span className="text-white/25 text-xs flex-shrink-0">{t.duration}</span>
            <FontAwesomeIcon icon={faChevronRight} className="text-[10px] text-white/15 group-hover:text-white/40 transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Knife results ─────────────────────────────────────────────────────────────

const KnifeResults = ({ query, onNavigate }: { query: string; onNavigate: (p: string) => void }) => {
  const matches = (knivesData as KnifeEntry[]).filter(
    (k) => tokenMatch(k.name, query) || tokenMatch(k.maker, query) || tokenMatch(k.bladeStyle, query)
  );
  if (matches.length === 0) return null;
  return (
    <div>
      <SectionLabel>Knives</SectionLabel>
      <div className="flex flex-col gap-2">
        {matches.map((k) => {
          const hasActive = k.versions.some((v) => !v.discontinued);
          return (
            <button
              key={k.slug}
              type="button"
              onClick={() => onNavigate(`/product-world/knife/${k.slug}`)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150 text-left group ${
                hasActive
                  ? "border-green/25 bg-green/5 hover:border-green/40 hover:bg-green/[0.08]"
                  : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.16] hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex flex-col flex-1 min-w-0">
                <span className={`text-sm font-semibold truncate ${hasActive ? "text-white/80" : "text-white/50"}`}>
                  {k.name}
                </span>
                <span className="text-white/35 text-xs truncate">{k.maker} · {k.bladeStyle}</span>
              </div>
              {k.priceRange && (
                <span className="text-gold/60 text-xs font-medium flex-shrink-0">{k.priceRange}</span>
              )}
              <FontAwesomeIcon icon={faChevronRight} className="text-[10px] text-white/15 group-hover:text-white/40 transition-colors flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── Maker results ─────────────────────────────────────────────────────────────

const MakerResults = ({ query, onNavigate }: { query: string; onNavigate: (p: string) => void }) => {
  const matches = (makersData as MakerEntry[]).filter(
    (m) => tokenMatch(m.name, query) || tokenMatch(m.knownFor ?? "", query) || tokenMatch(m.country, query)
  );
  if (matches.length === 0) return null;
  return (
    <div>
      <SectionLabel>Makers</SectionLabel>
      <div className="flex flex-col gap-2">
        {matches.map((m) => (
          <button
            key={m.slug}
            type="button"
            onClick={() => onNavigate(`/product-world/maker/${m.slug}`)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-white/[0.16] hover:bg-white/[0.06] transition-all duration-150 text-left group"
          >
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-white/80 text-sm font-semibold truncate">{m.name}</span>
              <span className="text-white/35 text-xs truncate">{m.country}{m.knownFor ? ` · ${m.knownFor}` : ""}</span>
            </div>
            <FontAwesomeIcon icon={faChevronRight} className="text-[10px] text-white/15 group-hover:text-white/40 transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Post feed ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

const PostFeed = ({ query }: { query: string }) => {
  const [posts,       setPosts]       = useState<PostDetail[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [fetchError,  setFetchError]  = useState(false);
  const [hasMore,     setHasMore]     = useState(false);
  const [initialDone, setInitialDone] = useState(false);
  const page       = useRef(0);
  const isFetching = useRef(false);

  const fetchPosts = useCallback((pageIndex: number) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setIsLoading(true);
    setFetchError(false);
    axiosApiInstance
      .get("/posts/any", { params: { page: pageIndex, size: PAGE_SIZE, search: query } })
      .then((res) => {
        const mapped: PostDetail[] = (res.data?.content ?? []).map(mapPostDetail);
        if (pageIndex === 0) setPosts(mapped);
        else setPosts((prev) => [...prev, ...mapped]);
        setHasMore(pageIndex < (res.data?.totalPages ?? 1) - 1);
        page.current = pageIndex;
      })
      .catch(() => setFetchError(true))
      .finally(() => { setIsLoading(false); setInitialDone(true); isFetching.current = false; });
  }, [query]);

  useEffect(() => {
    setPosts([]); setInitialDone(false); setHasMore(false);
    page.current = 0; isFetching.current = false;
    fetchPosts(0);
  }, [fetchPosts]);

  if (!initialDone) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#108198", borderTopColor: "transparent" }} />
      </div>
    );
  }
  if (fetchError) {
    return (
      <div className="flex flex-col items-center gap-2 py-10">
        <p className="text-white/40 text-sm">Failed to load posts.</p>
        <button type="button" onClick={() => { isFetching.current = false; fetchPosts(0); }} className="text-blue-primary/70 text-xs hover:text-blue-primary transition-colors">Try again</button>
      </div>
    );
  }
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <p className="text-white/30 text-sm">No posts found for "{query}".</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {posts.map((post, i) => <FeedPostCard key={post.id} post={post} index={i} />)}
      {hasMore && (
        <div className="flex justify-center pt-2 pb-4">
          <button
            type="button"
            onClick={() => fetchPosts(page.current + 1)}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm font-medium hover:text-white hover:border-white/20 hover:bg-white/5 transition-all duration-200 disabled:opacity-40"
          >
            {isLoading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const GlobalSearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("q") ?? "";
  const [inputValue, setInputValue] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setInputValue(query); }, [query]);

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setSearchParams({ q: trimmed }, { replace: true });
  };

  const hasStaticResults =
    query &&
    (
      SITE_ROUTES.some((r) => matchRoute(r, query)) ||
      (tricksData as TrickEntry[]).some((t) => [t.name, ...(t.aliases ?? [])].some((c) => tokenMatch(c, query))) ||
      (knivesData as KnifeEntry[]).some((k) => tokenMatch(k.name, query) || tokenMatch(k.maker, query)) ||
      (makersData as MakerEntry[]).some((m) => tokenMatch(m.name, query))
    );

  return (
    <div className="w-full min-h-screen text-white" style={{ background: "#080a0e" }}>
      <div className="max-w-[760px] mx-auto md:px-6 lg:px-8 xsm:pt-8 xsm:pb-28 md:pt-8 md:pb-16 flex flex-col min-h-screen">

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.12] text-white/60 hover:text-white hover:border-white/20 text-sm font-medium mb-5 xsm:mx-4 md:mx-0 transition-all duration-150"
          style={{ background: "rgba(0,0,0,0.3)" }}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
          Back
        </button>

        {/* Search bar */}
        <div className="xsm:px-4 md:px-0 mb-4">
          <div className="relative flex items-center">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-4 text-blue-primary/50 text-sm pointer-events-none"
            />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              placeholder="Search anything..."
              className="w-full border border-blue-primary/30 rounded-2xl py-4 pl-11 pr-11 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-primary/60 transition-all duration-200"
              style={{ background: "rgba(8,10,14,0.9)", boxShadow: "0 4px 28px rgba(0,0,0,0.55)" }}
            />
            {inputValue ? (
              <button
                type="button"
                onClick={() => { setInputValue(""); inputRef.current?.focus(); }}
                className="absolute right-11 text-white/25 hover:text-white/60 transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="text-sm" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleSubmit}
              className="absolute right-4 text-blue-primary/40 hover:text-blue-primary transition-colors"
            >
              <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
            </button>
          </div>
        </div>

        {/* Results card */}
        <div
          className="flex-1 md:rounded-2xl border-y md:border border-white/[0.07] flex flex-col gap-7 xsm:p-4 md:p-6"
          style={{ background: "rgba(13,15,20,0.9)" }}
        >
          {/* Query header */}
          <div>
            <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-0.5">Results for</p>
            <h1 className="text-white font-bold text-2xl md:text-3xl leading-tight break-words">"{query}"</h1>
          </div>

          {/* Static + user results */}
          {query && (
            <div className="flex flex-col gap-6">
              <UserResults  query={query} onNavigate={navigate} />
              <PageResults  query={query} onNavigate={navigate} />
              <TrickResults query={query} onNavigate={navigate} />
              <KnifeResults query={query} onNavigate={navigate} />
              <MakerResults query={query} onNavigate={navigate} />
              {!hasStaticResults && (
                <p className="text-white/25 text-sm -mt-2">No pages, tricks, knives or makers matched.</p>
              )}
            </div>
          )}

          <div className="h-px bg-white/[0.06]" />

          {/* Community posts */}
          <div>
            <SectionLabel>Community Posts</SectionLabel>
            {query ? (
              <PostFeed query={query} />
            ) : (
              <p className="text-white/25 text-sm">Enter a search term above.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default GlobalSearchPage;
