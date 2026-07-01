import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TutorialCenterPageBackground from "../components/TutorialCenterPageBackground";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faLock,
  faChevronLeft,
} from "@fortawesome/free-solid-svg-icons";
import { axiosApiInstance } from "../api/axios";
import { PostDetail, mapPostDetail } from "../modals/Post";
import FeedPostCard from "../components/FeedPostCard";

// ── Level config ──────────────────────────────────────────────────────────────

const LEVEL_CONFIG = {
  beginner: {
    label: "Beginner",
    value: "BEGINNER",
    accentColor: "#22c55e",
    colorClass: "text-green",
    borderClass: "border-green/30",
    bgClass: "bg-green/8",
    badgeClass: "bg-green/15 border-green/35 text-green",
    desc: "Start your balisong journey here. Learn the foundational grip, safe handling, and your first core tricks before moving on.",
    prev: null as string | null,
    next: "intermediate" as string | null,
    prevLabel: null as string | null,
    nextLabel: "Intermediate" as string | null,
  },
  intermediate: {
    label: "Intermediate",
    value: "INTERMEDIATE",
    accentColor: "#e6b800",
    colorClass: "text-gold",
    borderClass: "border-gold/30",
    bgClass: "bg-gold/8",
    badgeClass: "bg-gold/15 border-gold/35 text-gold",
    desc: "You've got the basics down. Now build fluency, work on transitions, and start linking tricks into combos.",
    prev: "beginner",
    next: "advanced",
    prevLabel: "Beginner",
    nextLabel: "Advanced",
  },
  advanced: {
    label: "Advanced",
    value: "ADVANCED",
    accentColor: "#b91c1c",
    colorClass: "text-red",
    borderClass: "border-red/30",
    bgClass: "bg-red/8",
    badgeClass: "bg-red/15 border-red/35 text-red",
    desc: "For dedicated flippers pushing the limits. Tackle complex aerials, difficult transfer tricks, and full competition-level combos.",
    prev: "intermediate",
    next: null,
    prevLabel: "Intermediate",
    nextLabel: null,
  },
} as const;

type LevelSlug = keyof typeof LEVEL_CONFIG;

const PAGE_SIZE = 10;

// ── Coming Soon block ─────────────────────────────────────────────────────────

const TrickLibraryComingSoon = ({ accentColor }: { accentColor: string }) => (
  <div
    className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] flex flex-col items-center justify-center py-16 px-6 gap-4 relative overflow-hidden"
  >
    {/* Faint glow blob */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `radial-gradient(ellipse at 50% 60%, ${accentColor}18 0%, transparent 70%)`,
      }}
    />
    <div
      className="w-14 h-14 rounded-2xl border flex items-center justify-center relative z-10"
      style={{ borderColor: `${accentColor}40`, background: `${accentColor}10` }}
    >
      <FontAwesomeIcon icon={faLock} className="text-xl" style={{ color: accentColor }} />
    </div>
    <div className="flex flex-col items-center gap-1.5 relative z-10 text-center">
      <h3 className="text-white font-bold text-lg">Trick Library — Coming Soon</h3>
      <p className="text-white/40 text-sm max-w-sm">
        Step-by-step trick tutorials for this level are being built out. Check back soon.
      </p>
    </div>
  </div>
);

// ── Feed ──────────────────────────────────────────────────────────────────────

