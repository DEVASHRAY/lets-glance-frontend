import Image from "next/image";

interface ProfileAvatarProps {
  className: string;
  name: string;
  photoUrl?: string;
  sizes: string;
}

export const ProfileAvatar = ({
  className,
  name,
  photoUrl,
  sizes,
}: ProfileAvatarProps) => {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      className={`from-brand-600 to-brand-accent-600 relative flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br font-bold text-white ${className}`}
    >
      {photoUrl ? (
        <Image
          fill
          alt={`Portrait of ${name}`}
          draggable={false}
          sizes={sizes}
          src={photoUrl}
          className="object-cover"
        />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  );
};
