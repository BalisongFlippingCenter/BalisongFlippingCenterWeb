import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe, faEarthAmericas, faTv, faEnvelope, faPaperPlane, faBookOpen, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";

const pillars = [
  {
    icon: faGlobe,
    title: "Community",
    description:
      "A social platform for balisong enthusiasts. Share posts, build your profile, showcase your collection, and connect with flippers from around the world.",
  },
  {
    icon: faEarthAmericas,
    title: "Product World",
    description:
      "A reference hub for knives and makers. Browse dedicated pages for balisong models and the makers behind them — specs, photos, history, and more.",
  },
  {
    icon: faTv,
    title: "Tutorial Center",
    description:
      "Your destination for tricks and learning. Search a growing trick library, follow structured skill paths, and explore community-submitted clips and tutorials.",
  },
];

const CONTACT_EMAIL = "support.balisongflippingcenter@gmail.com";
const DISCORD_URL = "https://discord.gg/k6JPnkbBC";
const MAX_LENGTH = 1000;

const AboutPage = () => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const charsLeft = MAX_LENGTH - message.length;

  const handleSend = () => {
    const encodedSubject = encodeURIComponent(subject.trim() || "Message from Balisong Flipping Center");
    const encodedBody = encodeURIComponent(message.trim());
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodedSubject}&body=${encodedBody}`;
  };

  return (
    <section className="w-full min-h-screen bg-[#080a0e] text-white flex justify-center px-4 pt-20 pb-28">
      <div className="w-full max-w-3xl flex flex-col gap-10">

        {/* About */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">About</p>
            <h1 className="font-black text-4xl sm:text-5xl leading-tight">
              <span className="text-blue-primary">Balisong</span> Flipping Center
            </h1>
            <p className="text-white/60 text-lg leading-relaxed max-w-2xl">
              The Balisong Flipping Center is a dedicated platform for the balisong community — a single place to connect, learn, and catalog everything related to the craft of balisong flipping.
            </p>
            <p className="text-white/50 text-base leading-relaxed max-w-2xl">
              Whether you're a seasoned flipper with a wall of knives or someone who just picked up their first trainer, this is your hub. Built by enthusiasts, for enthusiasts.
            </p>
          </div>

          {/* Pillars */}
          <div className="flex flex-col gap-4">
            <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">What's here</p>
            <div className="grid xsm:grid-cols-1 sm:grid-cols-3 gap-4">
              {pillars.map(({ icon, title, description }) => (
                <div
                  key={title}
                  className="bg-[#13161d] border border-white/10 rounded-2xl p-5 flex flex-col gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-primary/10 border border-blue-primary/20 flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={icon} className="text-blue-primary text-sm" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm mb-1">{title}</p>
                    <p className="text-white/50 text-xs leading-relaxed">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Learn Section CTA */}
        <button
          type="button"
          onClick={() => navigate("/learn")}
          className="group w-full flex items-center gap-5 bg-[#13161d] hover:bg-[#1a1e28] border border-white/10 hover:border-blue-primary/30 rounded-2xl px-6 py-5 text-left transition-all duration-200"
        >
          <div className="w-11 h-11 rounded-xl bg-blue-primary/10 border border-blue-primary/20 flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={faBookOpen} className="text-blue-primary text-base" />
          </div>
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <p className="text-white font-bold text-base group-hover:text-blue-primary transition-colors duration-200">
              New to balisongs?
            </p>
            <p className="text-white/45 text-sm leading-relaxed">
              Visit our knowledge base — from what a balisong is to how to choose your first knife, it's all covered.
            </p>
          </div>
          <FontAwesomeIcon icon={faChevronRight} className="text-white/20 text-sm flex-shrink-0 group-hover:text-blue-primary transition-colors duration-200" />
        </button>

        {/* Divider */}
        <div className="h-px bg-white/[0.06]" />

        {/* Contact */}
        <div className="bg-[#0f1117] border border-white/[0.12] rounded-2xl px-5 sm:px-8 py-8 flex flex-col gap-7 shadow-xl">
          <div className="flex flex-col gap-2">
            <p className="text-xs text-blue-primary uppercase tracking-widest font-semibold">Contact</p>
            <h2 className="font-bold text-3xl">Get in touch</h2>
          </div>

          {/* Discord — full width */}
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 px-5 py-5 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/35 hover:bg-[#5865F2]/20 hover:border-[#5865F2]/55 transition-all duration-200 group"
          >
            <FontAwesomeIcon icon={faDiscord} className="text-[#5865F2] text-3xl flex-shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-white text-base font-bold">Join our Discord</span>
              <span className="text-white/45 text-xs">Connect with the community</span>
            </div>
          </a>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-xs text-white/30 font-semibold uppercase tracking-widest">or send an email</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          <p className="text-white/50 text-sm leading-relaxed">
            Have a question, suggestion, or just want to say hello? We'd love to hear from you. Reach out directly and we'll get back to you as soon as we can.
          </p>

          {/* Email composer */}
          <div className="flex flex-col gap-0 border border-white/[0.12] rounded-xl overflow-hidden shadow-md">
            {/* To row */}
            <div className="flex items-center gap-4 px-4 py-3.5 bg-[#080a0e] border-b border-white/[0.08] min-w-0">
              <span className="text-xs text-white/30 font-bold uppercase tracking-wider flex-shrink-0 w-14">To</span>
              <div className="flex items-center gap-2 min-w-0">
                <FontAwesomeIcon icon={faEnvelope} className="text-blue-primary text-xs flex-shrink-0" />
                <span className="text-white/60 text-sm truncate">{CONTACT_EMAIL}</span>
              </div>
            </div>

            {/* Subject row */}
            <div className="flex items-center gap-4 px-4 py-3.5 bg-[#080a0e] border-b border-white/[0.08] focus-within:border-blue-primary/40 transition-colors duration-200">
              <span className="text-xs text-white/30 font-bold uppercase tracking-wider flex-shrink-0 w-14">Subject</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What's this about?"
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/25"
              />
            </div>

            {/* Message textarea */}
            <div className="relative bg-[#080a0e] focus-within:ring-1 focus-within:ring-blue-primary/20 transition-all duration-200">
              <textarea
                value={message}
                onChange={(e) => { if (e.target.value.length <= MAX_LENGTH) setMessage(e.target.value); }}
                placeholder="Write your message here..."
                rows={6}
                className="w-full bg-[#080a0e] px-4 py-4 text-white text-sm outline-none resize-none placeholder:text-white/25"
              />
              {message.length > 0 && (
                <span className={`absolute bottom-2 right-3 text-xs font-medium ${charsLeft < 100 ? "text-gold" : "text-white/20"}`}>
                  {charsLeft}
                </span>
              )}
            </div>

            {/* Send button row */}
            <div className="px-4 py-3.5 bg-[#080a0e] border-t border-white/[0.08] flex justify-end">
              <button
                type="button"
                onClick={handleSend}
                disabled={!message.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-primary text-white text-sm font-semibold rounded-lg hover:bg-blue-primary/80 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
                Send Message
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default AboutPage;
