import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import { axiosApiInstance } from "../api/axios";
import { PostDetail, mapPostDetail } from "../modals/Post";
import FeedPostCard from "../components/FeedPostCard";
import TutorialCenterPageBackground from "../components/TutorialCenterPageBackground";
import tricksData from "../data/tricks.json";

// ── Constants ─────────────────────────────────────────────────────────────────

interface TrickEntry { slug: string; level: string; name: string; duration: string; aliases?: string[] }

const LEVEL_CHIP: Record<string, string> = {
  beginner:     "bg-green/15 border-green/30 text-green",
  intermediate: "bg-gold/15 border-gold/30 text-gold",
  advanced:     "bg-red/15 border-red/30 text-red",
};

const POST_TYPE_FILTERS = [
  { value: "ALL",            label: "All"      },
  { value: "COMBO",          label: "Combo"    },
  { value: "TRICK_TUTORIAL", label: "Tutorial" },
] as const;

const DIFFICULTY_FILTERS = [
  { value: "ALL",          label: "All"          },
  { value: "BEGINNER",     label: "Beginner"     },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED",     label: "Advanced"     },
] as const;

// ── Trick results ─────────────────────────────────────────────────────────────

const matchesTrickName = (name: string, aliases: string[] | undefined, query: string): boolean => {
  const q = query.toLowerCase().trim();
  if (!q) return false;
  const candidates = [name, ...(aliases ?? [])];
  for (const candidate of candidates) {
    const c = candidate.toLowerCase();
    if (c.includes(q)) return true;
    const tokens = q.split(/\s+/).filter(Boolean);
    if (tokens.length > 1 && tokens.every((tok) => c.includes(tok))) return true;
  }
  // also check if query matches any single alias exactly or as token set across name
  const tokens = q.split(/\s+/).filter(Boolean);
  const nameNorm = name.toLowerCase().replace(/\s+/g, "");
  const qNorm = q.replace(/\s+/g, "");
  if (nameNorm.includes(qNorm)) return true;
  if (tokens.length > 0) {
    const nameWords = name.toLowerCase().replace(/[^a-z0-9 ]/g, "");
    if (tokens.every((tok) => nameWords.includes(tok))) return true;
  }
  return false;
};

