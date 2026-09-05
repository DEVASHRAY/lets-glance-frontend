import Link from "next/link";
import type { ReactNode } from "react";

import type { ConnectionProfile } from "@/features/connections/connections.schemas";
import { ProfileAvatar } from "@/features/profile/profile-avatar";

interface ConnectionPortraitCardProps {
  actions?: ReactNode;
  profile: ConnectionProfile;
}

export const ConnectionPortraitCard = ({
  actions,
  profile,
}: ConnectionPortraitCardProps) => {
  return (
    <li className="min-w-0">
      <article className="group relative flex h-full cursor-pointer flex-col rounded-2xl border border-zinc-200 bg-white p-3 shadow-[0_14px_36px_-30px_rgba(72,24,49,0.5)] transition hover:border-[#f32672]/25 hover:bg-[#fff7fa] hover:shadow-[0_18px_42px_-28px_rgba(72,24,49,0.55)]">
        <Link
          href={`/people/${profile.id}`}
          className="absolute inset-0 rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f32672]/20"
        >
          <span className="sr-only">View {profile.name}&apos;s profile</span>
        </Link>

        <div className="pointer-events-none relative z-10 flex min-w-0 items-center gap-2.5">
          <ProfileAvatar
            className="size-11 rounded-xl text-sm sm:size-12"
            name={profile.name}
            photoUrl={profile.photoUrl}
            sizes="48px"
          />

          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-zinc-950">
              {profile.name}, {profile.age}
            </span>
          </span>
        </div>

        {actions ? (
          <div className="pointer-events-none relative z-20 mt-2 flex min-h-10 items-center justify-center border-t border-zinc-100 pt-2">
            <div className="pointer-events-auto">{actions}</div>
          </div>
        ) : null}
      </article>
    </li>
  );
};
