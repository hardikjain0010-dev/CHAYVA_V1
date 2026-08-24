import type { SVGProps } from "react";

interface ChayvaLogoProps extends SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

export function ChayvaLogo({
  className = "h-8 w-8",
  size,
  ...props
}: ChayvaLogoProps) {
  const width = size ?? props.width;
  const height = size ?? props.height;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={width}
      height={height}
      aria-label="Chayva Logo"
      {...props}
    >
      <defs>
        <linearGradient
          id="chayva-logo-gradient"
          x1="20"
          y1="10"
          x2="80"
          y2="90"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="45%" stopColor="#9333EA" />
          <stop offset="75%" stopColor="#D946EF" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>

      {/* Main C-Shape Body */}
      <path
        d="M 67 27 A 34 34 0 1 0 67 73"
        stroke="url(#chayva-logo-gradient)"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Stylized Bottom Inner Plume Accents */}
      <path
        d="M 46 76.5 C 51 72 61 63 67 52 C 63.5 59 55 68 44 73.5 Z"
        fill="url(#chayva-logo-gradient)"
      />
      <path
        d="M 50 81 C 55 77 62 70 65 62 C 62 67 55 74 46 78 Z"
        fill="url(#chayva-logo-gradient)"
      />
    </svg>
  );
}

export default ChayvaLogo;
