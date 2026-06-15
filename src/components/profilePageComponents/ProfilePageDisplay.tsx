import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../redux/hooks";
import { axiosApiInstance } from "../../api/axios";
import PublicProfilePostsComponent from "../PublicProfilePostsComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleUser,
  faLink,
  faArrowUpRightFromSquare,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import {
  faFacebookSquare,
  faInstagram,
  faTwitterSquare,
  faYoutubeSquare,
  faRedditSquare,
  faDiscord,
} from "@fortawesome/free-brands-svg-icons";
import { motion, AnimatePresence } from "motion/react";

// ── Types ────────────────────────────────────────────────────────────────────

interface PublicProfile {
  id: string;
  displayName: string;
  identifierCode: string;
  profileImg: string | null;
  bannerImg: string | null;
  profileCaption: string | null;
  facebookLink: string | null;
  instagramLink: string | null;
  twitterLink: string | null;
  youtubeLink: string | null;
  redditLink: string | null;
  discordLink: string | null;
  personalEmailLink: string | null;
  personalWebsiteLink: string | null;
}

const mapPublicProfile = (data: any): PublicProfile => ({
  id:                  data.id                  ?? data.accountId        ?? "",
  displayName:         data.displayName         ?? "",
  identifierCode:      data.identifierCode      ?? "",
  profileImg:          data.profileImg          ?? null,
  bannerImg:           data.bannerImg           ?? null,
  // backend returns "bio"; fall back to "profileCaption" for forward-compat
  profileCaption:      data.bio                 ?? data.profileCaption   ?? null,
  facebookLink:        data.facebookLink        ?? null,
  instagramLink:       data.instagramLink       ?? null,
  twitterLink:         data.twitterLink         ?? null,
  youtubeLink:         data.youtubeLink         ?? null,
  redditLink:          data.redditLink          ?? null,
  discordLink:         data.discordLink         ?? null,
  personalEmailLink:   data.personalEmailLink   ?? null,
  personalWebsiteLink: data.personalWebsiteLink ?? null,
});

// ── Sub-components ────────────────────────────────────────────────────────────

const StatBlock = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-white font-bold text-2xl leading-none">
      {value.toLocaleString()}
    </span>
    <span className="text-white/35 text-[11px] uppercase tracking-widest">{label}</span>
  </div>
);

// ── Params ────────────────────────────────────────────────────────────────────

interface Params {
  displayName: string;
  identifierCode: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

const ProfilePageDisplay = ({ displayName, identifierCode }: Params) => {
  const navigate  = useNavigate();
  const loggedIn  = !!useAppSelector((state) => state.auth.user);

  const [profile, setProfile]       = useState<PublicProfile | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);
  const [linksOpen, setLinksOpen]   = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [bioOverflows, setBioOverflows] = useState(false);

  const bioRef    = useRef<HTMLSpanElement>(null);
  const STAT_DUMMY = { posts: 0, followers: 0, following: 0 };

