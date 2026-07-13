const ProfilePageSkeleton = () => (
  <section className="relative w-full min-h-screen animate-pulse">

    {/* Banner */}
    <div className="w-full xsm:h-[130px] md:h-40 lg:h-48 rounded-b-3xl bg-white/[0.06]" />

    {/* Avatar — mirrors real profile absolute positioning */}
    <div className="w-full flex justify-center absolute pointer-events-none" style={{ marginTop: 0 }}>
      <div className="lg:h-56 lg:w-56 md:h-48 md:w-48 sm:h-40 sm:w-40 xsm:h-32 xsm:w-32 rounded-full bg-white/[0.09] lg:-translate-y-28 md:-translate-y-24 sm:-translate-y-20 xsm:-translate-y-16 border-4 border-[#0a0c10] flex-shrink-0" />
    </div>

    {/* Info section */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-6 xsm:pt-24 sm:pt-28 md:pt-6 lg:pt-8 pb-4 gap-6">

      {/* Left — name, bio, stats */}
      <div className="flex flex-col gap-3 md:gap-4 md:max-w-xs">

        {/* Name row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-7 h-7 rounded-full bg-white/[0.08]" />
          <div className="h-6 w-40 rounded-full bg-white/[0.09]" />
          <div className="h-5 w-14 rounded-full bg-white/[0.06]" />
        </div>

        {/* Bio lines */}
        <div className="flex flex-col gap-2">
          <div className="h-3 w-72 max-w-full rounded-full bg-white/[0.06]" />
          <div className="h-3 w-56 max-w-full rounded-full bg-white/[0.06]" />
          <div className="h-3 w-36 max-w-full rounded-full bg-white/[0.05]" />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-5 md:pt-1">
          {(["Posts", "Followers", "Following"] as const).map((label, i) => (
            <>
              {i > 0 && <div key={`sep-${i}`} className="w-px h-8 bg-white/[0.08]" />}
              <div key={label} className="flex flex-col gap-1.5">
                <div className="h-7 w-8 rounded-lg bg-white/[0.09]" />
                <div className="h-2.5 w-14 rounded-full bg-white/[0.05]" />
              </div>
            </>
          ))}
        </div>
      </div>

      {/* Right — collection card placeholder */}
      <div className="w-full md:w-64 xsm:h-36 sm:h-40 md:h-44 rounded-2xl bg-white/[0.06] flex-shrink-0" />
    </div>

    {/* Posts area */}
    <div className="w-full border-t border-white/[0.06]">
      {/* Filter bar */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-6 py-4 xsm:gap-1 md:gap-3">
        <div className="h-8 w-20 rounded-lg bg-white/[0.07] justify-self-start" />
        <div className="flex flex-col items-center gap-1.5">
          <div className="h-5 w-6 rounded-md bg-white/[0.08]" />
          <div className="h-2.5 w-10 rounded-full bg-white/[0.05]" />
        </div>
        <div className="h-8 w-24 rounded-lg bg-white/[0.07] justify-self-end" />
      </div>

      {/* Post grid */}
      <div className="grid xsm:grid-cols-3 lg:grid-cols-4 xsm:gap-px lg:gap-3 xsm:px-0 lg:px-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className={`aspect-square bg-white/[0.06] ${
              i % 3 === 0
                ? "bg-white/[0.07]"
                : i % 3 === 1
                ? "bg-white/[0.06]"
                : "bg-white/[0.05]"
            } xsm:rounded-none lg:rounded-xl`}
          />
        ))}
      </div>
    </div>

  </section>
);

export default ProfilePageSkeleton;
