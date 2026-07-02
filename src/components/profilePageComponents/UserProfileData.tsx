import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../redux/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser, faEnvelope, faGlobe, faLink, faArrowUpRightFromSquare, faPen } from "@fortawesome/free-solid-svg-icons";
import {
  faFacebookSquare,
  faInstagram,
  faTwitterSquare,
  faYoutubeSquare,
  faRedditSquare,
  faDiscord,
} from "@fortawesome/free-brands-svg-icons";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

const StatBlock = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-white font-bold text-2xl leading-none">
      {value.toLocaleString()}
    </span>
    <span className="text-white/35 text-[11px] uppercase tracking-widest">{label}</span>
  </div>
);

const UserProfileData = () => {
  const user = useAppSelector((state) => state.auth.user);
  const collectionData = useAppSelector((state) => state.collection.collection);
  const collectionKnives = useAppSelector((state) => state.collection.collectionKnives);
  const navigate = useNavigate();
  const [linksOpen, setLinksOpen] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [bioOverflows, setBioOverflows] = useState(false);
  const bioRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (bioRef.current) {
      setBioOverflows(bioRef.current.scrollHeight > bioRef.current.clientHeight);
    }
  }, [user?.profileCaption]);

  const socialLinks = [
    { href: user?.facebookLink  ?? '#', icon: faFacebookSquare, color: '#1877F2', route: '/configure/facebook_link',       isSet: !!user?.facebookLink },
    { href: user?.instagramLink ?? '#', icon: faInstagram,      color: '#E1306C', route: '/configure/instagram_link',      isSet: !!user?.instagramLink },
    { href: user?.twitterLink   ?? '#', icon: faTwitterSquare,  color: '#1DA1F2', route: '/configure/twitter_link',        isSet: !!user?.twitterLink },
    { href: user?.youtubeLink   ?? '#', icon: faYoutubeSquare,  color: '#FF0000', route: '/configure/youtube_link',        isSet: !!user?.youtubeLink },
    { href: user?.redditLink    ?? '#', icon: faRedditSquare,   color: '#FF4500', route: '/configure/reddit_link',         isSet: !!user?.redditLink },
    { href: user?.discordLink   ?? '#', icon: faDiscord,        color: '#5865F2', route: '/configure/discord_link',        isSet: !!user?.discordLink },
  ];

  const personalLinks = [
    { href: user?.personalEmailLink   ? `mailto:${user.personalEmailLink}` : '#', icon: faEnvelope, color: '#108198', route: '/configure/personal_email_link',   isSet: !!user?.personalEmailLink },
    { href: user?.personalWebsiteLink ?? '#',                                      icon: faGlobe,    color: '#108198', route: '/configure/personal_website_link',  isSet: !!user?.personalWebsiteLink },
  ];

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-6 xsm:pt-20 sm:pt-24 md:pt-6 lg:pt-8 pb-4 text-white gap-6">

      {/* Left — info section */}
      <div className="flex flex-col gap-3 md:gap-4 md:max-w-xs">

        {/* Display name + identifier tag */}
        <button
          type="button"
          onClick={() => navigate('/configure/display_name')}
          className="flex items-center gap-2 group w-fit"
        >
          <FontAwesomeIcon icon={faCircleUser} className="text-white/50 text-2xl flex-shrink-0" />
          <h2 className="text-xl font-bold text-white leading-none group-hover:text-white/70 transition-colors duration-200">
            {user?.displayName || user?.id}
          </h2>
          <span className="text-[11px] text-white/35 font-medium bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-full leading-none">
            #{user?.identifierCode}
          </span>
          <FontAwesomeIcon icon={faPen} className="text-white/0 group-hover:text-white/30 text-[10px] transition-colors duration-200" />
        </button>

        {/* Bio / profile caption */}
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => navigate('/configure/profile_caption')}
            className="text-sm text-white/55 leading-relaxed text-left group flex items-start gap-2 w-full"
          >
            <span
              ref={bioRef}
              className={`flex-1 whitespace-pre-wrap ${bioExpanded ? "" : "line-clamp-3"}`}
            >
              {user?.profileCaption && user.profileCaption !== ""
                ? user.profileCaption
                : <span className="text-white/20 italic">Add a bio...</span>
              }
            </span>
            <FontAwesomeIcon icon={faPen} className="text-white/0 group-hover:text-white/30 text-[10px] transition-colors duration-200 mt-1 flex-shrink-0" />
          </button>
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

        {/* Links row — expands on click */}
        <div className="flex items-center gap-3">

          {/* Trigger */}
          <button
            type="button"
            onClick={() => setLinksOpen((p) => !p)}
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-200 flex-shrink-0 ${
              linksOpen
                ? 'bg-blue-primary border-blue-primary text-white'
                : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
            }`}
          >
            <FontAwesomeIcon icon={faLink} className="text-sm" />
          </button>

          {/* Sliding icons */}
          <AnimatePresence>
            {linksOpen && (
              <motion.div className="flex items-center gap-3 leading-none">

                {socialLinks.map((link, i) => {
                  const total = socialLinks.length + 1 + personalLinks.length;
                  return (
                    <motion.button
                      key={i}
                      type="button"
                      onClick={() => navigate(link.route)}
                      className="transition-colors duration-200 flex items-center"
                      style={{ color: link.isSet ? link.color : undefined }}
                      onMouseEnter={e => (e.currentTarget.style.color = link.color)}
                      onMouseLeave={e => (e.currentTarget.style.color = link.isSet ? link.color : '')}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0, transition: { duration: 0.15, delay: i * 0.04 } }}
                      exit={{ opacity: 0, x: -16, transition: { duration: 0.25, delay: (total - 1 - i) * 0.05 } }}
                    >
                      <FontAwesomeIcon icon={link.icon} className={`block transition-all duration-200 ${link.isSet ? "text-2xl" : "text-xl opacity-30"}`} />
                    </motion.button>
                  );
                })}

                <motion.div
                  className="w-px h-5 bg-white/20 self-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.15, delay: socialLinks.length * 0.04 } }}
                  exit={{ opacity: 0, transition: { duration: 0.2, delay: (personalLinks.length) * 0.05 } }}
                />

                {personalLinks.map((link, i) => {
                  const total = socialLinks.length + 1 + personalLinks.length;
                  const pos = socialLinks.length + 1 + i;
                  return (
                    <motion.button
                      key={i}
                      type="button"
                      onClick={() => navigate(link.route)}
                      className="transition-colors duration-200 flex items-center"
                      style={{ color: link.isSet ? link.color : undefined }}
                      onMouseEnter={e => (e.currentTarget.style.color = link.color)}
                      onMouseLeave={e => (e.currentTarget.style.color = link.isSet ? link.color : '')}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0, transition: { duration: 0.15, delay: pos * 0.04 } }}
                      exit={{ opacity: 0, x: -16, transition: { duration: 0.25, delay: (total - 1 - pos) * 0.05 } }}
                    >
                      <FontAwesomeIcon icon={link.icon} className={`block transition-all duration-200 ${link.isSet ? "text-2xl" : "text-xl opacity-30"}`} />
                    </motion.button>
                  );
                })}

              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Stats row */}
        <div className="flex items-center gap-5 md:pt-1">
          <StatBlock value={user?.postCount      ?? 0} label="Posts"     />
          <div className="w-px h-8 bg-white/10 self-center" />
          <StatBlock value={user?.followerCount  ?? 0} label="Followers" />
          <div className="w-px h-8 bg-white/10 self-center" />
          <StatBlock value={user?.followingCount ?? 0} label="Following" />
        </div>

      </div>

      {/* Right — Collection card */}
      <button
        type="button"
        onClick={() => navigate(`/${user?.displayName}/${user?.identifierCode}/collection`)}
        className="relative overflow-hidden rounded-2xl border border-white/10 hover:border-white/25 w-full md:w-64 xsm:h-36 sm:h-40 md:h-44 flex-shrink-0 group transition-all duration-300"
      >
        {/* Background */}
        {collectionData?.bannerImg && collectionData.bannerImg !== "" ? (
          <img src={collectionData.bannerImg} className="absolute inset-0 w-full h-full object-cover object-center" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1c1f27] to-[#0d0f14]" />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Hover shimmer */}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-4">

          {/* Top — label + arrow */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50 font-medium uppercase tracking-widest">Collection</span>
            <FontAwesomeIcon
              icon={faArrowUpRightFromSquare}
              className="text-white/25 text-xs group-hover:text-white/60 transition-colors duration-300"
            />
          </div>

          {/* Bottom — knife count */}
          <div className="text-left">
            <p className="text-4xl font-bold text-white leading-none">{collectionKnives.length}</p>
            <p className="text-xs text-white/40 mt-1 uppercase tracking-widest">Knives</p>
          </div>

        </div>
      </button>

    </div>
  );
};

export default UserProfileData;
