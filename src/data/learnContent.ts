export interface StatusListItem {
  name: string;
  status: "legal" | "restricted" | "illegal";
  note: string;
}

export interface KnifeRecommendation {
  make: string;
  model: string;
  msrp: string;
  material: string;
  description: string;
  url: string;
}

export interface TieredListItem {
  range: string;
  description: string;
  knives: KnifeRecommendation[];
}

export interface LearnSection {
  heading?: string;
  type: "paragraph" | "list" | "status-list" | "callout" | "tiered-list";
  body: string | string[] | StatusListItem[] | TieredListItem[];
  media?: LearnMedia;
  variant?: "warning" | "info";
  links?: { label: string; href: string }[];
}

export interface LearnMedia {
  type: "video" | "image";
  src: string;
  caption?: string;
}

export interface LearnTopic {
  slug: string;
  title: string;
  subtitle: string;
  media?: LearnMedia;
  showCommunityFeed?: boolean;
  ctaVariant?: "community" | "product-world";
  sections: LearnSection[];
}

export const LEARN_TOPICS: LearnTopic[] = [
  {
    slug: "what-is-a-balisong",
    title: "What is a Balisong?",
    subtitle: "An introduction to the butterfly knife — its origins, design, and why people flip them.",
    media: {
      type: "video",
      src: "", // drop video URL or import path here when available
    },
    showCommunityFeed: true,
    sections: [
      {
        type: "paragraph",
        body: "A balisong, commonly known as a butterfly knife, is a folding knife with two handles that counter-rotate around the tang of the blade. When closed, the blade is concealed within the handles. When opened, the two handles fan outward, revealing the blade — and in the hands of a skilled flipper, this opening motion becomes an art form.",
      },
      {
        heading: "Origins",
        type: "paragraph",
        body: "The balisong originates from the Philippines, where it has been a part of the culture for centuries. The name comes from Tagalog — 'bali' meaning broken and 'sung' meaning horn, a reference to the early handles carved from animal horn. The Batangas region of the Philippines is historically the center of balisong production, and the knife remains a symbol of Filipino craftsmanship.",
      },
      {
        heading: "Trainers vs Live Blades",
        type: "paragraph",
        body: "Balisongs come in two main forms: trainers and live blades. A trainer has a dull, unsharpened blade — ideal for learning tricks safely. A live blade is a sharpened, functional knife. Most people in the hobby recommend starting with a trainer before moving to a live blade.",
        media: {
          type: "image",
          src: "", // drop trainer vs live blade comparison image URL here
          caption: "Left: trainer balisong (dull blade). Right: live blade balisong (sharpened).",
        },
      },
      {
        heading: "The Hobby",
        type: "paragraph",
        body: "In modern times, balisong flipping has grown into a dedicated global hobby. Flippers develop skill in manipulating the knife through tricks and combos — opening and closing the knife in fluid, creative sequences. The community spans beginners learning their first rollover to seasoned flippers developing original trick combinations and competing on a world stage.",
      },
      {
        heading: "Why People Flip",
        type: "list",
        body: [
          "The tactile satisfaction of a well-tuned, smooth-flipping knife",
          "The challenge of learning new tricks and building muscle memory",
          "A creative outlet — combos are a form of personal expression",
          "A growing community of people who share the same passion",
          "The collector aspect — there are countless unique knives to seek out",
        ],
      },
    ],
  },
  {
    slug: "balisong-legality",
    title: "Balisong Legality",
    subtitle: "Laws around balisongs vary widely by location. Know your local laws before you buy or carry.",
    ctaVariant: "product-world",
    sections: [
      {
        type: "callout",
        variant: "info",
        body: "Laws around balisongs change frequently and vary significantly by country, state, and city. The information below is a general reference only — always verify current regulations in your specific location before purchasing or carrying a balisong.",
      },
      {
        type: "paragraph",
        body: "Balisong legality is one of the most important things to understand before buying or carrying one. Laws vary significantly by country, state, and even city — and the consequences of getting it wrong can be serious.",
      },
      {
        heading: "United States",
        type: "list",
        body: [
          "Most states treat balisongs as standard folding knives with no additional restrictions",
          "California — Illegal to carry concealed with a blade over 2 inches",
          "Hawaii — Illegal to own or carry",
          "New York City — Heavily restricted; treated similarly to a prohibited weapon",
          "Always check both your state law and local municipal ordinances — city laws sometimes differ from state law",
        ],
      },
      {
        heading: "Outside the United States",
        type: "status-list",
        body: [
          { name: "Philippines", status: "legal", note: "Country of origin — legal to own and carry" },
          { name: "Canada", status: "restricted", note: "Legal to own but illegal to carry concealed in many provinces" },
          { name: "Australia", status: "restricted", note: "Varies by state; generally restricted or prohibited" },
          { name: "United Kingdom", status: "illegal", note: "Classified as a prohibited weapon; illegal to carry in public" },
          { name: "Germany", status: "illegal", note: "Generally prohibited under weapon laws" },
          { name: "Most of the EU", status: "illegal", note: "Heavily restricted or outright banned in most member states" },
        ],
      },
      {
        heading: "Trainers and the Law",
        type: "paragraph",
        body: "Trainer balisongs have dull, unsharpened blades and are generally viewed more favorably under the law — but they are not universally legal everywhere. Some laws target the design of the handle mechanism itself, regardless of whether the blade is sharp. Do not assume a trainer is legal just because it cannot cut.",
      },
      {
        heading: "Our Platform and Legality",
        type: "callout",
        variant: "warning",
        body: "Balisong Flipping Center is a community platform. Users are solely responsible for ensuring their activity complies with the laws in their jurisdiction. Any buy/sell or trade activity occurs off-platform — we are not a party to any transaction and assume no responsibility for what is bought, sold, or carried.",
        links: [
          { label: "Terms of Service", href: "/terms" },
          { label: "Privacy Policy", href: "/privacy" },
        ],
      },
    ],
  },
  {
    slug: "how-to-choose-your-first-balisong",
    title: "How to Choose Your First Balisong",
    subtitle: "A practical guide to picking the right first knife without overspending or making a mistake you'll regret.",
    showCommunityFeed: true,
    ctaVariant: "product-world",
    sections: [
      {
        type: "paragraph",
        body: "Choosing your first balisong can be overwhelming — there are hundreds of options at every price point. This guide cuts through the noise and gives you a practical framework for making a good first choice.",
      },
      {
        heading: "Start With a Trainer",
        type: "paragraph",
        body: "If you are new to flipping, start with a trainer. A trainer balisong has a dull, unsharpened blade and allows you to learn tricks without the risk of cutting yourself. The learning curve for balisong flipping involves a lot of fumbled catches — doing that with a live blade is a fast way to end up injured. Most trainers flip identically to their live blade counterparts.",
      },
      {
        heading: "What to Look For",
        type: "list",
        body: [
          "Handle-biased over blade-biased — more handle weight makes beginner rollover tricks significantly easier to learn",
          "Read community reviews — Reddit and YouTube have honest feedback on most popular knives before you buy",
          "Zen pins or tang pins — either works at the beginner level, don't overthink it",
          "Stick to known brands — Squid Industries, LDY, and Nablis are reliable starting points that won't break the bank",
          "Check parts availability — can you get replacement pivots or tune it if needed?",
        ],
      },
      {
        heading: "Things to Avoid",
        type: "list",
        body: [
          "Generic Amazon knockoffs under $20 — Poor tolerances, dangerous blade play, will break quickly",
          "Spending $300+ on your first knife — You will drop it, scratch it, and possibly not stick with the hobby",
          "Buying a live blade before you can safely catch a trainer",
          "Ignoring the laws in your area",
        ],
      },
      {
        type: "callout",
        variant: "info",
        body: "Availability and pricing change over time. If a link is broken or a knife is out of stock, search by make and model to find current listings.",
      },
      {
        heading: "Budget",
        type: "tiered-list",
        body: [
          {
            range: "$50+",
            description: "Entry-level trainers. Good enough to learn the fundamentals without a large upfront investment.",
            knives: [
              { make: "Nabalis", model: "Cheese", msrp: "~$55", material: "7075 Aluminum", description: "Lightweight and beginner-friendly with a good out-of-box tune.", url: "https://nabalis.com/products/cheese-the-first-cute-harmless-and-public-friendly-metal-trainer" },
              { make: "Nabalis", model: "Canyon", msrp: "~$45", material: "420 Stainless Steel", description: "Heavier steel build with excellent tolerances for the price.", url: "https://nabalis.com/products/nabalis-canyon-ss-balisong-butterfly-knife-trainer" },
              { make: "LDY", model: "Orion V2", msrp: "~$85", material: "7075 Aluminum", description: "Feels like a $200+ knife — smooth, neutral balance, exceptional value.", url: "https://ldybalisong.net/products/orion-v2-trainer" },
              { make: "Squid Industries", model: "Squiddy WH", msrp: "~$80", material: "Acetal (polymer)", description: "Quiet polymer trainer, ideal for public flipping or noise-sensitive environments.", url: "https://www.squidindustries.co/products/squiddy-wh" },
              { make: "Squid Industries", model: "Squiddy AL", msrp: "~$85", material: "6061 Aluminum", description: "Metal Squiddy with adjustable eye weights for tuning the balance profile.", url: "https://www.squidindustries.co/products/squiddy-al" },
            ],
          },
          {
            range: "$100+",
            description: "Mid-range. Noticeably better build quality and a more satisfying flip. The sweet spot for most beginners.",
            knives: [
              { make: "Nabalis", model: "Vulp Pro", msrp: "~$140", material: "7075 Aluminum + G10", description: "Responsive and well-tuned out of the box, with G10 inlays for improved grip during rollovers. Will Hirsch collab.", url: "https://nabalis.com/products/nabalis-vulp-pro-butterrfly-knife-trainer" },
              { make: "Squid Industries", model: "Mako V5", msrp: "~$130", material: "6061 Aluminum", description: "Compact shark-inspired design with jimping, bronze washers, and solid tolerances. Doubles as a bottle opener.", url: "https://www.squidindustries.co/collections/mako-v5" },
              { make: "Squid Industries", model: "Squidtrainer V4", msrp: "~$175", material: "6061 Aluminum", description: "The classic Squid trainer refined over years of community feedback — stainless bushing pivots, great balance, proven track record.", url: "https://www.squidindustries.co/products/squidtrainer-v4-best-balisong-butterfly-knife-trainer-flipping-tool" },
              { make: "BBBarfly", model: "Barracuda V2", msrp: "$129", material: "6061 Aluminum", description: "Hand-tuned bushings, zen pins, phosphor bronze washers, and ships with spare hardware and a stand. Strong value at the price.", url: "https://bbbarfly.com/collections/barracuda" },
            ],
          },
          {
            range: "$200+",
            description: "Higher-end production knives with premium pivot systems and tighter tolerances. Worth considering once you know you're committed to the hobby.",
            knives: [
              { make: "Squid Industries", model: "Krake Raken V3", msrp: "~$220", material: "7075 Aluminum", description: "Trainer sibling of the live-blade Krake Raken — zen pins, cryogenically treated blade, great balance and a well-earned reputation.", url: "https://www.squidindustries.co/products/krake-raken-trainer-v3" },
              { make: "Squid Industries", model: "Nautilus V2", msrp: "~$235", material: "7075 Aluminum + G10", description: "Channel-liner hybrid with G10 overlays for grip. Bushing pivot, nearly zero handle play, and a distinctive look.", url: "https://www.squidindustries.co/products/nautilus-v2" },
              { make: "BBBarfly", model: "Superfly", msrp: "$239", material: "Grade 5 Titanium", description: "Solid titanium flagship with hand-tuned bushings and an adjustable weight system. Top of the range.", url: "https://bbbarfly.com/collections/bbsuperfly-products" },
            ],
          },
        ],
      },
      {
        heading: "Where to Buy",
        type: "paragraph",
        body: "Reputable retailers include Squid Industries, BladeHQ, and KnifeCenter. Always buy from established sellers with return policies when possible.",
        links: [
          { label: "Squid Industries", href: "https://www.squidindustries.co/" },
          { label: "BladeHQ", href: "https://www.bladehq.com/" },
          { label: "KnifeCenter", href: "https://www.knifecenter.com/" },
        ],
      },
      {
        heading: "Final Advice",
        type: "paragraph",
        body: "The best first balisong is one that is safe to learn on, well-built enough to not frustrate you with poor tolerances, and inexpensive enough that you're not stressed about dropping it. Once you've spent a few months with it and know you love the hobby, you'll have a much better sense of what you want in your next knife.",
      },
    ],
  },
  {
    slug: "construction-of-a-balisong",
    title: "The Construction of a Balisong",
    subtitle: "Understanding the anatomy of a butterfly knife — the parts, how they fit together, and why it matters.",
    sections: [
      {
        type: "paragraph",
        body: "Every balisong is made up of a core set of components. Understanding how these parts work together helps you make better purchasing decisions, maintain your knife, and talk about it intelligently in the community.",
      },
      {
        heading: "The Blade",
        type: "paragraph",
        body: "The blade is the central element. The tang is the portion of the blade that extends beyond the cutting edge and sits within the handle assembly — it is what the handles pivot around. The choil is the unsharpened section just above the handle, and many balisongs have a swedge (a false top edge) for aesthetic and balance purposes.",
      },
      {
        heading: "The Handles",
        type: "paragraph",
        body: "A balisong has two handles — the safe handle and the bite handle. The safe handle is the one facing away from the blade edge when the knife is closed. The bite handle faces toward the edge. Knowing which is which matters for tricks, as most moves require specific handle awareness to avoid contact with the edge.",
      },
      {
        heading: "Handle Construction Types",
        type: "list",
        body: [
          "Channel handles — A single piece of metal with a channel milled out to hold the blade. Strong, heavier, and very rigid. Common in higher-end knives.",
          "Sandwich/liner handles — An outer scale (the visible face) backed by a metal liner, with the blade sitting between the two liners. Allows for material variety and lighter builds.",
        ],
      },
      {
        heading: "Pivots",
        type: "paragraph",
        body: "The pivots are the points around which the handles rotate. They are typically screws or pins that pass through the tang and handles. Pivot type has a major impact on the feel of the knife — this is where bushings, washers, and bearings come in (covered in the next topic).",
      },
      {
        heading: "The Latch",
        type: "paragraph",
        body: "The latch keeps the knife in the closed position. It is typically attached to one handle and catches on the other when the knife is folded shut. Latch style is a major point of personal preference in the flipping community — many experienced flippers prefer latchless designs.",
      },
      {
        heading: "Pins",
        type: "paragraph",
        body: "Pins are stops that limit how far the handles can open and close. They prevent the handles from over-rotating and protect the blade from hitting the handles. Pin style — tang pins, zen pins, or pinless — significantly affects how the knife feels during flipping.",
      },
    ],
  },
  {
    slug: "bushings-vs-washers-vs-bearings",
    title: "Bushings vs Washers vs Bearings",
    subtitle: "The three main pivot systems used in balisongs, and how each one affects the feel of the flip.",
    sections: [
      {
        type: "paragraph",
        body: "The pivot system is one of the most talked-about aspects of a balisong. It determines how smooth, clicky, or loose the flip feels, and it affects long-term durability and maintenance requirements. There are three main pivot types: bushings, washers, and bearings.",
      },
      {
        heading: "Bushings",
        type: "paragraph",
        body: "Bushings are small cylindrical sleeves that sit around the pivot pin between the handle and the tang. They provide a smooth, controlled rotation. Bushing-based knives tend to have a heavier, more deliberate feel — each flip has a satisfying weight to it. Bushings are durable, require minimal maintenance, and are the traditional standard in balisong construction. Most high-end Filipino-made balisongs use bushing pivots.",
      },
      {
        heading: "Washers",
        type: "paragraph",
        body: "Washers are flat rings that sit between the handle and tang surfaces at the pivot. Common washer materials include phosphor bronze and Teflon. Phosphor bronze washers are self-lubricating and provide a smooth, slightly different feel than bushings. Teflon washers are softer, create very little friction, and produce a quieter, smoother action. Washer-based knives are often lighter and more budget-friendly than bushing or bearing knives.",
      },
      {
        heading: "Bearings (IKBS)",
        type: "paragraph",
        body: "Ball bearings — often referred to as IKBS (Independent Knife Bearing System) — use tiny ball bearings in a race around the pivot. They produce an extremely smooth, free-spinning action with a distinctive clicky sound. Bearing knives tend to feel lighter and faster in the hand. The tradeoff is that bearings require more maintenance — they can get dirty and need to be cleaned periodically. Bearing-based balisongs have become very popular in the modern flipping community.",
      },
      {
        heading: "Which is Best?",
        type: "list",
        body: [
          "Beginners — Washers are a great starting point. Low maintenance, smooth feel, usually found in more affordable knives.",
          "Flippers who want a classic feel — Bushings. Heavier, more deliberate, extremely durable.",
          "Flippers who want speed and smoothness — Bearings. Fast, clicky, satisfying — but clean them regularly.",
          "There is no objectively best option — it comes down to personal preference.",
        ],
      },
    ],
  },
  {
    slug: "tang-pins-vs-zen-pins-vs-pinless",
    title: "Tang Pins vs Zen Pins vs Pinless",
    subtitle: "How the pin system affects the feel, sound, and blade safety of a balisong.",
    sections: [
      {
        type: "paragraph",
        body: "Pins are the stops inside a balisong that limit the rotation of the handles. They determine how the knife feels when it opens and closes, what sound it makes on impact, and whether the blade is protected from contact with the handles during flipping.",
      },
      {
        heading: "Tang Pins",
        type: "paragraph",
        body: "Tang pins are pins embedded in the tang of the blade. The handles rest against these pins when the knife is fully open or closed. Tang pins are the traditional design and are found in many classic and Filipino-made balisongs. The downside is that over time and with heavy use, the handles can wear grooves into the tang where they contact the pins — though this is primarily a concern with softer metals.",
      },
      {
        heading: "Zen Pins",
        type: "paragraph",
        body: "Zen pins — pioneered by Squid Industries — move the pins from the tang to the inside of the handles. Instead of the handles resting against the blade's tang, the tang rests against pins inside the handles. This keeps the blade entirely free from contact with the handles during the open/close cycle, eliminating any wear on the blade and allowing for a cleaner, more refined flip. Zen pins have become extremely popular and are now used across many modern balisong designs.",
      },
      {
        heading: "Pinless",
        type: "paragraph",
        body: "Pinless designs eliminate pins entirely. The stopping action is achieved through precise tolerances, machined stops, or geometry built into the blade and handle. Pinless balisongs can have a very clean, minimal aesthetic and a unique feel — but they are more difficult to engineer correctly and are typically found in higher-end, precision-machined knives.",
      },
      {
        heading: "Which Should You Look For?",
        type: "list",
        body: [
          "Tang pins — Traditional, reliable, widely available. Common in Filipino-made and budget knives.",
          "Zen pins — Excellent choice for modern flippers. Blade-safe, clean feel, now very common.",
          "Pinless — For those seeking a premium, minimal experience. Usually found in high-end machined knives.",
        ],
      },
    ],
  },
  {
    slug: "handle-types",
    title: "Handle Types",
    subtitle: "The materials and construction methods used in balisong handles, and how they affect weight, feel, and durability.",
    sections: [
      {
        type: "paragraph",
        body: "The handles are what you hold, what you see, and what you flip — they define much of the character of a balisong. Handle design covers both the construction method (how the handle is built) and the material (what it is made from).",
      },
      {
        heading: "Channel Handles",
        type: "paragraph",
        body: "Channel handles are machined from a single piece of material with a channel milled through the center to accommodate the blade. They are stiffer and heavier than sandwich handles, and they tend to have a more solid, premium feel. Channel construction is common in high-end balisongs and is particularly popular in titanium knives. The added rigidity reduces any flex or rattle.",
      },
      {
        heading: "Sandwich (Liner) Handles",
        type: "paragraph",
        body: "Sandwich handles consist of two outer scales attached to inner metal liners. The liners provide structural support while the scales provide the visible outer surface. This construction allows for more material variety and lighter overall weight. Scales can be swapped for customization, which makes sandwich-construction knives appealing to collectors.",
      },
      {
        heading: "Common Handle Materials",
        type: "list",
        body: [
          "Titanium — The gold standard for premium balisongs. Lightweight, extremely strong, develops a natural patina over time, and can be anodized in a wide range of colors.",
          "Aluminum — Lightweight and affordable. Anodizes well for color options. Softer than titanium and more prone to scratching.",
          "Stainless Steel — Heavy and durable. Less common in modern designs but found in some Filipino-made knives.",
          "G10 — A fiberglass composite used as scale material. Lightweight, grippy, and available in many colors. Common in budget and mid-range knives.",
          "Carbon Fiber — Very lightweight and stiff with a distinct aesthetic. Premium material, often used in higher-end sandwich handles.",
          "Micarta — A composite of fabric or paper in resin. Warm feel, excellent grip when wet, develops character with use.",
        ],
      },
      {
        heading: "Handle Weight and Balance",
        type: "paragraph",
        body: "Handle weight directly affects how a balisong flips. Heavier handles create more momentum and a more deliberate flip. Lighter handles allow for faster manipulation. The distribution of weight between the two handles also affects balance — a well-balanced knife feels neutral in the hand, while a handle-heavy or blade-heavy knife requires adjustment in technique.",
      },
    ],
  },
  {
    slug: "latch-types",
    title: "Latch Types",
    subtitle: "The different latch designs used in balisongs and why many experienced flippers go latchless.",
    sections: [
      {
        type: "paragraph",
        body: "The latch is the mechanism that keeps a balisong closed when not in use. It is attached to one handle and catches on the other. Latch preference is highly personal — some flippers love the sound and feel of a latch, while others remove them entirely.",
      },
      {
        heading: "Manila Folder Latch",
        type: "paragraph",
        body: "The Manila folder latch is the traditional latch style originating from Filipino balisong design. It is a simple spring-loaded latch that clips onto the other handle when the knife is closed. It produces the classic 'click' sound associated with balisongs. Manila folder latches sit on the outside of the safe handle.",
      },
      {
        heading: "Batangas Latch",
        type: "paragraph",
        body: "The Batangas latch is another traditional Filipino latch style. It sits on the bite handle rather than the safe handle, and it functions in the opposite direction from the Manila folder latch. The Batangas style is less common in modern production knives but is historically significant.",
      },
      {
        heading: "Spring Latch",
        type: "paragraph",
        body: "Many modern production balisongs use a refined spring latch — a small, tensioned arm that snaps onto the opposing handle. These are typically more refined and consistent than traditional latches, with better tolerances and less rattle.",
      },
      {
        heading: "Latchless",
        type: "paragraph",
        body: "A latchless balisong has no latch mechanism at all. The knife stays closed through handle tension alone. Latchless is the overwhelming preference among experienced flippers because it eliminates the latch from entering the flip path — the latch is a common source of disrupted tricks and finger catches. Many knives ship with a latch that can be removed, and there is an entire market for latch removal kits.",
      },
      {
        heading: "Magnetic Latch",
        type: "paragraph",
        body: "Some modern balisongs use magnets embedded in the handles to hold the knife closed rather than a physical latch arm. Magnetic latches offer a clean aesthetic and a satisfying snap when the knife closes, without the latch arm getting in the way during flipping.",
      },
      {
        heading: "Which Latch is Right for You?",
        type: "list",
        body: [
          "Beginners learning basics — A standard latch is fine to start. Focus on learning the motions first.",
          "Intermediate to advanced flippers — Most prefer latchless for cleaner trick flow.",
          "Everyday carry — A latch adds a layer of security keeping the knife closed in a pocket.",
        ],
      },
    ],
  },
];

export const getTopicBySlug = (slug: string): LearnTopic | undefined =>
  LEARN_TOPICS.find((t) => t.slug === slug);
