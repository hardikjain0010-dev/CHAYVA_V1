import type { SVGProps } from "react";

interface CaayvaLogoProps extends SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

export function CaayvaLogo({ className = "h-8 w-8", size, ...props }: CaayvaLogoProps) {
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
      aria-label="Caayva Logo"
      {...props}
    >
      <defs>
        {/* Main Signature Purple -> Magenta Gradient for outer C */}
        <linearGradient
          id="caayva-c-gradient"
          x1="20"
          y1="12"
          x2="84"
          y2="88"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="40%" stopColor="#9333EA" />
          <stop offset="75%" stopColor="#D946EF" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>

        {/* Soft Lavender Flow Gradient for Inner Behavioral Stream */}
        <linearGradient
          id="caayva-inner-flow"
          x1="62"
          y1="34"
          x2="32"
          y2="68"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#EDE9FE" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#DDD6FE" stopOpacity="0.85" />
          <stop offset="80%" stopColor="#C4B5FD" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#E9D5FF" stopOpacity="0.6" />
        </linearGradient>

        {/* Delicate Secondary Highlight Stream */}
        <linearGradient
          id="caayva-inner-glow"
          x1="55"
          y1="36"
          x2="40"
          y2="62"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#F5F3FF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#DDD6FE" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Internal Flow Layer 1 — Soft Lavender Behavioral Stream */}
      <path
        d="M 64 36 C 48 35 34 43 34 52 C 34 61 46 67 60 63 C 50 67 38 63 38 52 C 38 45 49 38 64 36 Z"
        fill="url(#caayva-inner-flow)"
      />

      {/* Internal Flow Layer 2 — Gentle Dynamic Flow Arc */}
      <path
        d="M 60 40 C 47 40 37 46 37 53 C 37 59 45 63 56 61 C 46 62 40 58 40 53 C 40 48 48 43 60 40 Z"
        fill="url(#caayva-inner-glow)"
      />

      {/* Main Hero C-Shape Body */}
      <path
        d="M 68 26 A 34 34 0 1 0 68 74"
        stroke="url(#caayva-c-gradient)"
        strokeWidth="12.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default CaayvaLogo;
