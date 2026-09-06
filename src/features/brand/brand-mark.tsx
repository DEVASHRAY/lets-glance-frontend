import { BrandConstantsCollection } from "@/features/brand/brand.constants";

interface BrandMarkProps {
  className?: string;
  label?: string;
}

export const BrandMark = ({ className, label }: BrandMarkProps) => {
  return (
    <svg
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={className}
      focusable="false"
      role={label ? "img" : undefined}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="lets-glance-heart-fire-gradient"
          x1="4"
          y1="3"
          x2="28"
          y2="29"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={BrandConstantsCollection.PrimaryColor} />
          <stop offset="1" stopColor={BrandConstantsCollection.AccentColor} />
        </linearGradient>
      </defs>
      <rect
        width="32"
        height="32"
        rx="9"
        fill="url(#lets-glance-heart-fire-gradient)"
      />
      <path d={BrandConstantsCollection.MarkHeartPath} fill="#ffffff" />
    </svg>
  );
};
