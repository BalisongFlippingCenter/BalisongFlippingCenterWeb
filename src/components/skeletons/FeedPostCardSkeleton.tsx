const FeedPostCardSkeleton = ({ variant = "feed" }: { variant?: "feed" | "page" }) => (
  <div
    className={`w-full border-y border-x-0 lg:border border-white/10 overflow-hidden bg-[#13161d] animate-pulse ${
      variant === "page" ? "lg:rounded-t-2xl" : "lg:rounded-2xl"
    }`}
  >
    {/* Header */}
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-9 h-9 rounded-full bg-white/[0.09] flex-shrink-0" />
        <div className="flex flex-col gap-2 min-w-0">
          <div className="h-3 w-28 rounded-full bg-white/[0.08]" />
          <div className="h-2.5 w-16 rounded-full bg-white/[0.06]" />
        </div>
      </div>
      <div className="h-6 w-20 rounded-full bg-white/[0.07] flex-shrink-0" />
    </div>

    {/* Media */}
    <div className="w-full aspect-[4/5] lg:aspect-[4/3] bg-white/[0.05]" />

    {/* Tags */}
    <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
      <div className="h-5 w-20 rounded-full bg-white/[0.07]" />
      <div className="h-5 w-16 rounded-full bg-white/[0.07]" />
      <div className="h-5 w-14 rounded-full bg-white/[0.07]" />
    </div>

    {/* Caption */}
    <div className="px-4 pt-1 pb-3 flex flex-col gap-2">
      <div className="h-3 w-full rounded-full bg-white/[0.06]" />
      <div className="h-3 w-4/5 rounded-full bg-white/[0.06]" />
    </div>

    {/* Likes / comments */}
    <div className="flex items-center gap-5 px-4 pb-4">
      <div className="h-4 w-12 rounded-full bg-white/[0.07]" />
      <div className="h-4 w-16 rounded-full bg-white/[0.07]" />
    </div>
  </div>
);

export default FeedPostCardSkeleton;
