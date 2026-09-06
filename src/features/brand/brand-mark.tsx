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
      <rect width="32" height="32" rx="9" fill="#4338ca" />
      <circle
        cx="9.5"
        cy="10.5"
        r="2.8"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.2"
      />
      <circle
        cx="22.5"
        cy="10.5"
        r="2.8"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.2"
      />
      <path
        d="M4.8 23c.7-4.1 2.6-6.2 5.6-6.2 2.4 0 4 1.1 4.8 3.3M27.2 23c-.7-4.1-2.6-6.2-5.6-6.2-2.4 0-4 1.1-4.8 3.3"
        fill="none"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeWidth="2.2"
      />
      <path
        d="m16 9.7.6 2.2 2.2.6-2.2.6-.6 2.2-.6-2.2-2.2-.6 2.2-.6.6-2.2Z"
        fill="#ffffff"
      />
    </svg>
  );
};
