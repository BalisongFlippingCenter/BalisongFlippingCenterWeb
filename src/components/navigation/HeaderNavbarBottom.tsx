import { faCircleUser, faCubes, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NavLink, useLocation } from "react-router-dom";
import { useAppSelector } from "../../redux/hooks";
import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import useWindowSize from "../../hooks/useWindowSize";

const NOTCH_HW = 30;   // notch half-width
const NOTCH_D  = 20;   // notch depth
const NOTCH_S  = 10;   // shoulder smoothing
const CORNER_R = 28;   // pill corner radius

const buildPillPath = (W: number, H: number, cx: number, depth: number, cornerR = CORNER_R): string => {
  if (!W || !H) return '';
  const r = cornerR;

  const notchSection = [
    `L ${cx - NOTCH_HW - NOTCH_S} 0`,
    `C ${cx - NOTCH_HW} 0 ${cx - NOTCH_HW / 3} ${depth} ${cx} ${depth}`,
    `C ${cx + NOTCH_HW / 3} ${depth} ${cx + NOTCH_HW} 0 ${cx + NOTCH_HW + NOTCH_S} 0`,
  ].join(' ');

  return [
    `M ${r} 0`,
    notchSection,
    `L ${W - r} 0`,
    `Q ${W} 0 ${W} ${r}`,
    `L ${W} ${H - r}`,
    `Q ${W} ${H} ${W - r} ${H}`,
    `L ${r} ${H}`,
    `Q 0 ${H} 0 ${H - r}`,
    `L 0 ${r}`,
    `Q 0 0 ${r} 0`,
    `Z`,
  ].join(' ');
};

const MIN_STIFF = 70;
const MAX_STIFF = 160;
const MIN_DIST  = 50;
const MAX_DIST  = 220;

const getSpringConfig = (distance: number) => {
  const t = Math.min(1, Math.max(0, (distance - MIN_DIST) / (MAX_DIST - MIN_DIST)));
  const stiffness = MIN_STIFF + t * (MAX_STIFF - MIN_STIFF);
  return { type: 'spring' as const, stiffness, damping: 18 };
};

const pulseSpring = { type: 'spring' as const, stiffness: 500, damping: 15 };

// ─── Shared nav item ────────────────────────────────────────────────────────
interface NavItemProps {
  isActive: boolean;
  label: string;
  springConfig: ReturnType<typeof getSpringConfig>;
  floatY: number;
  activeScale: number;
  hoverScale: number;
  children: React.ReactNode;
  className?: string;
}

