export interface LearnSection {
  heading?: string;
  type: "paragraph" | "list";
  body: string | string[];
}

export interface LearnTopic {
  slug: string;
  title: string;
  subtitle: string;
  sections: LearnSection[];
}

export const LEARN_TOPICS: LearnTopic[] = [
  {
    slug: "what-is-a-balisong",
    title: "What is a Balisong?",
    subtitle: "An introduction to the butterfly knife — its origins, design, and why people flip them.",
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
        heading: "The Hobby",
        type: "paragraph",
        body: "In modern times, balisong flipping has grown into a dedicated global hobby. Flippers develop skill in manipulating the knife through tricks and combos — opening and closing the knife in fluid, creative sequences. The community spans beginners learning their first rollover to seasoned flippers developing original trick combinations and competing on a world stage.",
      },
      {
        heading: "Trainers vs Live Blades",
        type: "paragraph",
        body: "Balisongs come in two main forms: trainers and live blades. A trainer has a dull, unsharpened blade — ideal for learning tricks safely. A live blade is a sharpened, functional knife. Most people in the hobby recommend starting with a trainer before moving to a live blade.",
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
    sections: [
      {
        type: "paragraph",
        body: "Balisong legality is one of the most important things to understand before buying or carrying one. Laws vary significantly by country, state, and even city. The information below is a general reference — always verify your local laws before purchasing or carrying a balisong.",
      },
      {
        heading: "United States",
        type: "paragraph",
        body: "In the United States, balisong laws vary by state. Many states treat the balisong as a standard folding knife with no additional restrictions. However, some states have specific laws targeting butterfly knives. Key states with restrictions include California (balisongs with blades over 2 inches are illegal to carry concealed), Hawaii (illegal to own or carry), and New York City (heavily restricted). Some states are completely permissive. Always check your state and local municipality.",
      },
      {
        heading: "Outside the United States",
        type: "list",
        body: [
          "United Kingdom — Balisongs are illegal to carry in public and classified as a prohibited weapon",
          "Germany — Balisongs are generally prohibited under weapon laws",
          "Canada — Legal to own but illegal to carry concealed in many provinces",
          "Australia — Varies by state; generally restricted or prohibited",
          "Philippines — Legal, as it is the country of origin",
          "Most of the EU — Heavily restricted or outright banned",
        ],
      },
      {
        heading: "Trainers and the Law",
        type: "paragraph",
        body: "Trainer balisongs have dull, unsharpened blades and are generally viewed more favorably under the law — but they are not universally legal everywhere. Some laws target the design of the handle mechanism itself, regardless of whether the blade is sharp. Do not assume a trainer is legal just because it cannot cut.",
      },
      {
        heading: "Our Platform and Legality",
        type: "paragraph",
        body: "Balisong Flipping Center is a community platform, and users are solely responsible for ensuring their activity complies with the laws in their jurisdiction. Any buy/sell or trade activity on this platform occurs off-platform — we are not a party to any transaction and are not responsible for what is bought, sold, or carried. See our Terms of Service for full details.",
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
  {
    slug: "how-to-choose-your-first-balisong",
    title: "How to Choose Your First Balisong",
    subtitle: "A practical guide to picking the right first knife without overspending or making a mistake you'll regret.",
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
        heading: "Budget",
        type: "list",
        body: [
          "$20–$50 — Entry-level trainers. Brands like Squid Industries (Squidtrainer), Aurgelmir, and various Amazon options fall here. Expect washer pivots and basic construction. Good enough to learn fundamentals.",
          "$50–$150 — Mid-range. Better construction, tighter tolerances, and more satisfying flip. The Squid Industries Krake Raken Trainer and similar offerings sit here. Recommended sweet spot for most beginners.",
          "$150–$300 — Higher-end production knives. Better pivot systems, tighter tolerances, premium materials. Worth it once you know you're committed to the hobby.",
          "$300+ — Premium and custom territory. Not necessary for a first knife.",
        ],
      },
      {
        heading: "What to Look For",
        type: "list",
        body: [
          "Good pivot tolerances — Handles should not wobble side to side excessively",
          "Reasonable weight — Not so light it feels cheap, not so heavy it's tiring",
          "Zen pins or tang pins — Either works for a beginner",
          "Reputation — Buy from known brands or sellers with reviews",
          "Availability of parts — Can you get replacement pivots or tune it if needed?",
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
        heading: "Where to Buy",
        type: "paragraph",
        body: "Reputable retailers include the Squid Industries website, BladeHQ, KnifeCenter, and the Balisong Collectors Alliance (BCA) group on Facebook for the secondhand market. Always buy from established sellers with return policies when possible.",
      },
      {
        heading: "Final Advice",
        type: "paragraph",
        body: "The best first balisong is one that is safe to learn on, well-built enough to not frustrate you with poor tolerances, and inexpensive enough that you're not stressed about dropping it. Once you've spent a few months with it and know you love the hobby, you'll have a much better sense of what you want in your next knife.",
      },
    ],
  },
];

export const getTopicBySlug = (slug: string): LearnTopic | undefined =>
  LEARN_TOPICS.find((t) => t.slug === slug);