  // ── Fetch public profile ───────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(false);
    axiosApiInstance
      .get(`/accounts/any`, { params: { displayName, identifierCode } })
      .then((res) => {
        setProfile(mapPublicProfile(res.data));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [displayName, identifierCode]);

  // ── Bio overflow detection ─────────────────────────────────────────────────
  useEffect(() => {
    if (bioRef.current) {
      setBioOverflows(bioRef.current.scrollHeight > bioRef.current.clientHeight);
    }
  }, [profile?.profileCaption]);

  // ── Social links array ────────────────────────────────────────────────────
  const socialLinks = profile ? [
    { href: profile.facebookLink,  icon: faFacebookSquare, color: "#1877F2", isSet: !!profile.facebookLink },
    { href: profile.instagramLink, icon: faInstagram,      color: "#E1306C", isSet: !!profile.instagramLink },
    { href: profile.twitterLink,   icon: faTwitterSquare,  color: "#1DA1F2", isSet: !!profile.twitterLink },
    { href: profile.youtubeLink,   icon: faYoutubeSquare,  color: "#FF0000", isSet: !!profile.youtubeLink },
    { href: profile.redditLink,    icon: faRedditSquare,   color: "#FF4500", isSet: !!profile.redditLink },
    { href: profile.discordLink,   icon: faDiscord,        color: "#5865F2", isSet: !!profile.discordLink },
  ] : [];

  const personalLinks = profile ? [
    {
      href: profile.personalEmailLink ? `mailto:${profile.personalEmailLink}` : null,
      icon: faLink,
      color: "#108198",
      isSet: !!profile.personalEmailLink,
    },
    {
      href: profile.personalWebsiteLink,
      icon: faArrowUpRightFromSquare,
      color: "#108198",
      isSet: !!profile.personalWebsiteLink,
    },
  ] : [];

  const hasAnyLink = [...socialLinks, ...personalLinks].some((l) => l.isSet);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <section className="w-full min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-primary border-t-transparent animate-spin" />
      </section>
    );
  }

  // ── Error / not found ──────────────────────────────────────────────────────
  if (error || !profile) {
    return (
      <section className="w-full min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <FontAwesomeIcon icon={faCircleUser} className="text-white/20 text-3xl" />
        </div>
        <div className="flex flex-col items-center gap-1 text-center px-6">
          <p className="text-white font-semibold text-lg">Profile not found</p>
          <p className="text-white/40 text-sm">
            {displayName}#{identifierCode} doesn't exist or may have been removed.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-5 py-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 text-sm transition-all duration-200"
        >
          Go back
        </button>
      </section>
    );
  }

  // ── Full profile view ──────────────────────────────────────────────────────
  return (
    <section className="relative w-full min-h-screen text-white pb-24">

      {/* Banner */}
      <div className="w-full xsm:h-[130px] md:h-40 lg:h-48 relative overflow-hidden rounded-b-3xl bg-gradient-to-b from-[#1c1f27] to-[#111318] border-b border-white/10">
        {profile.bannerImg && (
          <img
            src={profile.bannerImg}
            alt=""
            className="w-full h-full object-cover object-center"
          />
        )}
      </div>

      {/* Profile image (absolutely positioned over banner) */}
      <div className="w-full flex justify-center absolute pointer-events-none" style={{ marginTop: 0 }}>
        <div
          className="lg:h-56 lg:w-56 md:h-48 md:w-48 sm:h-40 sm:w-40 xsm:h-32 xsm:w-32 rounded-full overflow-hidden lg:-translate-y-28 md:-translate-y-24 sm:-translate-y-20 xsm:-translate-y-16 border-4 border-[#0a0c10]"
        >
          {profile.profileImg ? (
            <img
              src={profile.profileImg}
              alt={profile.displayName}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#1c1f27]">
              <FontAwesomeIcon icon={faCircleUser} className="text-white/30 text-3xl" />
            </div>
          )}
        </div>
      </div>

      {/* Profile info section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-6 xsm:pt-24 sm:pt-28 md:pt-6 lg:pt-8 pb-4 gap-6">

        {/* Left — info */}
        <div className="flex flex-col gap-3 md:gap-4 md:max-w-xs">

          {/* Display name + identifier + follow button */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCircleUser} className="text-white/50 text-2xl flex-shrink-0" />
              <h2 className="text-xl font-bold text-white leading-none">
                {profile.displayName}
              </h2>
              <span className="text-[11px] text-white/35 font-medium bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-full leading-none">
                #{profile.identifierCode}
              </span>
            </div>

            {/* Follow button — only shown to logged-in users; wired when backend supports it */}
            {loggedIn && (
              <button
                type="button"
                disabled
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-primary/15 border border-blue-primary/30 text-blue-primary/60 cursor-not-allowed transition-all duration-200"
                title="Follow feature coming soon"
              >
                <FontAwesomeIcon icon={faUserPlus} className="text-xs" />
                Follow
              </button>
            )}
          </div>

          {/* Bio */}
          {profile.profileCaption && (
            <div className="flex flex-col gap-1">
              <span
                ref={bioRef}
                className={`text-sm text-white/55 leading-relaxed whitespace-pre-wrap ${
                  bioExpanded ? "" : "line-clamp-3"
                }`}
              >
                {profile.profileCaption}
              </span>
              {bioOverflows && (
                <button
                  type="button"
                  onClick={() => setBioExpanded((p) => !p)}
                  className="text-blue-primary/70 text-xs font-medium hover:text-blue-primary transition-colors duration-150 text-left w-fit"
                >
                  {bioExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}

          {/* Links row */}
          {hasAnyLink && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLinksOpen((p) => !p)}
                className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-200 flex-shrink-0 ${
                  linksOpen
                    ? "bg-blue-primary border-blue-primary text-white"
                    : "bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                }`}
              >
                <FontAwesomeIcon icon={faLink} className="text-sm" />
              </button>

              <AnimatePresence>
                {linksOpen && (
                  <motion.div className="flex items-center gap-3 leading-none">
                    {socialLinks.filter((l) => l.isSet).map((link, i) => (
                      <motion.a
                        key={i}
                        href={link.href!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center transition-colors duration-200"
                        style={{ color: link.color }}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0, transition: { duration: 0.15, delay: i * 0.04 } }}
                        exit={{ opacity: 0, x: -16, transition: { duration: 0.2 } }}
                      >
                        <FontAwesomeIcon icon={link.icon} className="text-2xl" />
                      </motion.a>
                    ))}

                    {socialLinks.filter((l) => l.isSet).length > 0 &&
                      personalLinks.filter((l) => l.isSet).length > 0 && (
                        <motion.div
                          className="w-px h-5 bg-white/20 self-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        />
                    )}

                    {personalLinks.filter((l) => l.isSet).map((link, i) => (
                      <motion.a
                        key={i}
                        href={link.href!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center transition-colors duration-200"
                        style={{ color: link.color }}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0, transition: { duration: 0.15, delay: (socialLinks.filter(l => l.isSet).length + 1 + i) * 0.04 } }}
                        exit={{ opacity: 0, x: -16, transition: { duration: 0.2 } }}
                      >
                        <FontAwesomeIcon icon={link.icon} className="text-2xl" />
                      </motion.a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-5 md:pt-1">
            <StatBlock value={STAT_DUMMY.posts}     label="Posts"     />
            <div className="w-px h-8 bg-white/10 self-center" />
            <StatBlock value={STAT_DUMMY.followers} label="Followers" />
            <div className="w-px h-8 bg-white/10 self-center" />
            <StatBlock value={STAT_DUMMY.following} label="Following" />
          </div>
        </div>

        {/* Right — Collection card */}
        <button
          type="button"
          onClick={() => navigate(`/${profile.displayName}/${profile.identifierCode}/collection`)}
          className="relative overflow-hidden rounded-2xl border border-white/10 hover:border-white/25 w-full md:w-64 xsm:h-36 sm:h-40 md:h-44 flex-shrink-0 group transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#1c1f27] to-[#0d0f14]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />

          <div className="relative z-10 h-full flex flex-col justify-between p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50 font-medium uppercase tracking-widest">Collection</span>
              <FontAwesomeIcon
                icon={faArrowUpRightFromSquare}
                className="text-white/25 text-xs group-hover:text-white/60 transition-colors duration-300"
              />
            </div>
            <div className="text-left">
              <p className="text-xs text-white/40 uppercase tracking-widest">View Knives</p>
            </div>
          </div>
        </button>

      </div>

      {/* Posts grid */}
      <PublicProfilePostsComponent accountId={profile.id} />

    </section>
  );
};

export default ProfilePageDisplay;
