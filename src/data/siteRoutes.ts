import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faGlobe,
  faEarthAmericas,
  faBookOpen,
  faCircleInfo,
  faFileLines,
  faShield,
  faGraduationCap,
  faPlay,
  faWrench,
  faLayerGroup,
  faScissors,
  faLock,
} from "@fortawesome/free-solid-svg-icons";

export interface SiteRoute {
  title: string;
  subtitle: string;
  path: string;
  icon: IconDefinition;
  keywords: string[];
}

export const SITE_ROUTES: SiteRoute[] = [

  // ── Main sections ─────────────────────────────────────────────────────────────

  {
    title: "Community",
    subtitle: "Posts, flips & the social feed",
    path: "/community",
    icon: faGlobe,
    keywords: ["community", "feed", "posts", "social", "flips", "clips", "upload", "home feed"],
  },
  {
    title: "Tutorial Center",
    subtitle: "Tricks, combos & tutorials",
    path: "/tutorial-center",
    icon: faPlay,
    keywords: ["tutorial center", "tutorials", "tricks", "combos", "learn tricks", "tutorial", "trick videos"],
  },
  {
    title: "Product World",
    subtitle: "Knives, makers & gear",
    path: "/product-world",
    icon: faEarthAmericas,
    keywords: ["product world", "products", "knives", "makers", "gear", "buy", "shop", "knife info", "knife database"],
  },
  {
    title: "Learn",
    subtitle: "Guides & hardware explained",
    path: "/learn",
    icon: faBookOpen,
    keywords: ["learn", "guide", "guides", "hardware", "education", "info", "about balisong", "knowledge base"],
  },

  // ── Tutorial Center levels ────────────────────────────────────────────────────

  {
    title: "Getting Started",
    subtitle: "Your first steps in balisong flipping",
    path: "/tutorial-center/getting-started",
    icon: faGraduationCap,
    keywords: ["getting started", "first flip", "start", "intro", "beginning", "new", "first steps", "new to flipping"],
  },
  {
    title: "Beginner Tricks",
    subtitle: "Easy flips to build your foundation",
    path: "/tutorial-center/beginner",
    icon: faGraduationCap,
    keywords: ["beginner", "beginner tricks", "easy", "basic", "simple", "starter", "easy tricks", "intro tricks", "easy flips"],
  },
  {
    title: "Intermediate Tricks",
    subtitle: "Step up your flipping game",
    path: "/tutorial-center/intermediate",
    icon: faGraduationCap,
    keywords: ["intermediate", "medium", "mid level", "intermediate tricks", "moderate", "step up", "mid tricks"],
  },
  {
    title: "Advanced Tricks",
    subtitle: "High-level combos and techniques",
    path: "/tutorial-center/advanced",
    icon: faGraduationCap,
    keywords: ["advanced", "hard", "expert", "advanced tricks", "pro", "difficult", "high level", "expert tricks"],
  },

  // ── Learn topics ──────────────────────────────────────────────────────────────

  {
    title: "What is a Balisong?",
    subtitle: "Origins, design, and why people flip them",
    path: "/learn/what-is-a-balisong",
    icon: faBookOpen,
    keywords: [
      "what is a balisong", "balisong", "butterfly knife", "butterfly", "intro", "introduction",
      "origin", "history", "what is", "what is butterfly knife",
    ],
  },
  {
    title: "Balisong Legality",
    subtitle: "Is it legal where you are?",
    path: "/learn/balisong-legality",
    icon: faLock,
    keywords: [
      "legal", "legality", "laws", "illegal", "restricted", "state laws", "country",
      "legal status", "can i own", "is it legal", "knife laws", "balisong law",
    ],
  },
  {
    title: "Choosing Your First Balisong",
    subtitle: "How to pick the right starter knife",
    path: "/learn/how-to-choose-your-first-balisong",
    icon: faBookOpen,
    keywords: [
      "first balisong", "buying guide", "beginner knife", "choose", "starter",
      "first knife", "buy", "pick", "recommend", "recommendation", "best beginner knife",
    ],
  },
  {
    title: "Construction of a Balisong",
    subtitle: "Parts, anatomy and how it's built",
    path: "/learn/construction-of-a-balisong",
    icon: faWrench,
    keywords: [
      "construction", "parts", "anatomy", "how its made", "blade", "handle", "pivot",
      "tang", "build", "components", "structure", "anatomy of a balisong",
    ],
  },
  {
    title: "Bushings vs Washers vs Bearings",
    subtitle: "Pivot system comparison and what to look for",
    path: "/learn/bushings-vs-washers-vs-bearings",
    icon: faWrench,
    keywords: [
      "bushing", "bushings", "washer", "washers", "bearing", "bearings", "pivot",
      "pivot system", "hardware", "rotation", "bushings vs washers", "bearings vs bushings",
    ],
  },
  {
    title: "Tang Pins vs Zen Pins vs Pinless",
    subtitle: "How pins affect your flip feel",
    path: "/learn/tang-pins-vs-zen-pins-vs-pinless",
    icon: faWrench,
    keywords: [
      "tang pin", "tang pins", "zen pin", "zen pins", "pinless", "pins",
      "blade tang", "pin system", "hardware", "tang", "pin types",
    ],
  },
  {
    title: "Handle Types",
    subtitle: "Channel, sandwich, skeletonized and more",
    path: "/learn/handle-types",
    icon: faLayerGroup,
    keywords: [
      "handle", "handles", "channel handle", "sandwich handle", "skeletonized",
      "handle types", "channel", "sandwich", "g10", "titanium handle", "handle construction",
    ],
  },
  {
    title: "Latch Types",
    subtitle: "Manila, Batangas, spring latch and no latch",
    path: "/learn/latch-types",
    icon: faScissors,
    keywords: [
      "latch", "latches", "manila", "batangas", "spring latch", "no latch",
      "latch types", "latch system", "latch comparison",
    ],
  },

  // ── Other pages ───────────────────────────────────────────────────────────────

  {
    title: "About / Contact",
    subtitle: "What is this place and how to reach us",
    path: "/about",
    icon: faCircleInfo,
    keywords: ["about", "contact", "who are you", "who we are", "email", "reach out", "team", "about us"],
  },
  {
    title: "Terms of Service",
    subtitle: "Rules and user agreements",
    path: "/terms",
    icon: faFileLines,
    keywords: ["terms", "terms of service", "tos", "rules", "agreement", "policy", "legal documents"],
  },
  {
    title: "Privacy Policy",
    subtitle: "How we handle your data",
    path: "/privacy",
    icon: faShield,
    keywords: ["privacy", "privacy policy", "data", "gdpr", "cookies", "personal data", "data collection"],
  },
];

// ── Match helper ──────────────────────────────────────────────────────────────

export function matchRoute(route: SiteRoute, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return false;
  const haystack = [route.title, route.subtitle, ...route.keywords].join(" ").toLowerCase();
  if (haystack.includes(q)) return true;
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.length > 1 && tokens.every((t) => haystack.includes(t));
}