const TrickResults = ({ query, onNavigate }: { query: string; onNavigate: (path: string) => void }) => {
  const matches = (tricksData as TrickEntry[]).filter((t) => matchesTrickName(t.name, t.aliases, query));
  if (matches.length === 0) return null;
  return (
    <div className="mb-8">
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Trick Pages</p>
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

// ── Post feed ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

const SearchPostFeed = ({
  query,
  postType,
  difficulty,
}: {
  query: string;
  postType: string;
  difficulty: string;
}) => {
  const [posts, setPosts]             = useState<PostDetail[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [fetchError, setFetchError]   = useState(false);
  const [hasMore, setHasMore]         = useState(false);
  const [initialDone, setInitialDone] = useState(false);
  const page       = useRef(0);
  const isFetching = useRef(false);

  const fetchPosts = useCallback((pageIndex: number) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setIsLoading(true);
    setFetchError(false);

    const params: Record<string, string | number> = { page: pageIndex, size: PAGE_SIZE, search: query };
    if (postType !== "ALL") params.postType = postType;
    if (difficulty !== "ALL") params.difficultyTag = difficulty;

    axiosApiInstance
      .get("/posts/any", { params })
      .then((res) => {
        const mapped: PostDetail[] = (res.data?.content ?? []).map(mapPostDetail);
        if (pageIndex === 0) setPosts(mapped);
        else setPosts((prev) => [...prev, ...mapped]);
        setHasMore(pageIndex < (res.data?.totalPages ?? 1) - 1);
        page.current = pageIndex;
      })
      .catch(() => setFetchError(true))
      .finally(() => { setIsLoading(false); setInitialDone(true); isFetching.current = false; });
  }, [query, postType, difficulty]);

  useEffect(() => {
    setPosts([]); setInitialDone(false); setHasMore(false);
    page.current = 0; isFetching.current = false;
    fetchPosts(0);
  }, [fetchPosts]);

  if (!initialDone) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#0d9488", borderTopColor: "transparent" }} />
      </div>
    );
  }
  if (fetchError) {
    return (
      <div className="flex flex-col items-center gap-2 py-12">
        <p className="text-white/40 text-sm">Failed to load posts.</p>
        <button type="button" onClick={() => { isFetching.current = false; fetchPosts(0); }} className="text-[#5eead4]/70 text-xs hover:text-[#5eead4] transition-colors">Try again</button>
      </div>
    );
  }
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <p className="text-white/40 text-sm">No posts found for "{query}".</p>
        <p className="text-white/20 text-xs">Try adjusting your filters or search term.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {posts.map((post, i) => (
        <div key={post.id}>
          <FeedPostCard post={post} index={i} />
        </div>
      ))}
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

// ── Filter chip ───────────────────────────────────────────────────────────────

const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
      active
        ? "bg-teal/15 border-teal/40 text-[#5eead4]"
        : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
    }`}
  >
    {label}
  </button>
);

// ── Page ──────────────────────────────────────────────────────────────────────

const TutorialCenterSearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const query      = searchParams.get("q") ?? "";
  const postType   = searchParams.get("type") ?? "ALL";
  const difficulty = searchParams.get("difficulty") ?? "ALL";

  const [inputValue, setInputValue] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input when URL query changes
  useEffect(() => { setInputValue(query); }, [query]);

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const next: Record<string, string> = { q: trimmed };
    if (postType !== "ALL") next.type = postType;
    if (difficulty !== "ALL") next.difficulty = difficulty;
    setSearchParams(next, { replace: true });
  };

  const setFilter = (key: "type" | "difficulty", value: string) => {
    const next: Record<string, string> = { q: query };
    const newType       = key === "type"       ? value : postType;
    const newDifficulty = key === "difficulty" ? value : difficulty;
    if (newType !== "ALL") next.type = newType;
    if (newDifficulty !== "ALL") next.difficulty = newDifficulty;
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="w-full min-h-screen text-white relative">
      <TutorialCenterPageBackground />
      <div className="relative z-10 max-w-[760px] mx-auto md:px-6 lg:px-8 xsm:pt-8 xsm:pb-28 md:pt-8 md:pb-16 flex flex-col min-h-screen">

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate("/tutorial-center")}
          className="self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.12] text-white/70 hover:text-white hover:border-white/20 text-sm font-medium mb-5 xsm:mx-4 md:mx-0 transition-all duration-150"
          style={{ background: "rgba(0,0,0,0.3)" }}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
          Tutorial Center
        </button>

        {/* Search bar */}
        <div className="xsm:px-4 md:px-0 mb-4">
          <div className="relative flex items-center">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-4 text-[#5eead4]/60 text-sm pointer-events-none"
            />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              placeholder="Search tricks, tutorials, combos..."
              className="w-full border border-[#0d9488]/40 rounded-2xl py-4 pl-11 pr-11 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#0d9488]/70 transition-all duration-200"
              style={{ background: "rgba(3,22,20,0.85)", boxShadow: "0 4px 28px rgba(0,0,0,0.55)" }}
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
              className="absolute right-4 text-[#5eead4]/50 hover:text-[#5eead4] transition-colors"
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
            </button>
          </div>
        </div>

        {/* Card — filters + results */}
        <div
          className="flex-1 md:rounded-2xl border-y md:border border-white/[0.07] flex flex-col gap-7 xsm:p-4 md:p-6"
          style={{ background: "rgba(2,8,8,0.82)" }}
        >
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/25">Type</span>
              <div className="flex gap-1.5">
                {POST_TYPE_FILTERS.map(({ value, label }) => (
                  <FilterChip
                    key={value}
                    label={label}
                    active={postType === value}
                    onClick={() => setFilter("type", value)}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/25">Level</span>
              <div className="flex gap-1.5">
                {DIFFICULTY_FILTERS.map(({ value, label }) => (
                  <FilterChip
                    key={value}
                    label={label}
                    active={difficulty === value}
                    onClick={() => setFilter("difficulty", value)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="h-px bg-white/[0.06]" />

          {/* Header */}
          <div>
            <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-0.5">Results for</p>
            <h1 className="text-white font-bold text-2xl md:text-3xl leading-tight break-words">"{query}"</h1>
          </div>

          {/* Trick page matches */}
          {query && <TrickResults query={query} onNavigate={navigate} />}

          {/* Community posts */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Community Posts</p>
            {query ? (
              <SearchPostFeed query={query} postType={postType} difficulty={difficulty} />
            ) : (
              <p className="text-white/25 text-sm">Enter a search term to find posts.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TutorialCenterSearchPage;
