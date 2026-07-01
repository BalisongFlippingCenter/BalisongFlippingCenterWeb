import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faPlay,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import tricks from "../data/tricks.json";
import { axiosApiInstance } from "../api/axios";
import { pushRecentlyViewed } from "./TutorialCenterPage";
import { useAppSelector } from "../redux/hooks";
import { PostDetail, mapPostDetail } from "../modals/Post";
import FeedPostCard from "../components/FeedPostCard";
import TutorialCenterPageBackground from "../components/TutorialCenterPageBackground";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TrickRef {
  name: string;
  slug: string;
  level: string;
  videoUrl: string | null;
}

interface Trick {
  slug: string;
  level: string;
  name: string;
  duration: string;
  description: string;
  videoUrl: string | null;
  steps: { title: string; body: string }[];
  tips: { type: "warning" | "info"; body: string }[];
  buildsInto: TrickRef[];
}

// ── Level config ──────────────────────────────────────────────────────────────

const LEVEL_STYLES: Record<string, { badge: string; color: string; accent: string }> = {
  beginner:     { badge: "bg-green/15 border-green/35 text-green",        color: "text-green",        accent: "#22c55e" },
  intermediate: { badge: "bg-gold/15 border-gold/35 text-gold",           color: "text-gold",         accent: "#e6b800" },
  advanced:     { badge: "bg-red/15 border-red/35 text-red",              color: "text-red",          accent: "#b91c1c" },
};

// ── Sub-components ────────────────────────────────────────────────────────────