const NavItem = ({ isActive, label, springConfig, floatY, activeScale, hoverScale, children, className = '' }: NavItemProps) => (
  <div className={`flex flex-col items-center px-2 xsm:pt-2 xsm:pb-1 xsm:gap-0.5 md:pt-3.5 md:pb-2 md:gap-1 short:md:pt-1.5 short:md:pb-1 short:md:gap-0.5 ${className}`}>
    <motion.div
      animate={{ y: isActive ? floatY : 0 }}
      transition={springConfig}
    >
      <motion.div
        animate={{ scale: isActive ? activeScale : 1 }}
        whileHover={!isActive ? { scale: hoverScale } : undefined}
        transition={isActive ? pulseSpring : springConfig}
      >
        {children}
      </motion.div>
    </motion.div>

    <motion.span
      className="text-[9px] font-medium tracking-wide"
      animate={{
        opacity: isActive ? 0.85 : 0.4,
        color: isActive ? '#108198' : '#ffffff',
      }}
      transition={{ duration: 0.25 }}
    >
      {label}
    </motion.span>
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────
const HeaderNavbarBottom = () => {
  const user = useAppSelector((state) => state.auth.user);
  const location = useLocation();
  const windowSize = useWindowSize();

  const isMobile = (windowSize.at(1) ?? 0) < 950;

  // Animation values — smaller on mobile, full-size on desktop
  const floatY      = isMobile ? -10 : -16;
  const activeScale = isMobile ? 1.25 : 1.6;
  const hoverScale  = isMobile ? 1.1  : 1.15;

  const containerRef  = useRef<HTMLDivElement>(null);
  const profileRef    = useRef<HTMLDivElement>(null);
  const collectionRef = useRef<HTMLDivElement>(null);
  const createRef     = useRef<HTMLDivElement>(null);

  const [notchX, setNotchX]         = useState(0);
  const [notchDepth, setNotchDepth] = useState(0);
  const [dims, setDims]             = useState({ w: 0, h: 0 });

  const prevNotchXRef = useRef(0);
  const notchDistance = Math.abs(notchX - prevNotchXRef.current);
  const springConfig  = getSpringConfig(notchDistance);

  const profilePath    = `/${user?.displayName}/${user?.identifierCode}`;
  const collectionPath = `/${user?.displayName}/${user?.identifierCode}/collection`;
  const createPath     = '/create-post';

  const isProfile    = location.pathname === profilePath;
  const isCollection = location.pathname === collectionPath;
  const isCreate     = location.pathname === createPath;

  const measure = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    setDims({ w: containerRect.width, h: containerRect.height });

    const activeRef = isProfile ? profileRef
      : isCollection ? collectionRef
      : isCreate ? createRef
      : null;

    if (activeRef?.current) {
      const iconRect = activeRef.current.getBoundingClientRect();
      setNotchX(iconRect.left + iconRect.width / 2 - containerRect.left);
      setNotchDepth(NOTCH_D);
    } else {
      setNotchDepth(0);
    }
  }, [isProfile, isCollection, isCreate]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  useEffect(() => {
    prevNotchXRef.current = notchX;
  }, [notchX]);

  const effectiveCx = notchX > 0 ? notchX : dims.w / 2;
  const svgPath = buildPillPath(dims.w, dims.h, effectiveCx, notchDepth, isMobile ? 0 : CORNER_R);

  const navItemProps = { springConfig, floatY, activeScale, hoverScale };

  return (
    <div ref={containerRef} className="relative xsm:w-full md:w-auto">

      {/* SVG pill */}
      {svgPath && (
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="pillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#1c1f27" />
              <stop offset="100%" stopColor="#111318" />
            </linearGradient>
            <filter id="pillGlow" x="-20%" y="-100%" width="140%" height="300%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <motion.path
            fill="url(#pillGrad)"
            initial={{ d: svgPath }}
            animate={{ d: svgPath }}
            transition={springConfig}
          />
          <motion.path
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
            filter="url(#pillGlow)"
            initial={{ d: svgPath }}
            animate={{ d: svgPath }}
            transition={springConfig}
          />
        </svg>
      )}

      {/* Icons */}
      <div className="relative z-10 flex items-center xsm:justify-evenly xsm:w-full xsm:px-4 md:justify-center md:w-auto md:gap-12 md:px-24 text-white">

        {/* Profile */}
        <div ref={profileRef}>
          <NavLink to={profilePath}>
            {({ isActive }) => (
              <NavItem isActive={isActive} label="Profile" {...navItemProps}>
                <div className={`rounded-full flex items-center justify-center xsm:w-7 xsm:h-7 md:w-10 md:h-10 short:md:w-7 short:md:h-7 transition-colors duration-200 ${
                  isActive
                    ? "bg-[#111318] text-blue-primary border border-white/15"
                    : "text-white/65 hover:text-white"
                }`}>
                  <FontAwesomeIcon icon={faCircleUser} className="xsm:text-base md:text-xl short:md:text-base" />
                </div>
              </NavItem>
            )}
          </NavLink>
        </div>

        {/* Collection */}
        <div ref={collectionRef}>
          <NavLink to={collectionPath}>
            {({ isActive }) => (
              <NavItem isActive={isActive} label="Collection" {...navItemProps}>
                <div className={`rounded-full flex items-center justify-center xsm:w-7 xsm:h-7 md:w-10 md:h-10 short:md:w-7 short:md:h-7 transition-colors duration-200 ${
                  isActive
                    ? "bg-[#111318] text-blue-primary border border-white/15"
                    : "text-white/65 hover:text-white"
                }`}>
                  <FontAwesomeIcon icon={faCubes} className="xsm:text-base md:text-xl short:md:text-base" />
                </div>
              </NavItem>
            )}
          </NavLink>
        </div>

        {/* Divider */}
        <div className="w-px self-stretch bg-white/15 my-3" />

        {/* Create Post */}
        <div ref={createRef}>
          <NavLink to={createPath}>
            {({ isActive }) => (
              <NavItem isActive={isActive} label="Create" {...navItemProps}>
                <div className="rounded-full flex items-center justify-center xsm:w-7 xsm:h-7 md:w-10 md:h-10 short:md:w-7 short:md:h-7 bg-blue-primary">
                  <FontAwesomeIcon icon={faPlus} className="text-white xsm:text-sm md:text-lg short:md:text-sm" />
                </div>
              </NavItem>
            )}
          </NavLink>
        </div>

      </div>
    </div>
  );
};

export default HeaderNavbarBottom;
