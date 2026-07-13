const CommentSkeleton = ({ depth = 0 }: { depth?: number }) => (
  <div className={`flex gap-3 ${depth > 0 ? "ml-9 mt-3" : ""} animate-pulse`}>
    {/* Avatar */}
    <div className="w-9 h-9 rounded-full bg-white/[0.08] flex-shrink-0 mt-0.5" />

    <div className="flex-1 flex flex-col gap-2 min-w-0">
      {/* Header: name + identifier + timestamp */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="h-3 w-24 rounded-full bg-white/[0.09]" />
        <div className="h-2.5 w-10 rounded-full bg-white/[0.06]" />
        <div className="h-2.5 w-14 rounded-full bg-white/[0.05]" />
      </div>

      {/* Comment text lines */}
      <div className="h-[15px] w-full rounded-full bg-white/[0.07]" />
      <div className="h-[15px] w-4/5 rounded-full bg-white/[0.07]" />

      {/* Actions row */}
      <div className="flex items-center gap-3 mt-1">
        <div className="h-3 w-8 rounded-full bg-white/[0.05]" />
        <div className="h-3 w-10 rounded-full bg-white/[0.05]" />
      </div>
    </div>
  </div>
);

export default CommentSkeleton;
