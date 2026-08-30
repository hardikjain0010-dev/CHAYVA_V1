import type { ImgHTMLAttributes } from "react";
import { BRAND_NAME } from "@/lib/brand";
import logoAsset from "@/assets/logo.png";

export interface ArthyneLogoProps extends ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
  size?: number | string;
}

export function ArthyneLogo({
  className = "h-8 w-8",
  size,
  alt = `${BRAND_NAME} Logo`,
  src = logoAsset,
  style,
  ...props
}: ArthyneLogoProps) {
  const dimensionStyle = size
    ? {
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size,
      }
    : undefined;

  return (
    <img
      src={src}
      alt={alt}
      className={`inline-block object-contain select-none shrink-0 rounded-xl ${className}`}
      style={{
        ...dimensionStyle,
        ...style,
      }}
      loading="eager"
      decoding="async"
      {...props}
    />
  );
}

export const CaayvaLogo = ArthyneLogo;
export default ArthyneLogo;
