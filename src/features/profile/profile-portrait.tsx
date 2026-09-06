import Image from "next/image";

interface ProfilePortraitProps {
  fetchPriority?: "high" | "low" | "auto";
  name: string;
  photoUrl?: string;
  sizes: string;
}

const getPortraitSrc = ({ photoUrl }: { photoUrl: string }): string => {
  const url = new URL(photoUrl);

  if (url.hostname !== "images.unsplash.com") {
    return photoUrl;
  }

  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "crop");
  url.searchParams.set("q", "90");
  url.searchParams.set("w", "1800");

  return url.href;
};

export const ProfilePortrait = ({
  fetchPriority,
  name,
  photoUrl,
  sizes,
}: ProfilePortraitProps) => {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <span className="relative block size-full overflow-hidden bg-zinc-200">
      {photoUrl ? (
        <Image
          fill
          alt={`Portrait of ${name}`}
          draggable={false}
          fetchPriority={fetchPriority}
          loading={fetchPriority === "high" ? "eager" : "lazy"}
          quality={90}
          sizes={sizes}
          src={getPortraitSrc({ photoUrl })}
          className="object-cover object-[center_18%]"
        />
      ) : (
        <span
          aria-hidden="true"
          className="from-brand-600 to-brand-accent-600 flex size-full items-center justify-center bg-gradient-to-br text-8xl font-bold text-white"
        >
          {initial}
        </span>
      )}
    </span>
  );
};

/*
 * Learning notes
 *
 * Next.js 16 `next/image`
 * - `quality={90}` only works because `images.qualities` includes 90. Next.js
 *   16 defaults that allowlist to `[75]`; Next.js 14.1 accepted any quality.
 * - LCP portraits use `fetchPriority="high"` and `loading="eager"`. Next.js 16
 *   deprecated `priority` in favor of clearer preload / fetch-priority props.
 *   Next.js 14.1 used `priority` for the same behavior.
 */