const VideoPlayer = ({ videoUrl }: { videoUrl: string | null }) => {
  if (videoUrl) {
    return (
      <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/10">
        <iframe
          src={videoUrl}
          className="w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    );
  }
  return (
    <div className="w-full aspect-video rounded-2xl border border-white/[0.12] bg-white/[0.05] flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border border-white/15 bg-white/8 flex items-center justify-center">
        <FontAwesomeIcon icon={faPlay} className="text-white/30 text-base ml-0.5" />
      </div>
    </div>
  );
};

const TipCallout = ({ type, body }: { type: "warning" | "info"; body: string }) => {
  const styles = {
    warning: { wrap: "border-gold/25 bg-gold/8",   label: "text-gold",         text: "Common mistake:" },
    info:    { wrap: "border-blue-primary/25 bg-blue-primary/8", label: "text-blue-primary", text: "Tip:" },
  };
  const s = styles[type];
  return (
    <div className={`rounded-xl border px-4 py-4 text-white/60 text-sm leading-relaxed ${s.wrap}`}>
      <span className={`font-semibold ${s.label}`}>{s.text} </span>
      {body}
    </div>
  );
};

const PAGE_SIZE = 10;

const TrickFeed = ({ trickName }: { trickName: string }) => {
  const [posts, setPosts] = useState<PostDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [initialDone, setInitialDone] = useState(false);
  const page = useRef(0);
  const isFetching = useRef(false);

  const fetchPosts = useCallback((pageIndex: number) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setIsLoading(true);
    setFetchError(false);

    axiosApiInstance
      .get("/posts/any", { params: { page: pageIndex, size: PAGE_SIZE, search: trickName } })
      .then((res) => {
        const mapped: PostDetail[] = (res.data?.content ?? []).map(mapPostDetail);
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
  }, [trickName]);

  useEffect(() => { fetchPosts(0); }, [fetchPosts]);

  if (!initialDone) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-6 h-6 rounded-full border-2 border-blue-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center gap-2 py-10">
        <p className="text-white/40 text-sm">Failed to load posts.</p>
        <button type="button" onClick={() => { page.current = 0; isFetching.current = false; fetchPosts(0); }} className="text-blue-primary text-xs hover:text-blue-primary/70 transition-colors">Try again</button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <p className="text-white/40 text-sm">No community posts for this trick yet.</p>
        <p className="text-white/20 text-xs">Be the first to share one!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col xsm:gap-3 lg:gap-4">
      {posts.map((post, i) => (
        <div key={post.id} className="xsm:-mx-4 md:mx-0">
          <FeedPostCard post={post} index={i} variant="feed" />
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

// ── Page ──────────────────────────────────────────────────────────────────────

const TrickTutorialPage = () => {
  const { level, trickSlug } = useParams<{ level: string; trickSlug: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const lsViewedKey = `tc_recently_viewed_tricks_${user?.identifierCode ?? "guest"}`;

  const trick = (tricks as Trick[]).find(
    (t) => t.slug === trickSlug && t.level === level
  ) ?? null;

  useEffect(() => {
    if (trick) pushRecentlyViewed({ name: trick.name, slug: trick.slug, level: trick.level }, lsViewedKey);
  }, [trick?.slug]);

  const levelStyle = level && level in LEVEL_STYLES ? LEVEL_STYLES[level] : LEVEL_STYLES.beginner;

  const relatedTricks = trick?.buildsInto ?? [];

  if (!trick) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-white">
        <p className="text-white/40">Trick not found.</p>
        <button type="button" onClick={() => navigate(`/tutorial-center/${level}`)} className="text-blue-primary text-sm hover:text-blue-primary/70 transition-colors">
          Back to {level} tricks
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen text-white relative">
      <TutorialCenterPageBackground />
      <div className="relative z-10 max-w-[1100px] mx-auto md:px-6 lg:px-10 xsm:pt-8 xsm:pb-28 md:pt-8 md:pb-24">

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(`/tutorial-center/${level}`)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.12] text-white/70 hover:text-white hover:border-white/20 text-sm font-medium mb-6 xsm:mx-4 md:mx-0 transition-all duration-150"
          style={{ background: "rgba(0,0,0,0.3)" }}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
          {level ? level.charAt(0).toUpperCase() + level.slice(1) : ""} Tricks
        </button>

        {/* Hero */}
        <div className="mb-8 xsm:px-4 md:px-0">
          <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${levelStyle.badge}`}>
            {trick.level}
          </span>
          <h1 className={`font-bold xsm:text-3xl md:text-5xl leading-tight mt-3 mb-2 italic tracking-wide ${levelStyle.color}`}>
            {trick.name}
          </h1>
          <p className="text-white/60 xsm:text-base md:text-lg leading-relaxed max-w-2xl">{trick.description}</p>
        </div>

        {/* Content card */}
        <div
          className="md:rounded-2xl border-y md:border border-white/[0.07] xsm:p-4 md:p-8 flex flex-col gap-10"
          style={{ background: "rgba(2,8,8,0.82)" }}
        >

          {/* Video — full width */}
          <div>
            <VideoPlayer videoUrl={trick.videoUrl} />
            <div className="flex items-center gap-2 mt-3 px-1">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${levelStyle.badge}`}>
                {trick.level}
              </span>
              <span className="text-white/25 text-xs">{trick.duration}</span>
            </div>
          </div>

          {/* Tips */}
          {trick.tips.length > 0 && (
            <div className="flex flex-col gap-3">
              {trick.tips.map((tip, i) => (
                <TipCallout key={i} type={tip.type} body={tip.body} />
              ))}
            </div>
          )}

          {/* Builds into — carousel */}
          {relatedTricks.length > 0 && (
            <div>
              <h2 className="text-white font-bold text-base mb-4">Learn Next</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {relatedTricks.map((t) => {
                  const ts = t.level in LEVEL_STYLES ? LEVEL_STYLES[t.level as keyof typeof LEVEL_STYLES] : LEVEL_STYLES.beginner;
                  return (
                    <button
                      key={t.slug}
                      type="button"
                      onClick={() => navigate(`/tutorial-center/${t.level}/${t.slug}`)}
                      className="flex-shrink-0 w-48 flex flex-col gap-2 p-4 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-white/[0.18] hover:bg-white/[0.06] transition-all duration-200 text-left group"
                    >
                      <span className={`self-start text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${ts.badge}`}>
                        {t.level}
                      </span>
                      <p className="text-white/85 text-sm font-semibold leading-tight">{t.name}</p>
                      <FontAwesomeIcon icon={faArrowRight} className={`text-xs mt-auto ${ts.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Community posts */}
          <div>
            <h2 className="text-white font-bold text-base mb-4">Community Posts</h2>
            <TrickFeed trickName={trick.name} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default TrickTutorialPage;
