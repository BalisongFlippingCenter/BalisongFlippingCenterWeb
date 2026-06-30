import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faArrowRight,
  faPlay,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import TutorialCenterPageBackground from "../components/TutorialCenterPageBackground";

// ── Media placeholder ─────────────────────────────────────────────────────────

const VideoPlaceholder = () => (
  <div className="w-full aspect-video rounded-2xl border border-white/[0.12] bg-white/[0.05] flex items-center justify-center">
    <div className="w-12 h-12 rounded-full border border-white/15 bg-white/8 flex items-center justify-center">
      <FontAwesomeIcon icon={faPlay} className="text-white/30 text-base ml-0.5" />
    </div>
  </div>
);

const ImagePlaceholder = ({ label }: { label: string }) => (
  <div className="w-full aspect-[4/3] rounded-2xl border border-white/[0.08] bg-white/[0.03] flex flex-col items-center justify-center gap-3">
    <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
      <FontAwesomeIcon icon={faImage} className="text-white/25 text-base" />
    </div>
    <span className="text-white/20 text-xs font-medium">{label}</span>
  </div>
);

// ── Step pill ─────────────────────────────────────────────────────────────────

const Step = ({ n, title, body }: { n: string; title: string; body: string }) => (
  <div className="flex items-start gap-3">
    <span className="text-green font-bold text-xs mt-0.5 flex-shrink-0 w-5">{n}</span>
    <div>
      <p className="text-white/85 text-sm font-semibold mb-0.5">{title}</p>
      <p className="text-white/40 text-xs leading-relaxed">{body}</p>
    </div>
  </div>
);

// ── Callout ───────────────────────────────────────────────────────────────────

const Callout = ({ color, children }: { color: "green" | "gold" | "red"; children: React.ReactNode }) => {
  const s = {
    green: "border-green/25 bg-green/8",
    gold:  "border-gold/25 bg-gold/8",
    red:   "border-red/25 bg-red/8",
  };
  return (
    <div className={`rounded-xl border px-4 py-4 text-white/60 text-sm leading-relaxed ${s[color]}`}>
      {children}
    </div>
  );
};

// ── Section heading ───────────────────────────────────────────────────────────

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-white font-bold text-xl mb-1">{children}</h2>
);

const SectionSub = ({ children }: { children: React.ReactNode }) => (
  <p className="text-white/40 text-sm leading-relaxed mb-4">{children}</p>
);

// ── Page ──────────────────────────────────────────────────────────────────────

const TutorialCenterGettingStartedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen text-white relative">
      <TutorialCenterPageBackground />
      <div className="relative z-10 max-w-[1100px] mx-auto xsm:px-4 md:px-6 lg:px-10 xsm:pt-8 xsm:pb-28 md:pt-8 md:pb-24">

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate("/tutorial-center")}
          className="flex items-center gap-2 text-white/55 hover:text-white/85 text-sm mb-6 transition-colors duration-150"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
          Tutorial Center
        </button>

        {/* Hero */}
        <div className="mb-10">
          <span className="text-green text-xs font-semibold uppercase tracking-widest">Getting Started</span>
          <h1 className="text-white font-bold xsm:text-3xl md:text-4xl leading-tight mt-1 mb-2">
            Start Your Balisong Journey
          </h1>
          <p className="text-white/60 text-base leading-relaxed">
            The essentials before your first flip.
          </p>
        </div>

        <div
          className="flex flex-col gap-12 rounded-2xl border border-white/[0.07] p-6"
          style={{ background: "rgba(2,8,8,0.82)" }}
        >

          {/* ── Trainer first ── */}
          <div>
            <SectionTitle>Start with a Trainer</SectionTitle>
            <SectionSub>
              A trainer has a dull, unsharpened blade — it flips identically to a live knife but can't cut you. You will drop it. You will smack your fingers. Start here and move to a live blade once the motion is automatic.
            </SectionSub>
          </div>

          {/* ── Safe vs bite handle ── */}
          <div>
            <SectionTitle>Safe Handle vs Bite Handle</SectionTitle>
            <SectionSub>
              Every balisong has two handles. Mix them up and you'll cut yourself.
            </SectionSub>

            <ImagePlaceholder label="Safe handle vs bite handle diagram" />

            <div className="grid xsm:grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <Callout color="green">
                <span className="text-green font-semibold block mb-2">Safe handle</span>
                Sits on the spine (dull) side of the blade. This is the handle you hold when the knife is open.
              </Callout>
              <Callout color="red">
                <span className="text-red font-semibold block mb-2">Bite handle</span>
                Sits on the edge (sharp) side. Gripping this while open puts your fingers against the cutting edge.
              </Callout>
            </div>

            <div className="mt-4">
            <Callout color="gold">
              <span className="text-gold font-semibold">Tip: </span>
              The latch usually rests on the safe handle. When in doubt, open the knife slowly and check which side the blade edge faces before committing to a grip. Make this a habit every time you pick up a new knife.
            </Callout>
            </div>
          </div>

          {/* ── Y-grip ── */}
          <div>
            <SectionTitle>The Y-Grip</SectionTitle>
            <SectionSub>
              Your base grip for almost every trick. Pinch the safe handle between your thumb and index finger near the pivot. Let your other fingers rest loosely — don't death-grip it.
            </SectionSub>

            <ImagePlaceholder label="Y-grip photo" />
          </div>

          {/* ── Double rollout ── */}
          <div>
            <span className="text-white/35 text-xs font-semibold uppercase tracking-widest">Your First Trick</span>
            <h2 className="text-white font-bold text-xl mt-1 mb-1">
              <span className="text-green italic font-normal tracking-wide">Double Rollout</span>
            </h2>
            <SectionSub>
              The foundational trick — master this before anything else.
            </SectionSub>

            <VideoPlaceholder />

            <div className="flex items-center justify-between mt-4 mb-5 px-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-full border border-green/25 bg-green/10 text-green">Beginner</span>
                <span className="text-white/25 text-xs">~2 min</span>
              </div>
              <button
                type="button"
                onClick={() => navigate("/tutorial-center/beginner/double-rollout")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-green/25 bg-green/8 text-green text-xs font-semibold hover:bg-green/15 hover:border-green/40 transition-all duration-150"
              >
                Full Trick Guide
                <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
              </button>
            </div>

            <div className="h-px bg-white/[0.06] mb-5" />

            <div className="flex flex-col gap-3 divide-y divide-white/[0.05]">
              <Step n="01" title="Start closed, safe handle in hand" body="Y-grip on the safe handle, latch facing up." />
              <div className="pt-3"><Step n="02" title="Drop the bite handle outward" body="Let it swing away from your body as the blade opens. Keep your grip on the safe handle." /></div>
              <div className="pt-3"><Step n="03" title="Roll it over the back of your hand" body="Let the momentum carry it over. Don't force it — the weight does the work." /></div>
              <div className="pt-3"><Step n="04" title="Catch and close" body="Catch the bite handle as it comes around and reverse the motion to close. That full sequence is the double rollout." /></div>
            </div>

            <div className="mt-4">
              <Callout color="gold">
                <span className="text-gold font-semibold">Common mistake: </span>
                Gripping too tightly through the whole motion kills the momentum. Let the knife swing freely — your hand guides, not controls.
              </Callout>
            </div>

          </div>

          {/* ── Practice ── */}
          <div>
            <SectionTitle>Practice & Consistency</SectionTitle>
            <SectionSub>There are no shortcuts — only reps.</SectionSub>
            <div className="flex flex-col gap-2 text-sm text-white/50">
              <p>→ <span className="text-white/75 font-medium">Go slow first.</span> Speed comes automatically once the motion is memorized.</p>
              <p>→ <span className="text-white/75 font-medium">15 minutes daily</span> beats 3 hours once a week.</p>
              <p>→ <span className="text-white/75 font-medium">Don't move on</span> until the double rollout is automatic — 10 clean reps without thinking about the steps.</p>
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 flex flex-col gap-4">
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Ready for more?</h3>
              <p className="text-white/40 text-sm">Head to the Beginner page for more tricks organized by difficulty.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/tutorial-center/beginner")}
              className="self-start flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green/15 border border-green/30 text-green text-sm font-semibold hover:bg-green/25 hover:border-green/50 transition-all duration-200"
            >
              Go to Beginner Tricks
              <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TutorialCenterGettingStartedPage;