const LevelFeed = ({ levelValue }: { levelValue: string }) => {
  const [posts, setPosts] = useState<PostDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialDone, setInitialDone] = useState(false);
  const page = useRef(0);
  const isFetching = useRef(false);

  const fetchPosts = useCallback((pageIndex: number) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setIsLoading(true);
    setFetchError(false);

    axiosApiInstance
      .get("/posts/any", { params: { page: pageIndex, size: PAGE_SIZE, difficultyTag: levelValue } })
      .then((res) => {
        let mapped: PostDetail[] = (res.data?.content ?? [])
          .map(mapPostDetail)
          .filter(
            (p: PostDetail) => p.postType === "COMBO" || p.postType === "TRICK_TUTORIAL"
          );

        if (pageIndex === 0) setPosts(mapped);
        else setPosts((prev) => [...prev, ...mapped]);
        setHasMore(pageIndex < (res.data?.totalPages ?? 1) - 1);
        page.current = pageIndex;
      })
      .catch(() => setFetchError(true))
      .finally(() => {
        setIsLoading(false);
        setInitialDone(true);
        isFetching.current = false;
      });
  }, [levelValue]);

  useEffect(() => { fetchPosts(0); }, [fetchPosts]);

  const handleLoadMore = () => fetchPosts(page.current + 1);

  if (!initialDone) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 rounded-full border-2 border-blue-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <p className="text-white/40 text-sm">Failed to load posts.</p>
        <button
          type="button"
          onClick={() => { page.current = 0; isFetching.current = false; fetchPosts(0); }}
          className="text-blue-primary text-xs hover:text-blue-primary/70 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <p className="text-white/40 text-sm font-medium">No community posts at this level yet.</p>
        <p className="text-white/20 text-xs">Be the first to share a trick or combo!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col xsm:gap-3 lg:gap-4">
      {posts.map((post, i) => (
        <div key={post.id} className="xsm:-mx-4 md:mx-0">
          <FeedPostCard
            post={post}
            index={i}
            variant="feed"
          />
        </div>
      ))}
      {hasMore && (
        <div className="flex justify-center pt-2 pb-4">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm font-medium hover:text-white hover:border-white/20 hover:bg-white/5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading
              ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-transparent animate-spin" /> Loading...</>
              : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const TutorialCenterLevelPage = () => {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();

  const config = level && level in LEVEL_CONFIG
    ? LEVEL_CONFIG[level as LevelSlug]
    : null;

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-white/40">Level not found.</p>
        <button
          type="button"
          onClick={() => navigate("/tutorial-center")}
          className="text-blue-primary text-sm hover:text-blue-primary/70 transition-colors"
        >
          Back to Tutorial Center
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen text-white relative">
      <TutorialCenterPageBackground />
      <div className="relative z-10 max-w-[900px] mx-auto md:px-6 lg:px-8 xsm:pt-8 xsm:pb-28 md:py-8">

        {/* Back link */}
        <button
          type="button"
          onClick={() => navigate("/tutorial-center")}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.12] text-white/70 hover:text-white hover:border-white/20 text-sm font-medium mb-6 xsm:mx-4 md:mx-0 transition-all duration-150"
          style={{ background: "rgba(0,0,0,0.3)" }}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
          Tutorial Center
        </button>

        {/* Hero */}
        <div
          className="w-full md:rounded-2xl border-y md:border xsm:p-6 md:p-10 mb-6 relative overflow-hidden"
          style={{
            borderColor: `${config.accentColor}40`,
            background: "rgba(2,8,8,0.75)",
            boxShadow: `0 0 60px 0 ${config.accentColor}18`,
          }}
        >
          {/* Strong left-side accent glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at -10% 50%, ${config.accentColor}30 0%, transparent 60%)`,
            }}
          />
          {/* Bottom edge accent line */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[2px] pointer-events-none"
            style={{
              background: `linear-gradient(to right, ${config.accentColor}80, transparent)`,
            }}
          />
          <div className="relative z-10 flex flex-col gap-4">
            <span
              className={`self-start text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${config.badgeClass}`}
            >
              {config.label}
            </span>
            <h1 className="text-white font-bold xsm:text-3xl md:text-4xl leading-tight">
              {config.label} Tricks & Tutorials
            </h1>
            <p className="text-white/65 xsm:text-sm md:text-base max-w-lg leading-relaxed">
              {config.desc}
            </p>
          </div>
        </div>

        {/* Content card */}
        <div
          className="md:rounded-2xl border-y md:border border-white/[0.07] p-6 flex flex-col gap-8"
          style={{ background: "rgba(2,8,8,0.82)" }}
        >
          {/* Trick Library */}
          <div>
            <h2 className="text-white font-semibold text-base mb-3">Trick Library</h2>
            <TrickLibraryComingSoon accentColor={config.accentColor} />
          </div>

          {/* Level navigation */}
          <div className="flex items-center justify-between gap-4">
            {config.prev ? (
              <button
                type="button"
                onClick={() => navigate(`/tutorial-center/${config.prev}`)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm font-medium hover:text-white hover:border-white/20 hover:bg-white/5 transition-all duration-200"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
                {config.prevLabel}
              </button>
            ) : <div />}

            {config.next ? (
              <button
                type="button"
                onClick={() => navigate(`/tutorial-center/${config.next}`)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm font-medium hover:text-white hover:border-white/20 hover:bg-white/5 transition-all duration-200"
              >
                {config.nextLabel}
                <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              </button>
            ) : <div />}
          </div>

          {/* Community feed */}
          <div>
            <h2 className="text-white font-semibold text-base mb-4">Community Posts</h2>
            <LevelFeed levelValue={config.value} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default TutorialCenterLevelPage;
