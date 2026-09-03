interface BalisongMarkProps {
  className?: string;
  fill?: string;
  pupilFill?: string;
}

const BalisongMark = ({ className, fill = "currentColor", pupilFill = "black" }: BalisongMarkProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 155 110" className={className}>
    <path d="M 52,55 L 6,12 L 0,18 L 4,26 L 44,59 Z" fill={fill} opacity="0.95" />
    <path d="M 52,55 L 6,12 L 10,8 L 56,51 Z" fill={fill} opacity="0.3" />
    <path d="M 52,55 L 6,98 L 0,92 L 4,84 L 44,51 Z" fill={fill} opacity="0.95" />
    <path d="M 52,55 L 6,98 L 10,102 L 56,59 Z" fill={fill} opacity="0.3" />
    <path
      d="M 52,55 C 70,54 92,50 112,46 C 130,42 142,38 148,35 C 142,41 130,47 112,52 C 92,57 70,58 52,57 Z"
      fill={fill}
      opacity="0.95"
    />
    <circle cx="52" cy="55" r="4.5" fill={fill} />
    <circle cx="52" cy="55" r="2" fill={pupilFill} />
  </svg>
);

export default BalisongMark;
