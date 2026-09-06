"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, type ReactNode } from "react";

import {
  initialLogoutActionState,
  logoutAction,
} from "@/features/auth/logout.action";
import { BrandConstantsCollection } from "@/features/brand/brand.constants";
import { BrandMark } from "@/features/brand/brand-mark";
import { LogoutSubmitButton } from "@/features/navigation/logout-submit-button";
import { ProfileAvatar } from "@/features/profile/profile-avatar";

interface HeaderLinkProps {
  children: ReactNode;
  href: string;
  icon: ReactNode;
}

interface AppHeaderProps {
  viewer?: {
    name: string;
    photoUrl?: string;
  };
}

const HeaderLink = ({ children, href, icon }: HeaderLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={
        isActive
          ? "bg-brand-50 text-brand-700 flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold"
          : "flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
      }
    >
      {icon}
      <span className="hidden md:inline">{children}</span>
    </Link>
  );
};

export const AppHeader = ({ viewer }: AppHeaderProps) => {
  const pathname = usePathname();
  const [logoutState, logoutFormAction] = useActionState(
    logoutAction,
    initialLogoutActionState,
  );
  const isPersonDetails = pathname.startsWith("/people/");
  const isProfileActive =
    pathname === "/profile" || pathname.startsWith("/profile/");

  return (
    <header className="chat-viewport-header border-brand-200/70 bg-brand-50/85 supports-[backdrop-filter]:bg-brand-50/75 sticky top-0 z-50 border-b shadow-[0_1px_0_rgba(79,70,229,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/feed"
          aria-label={`${BrandConstantsCollection.DisplayName} home`}
          className="focus-visible:ring-brand-600/20 flex shrink-0 items-center gap-3 font-bold tracking-[-0.02em] focus-visible:rounded-xl focus-visible:outline-none focus-visible:ring-4"
        >
          <BrandMark className="size-9 shrink-0 shadow-[0_8px_20px_-8px_rgba(79,70,229,0.65)]" />
          <span className="hidden sm:inline">
            {BrandConstantsCollection.DisplayName}
          </span>
        </Link>

        {isPersonDetails ? null : (
          <nav
            aria-label="Primary navigation"
            className="border-brand-200/70 flex items-center rounded-2xl border bg-white/65 p-1 shadow-sm"
          >
            <HeaderLink
              href="/feed"
              icon={
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="7" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M12 1v2M23 12h-2M12 23v-2M1 12h2" />
                </svg>
              }
            >
              Discover
            </HeaderLink>
            <HeaderLink
              href="/connections"
              icon={
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                >
                  <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8" />
                </svg>
              }
            >
              Connections
            </HeaderLink>
            <HeaderLink
              href="/chat"
              icon={
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                >
                  <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z" />
                </svg>
              }
            >
              Inbox
            </HeaderLink>
          </nav>
        )}

        <div className="relative flex shrink-0 items-center gap-2">
          <Link
            href="/profile"
            aria-label="Your profile"
            aria-current={isProfileActive ? "page" : undefined}
            className={
              isProfileActive
                ? "flex size-10 items-center justify-center rounded-full bg-zinc-950 text-white shadow-sm"
                : "border-brand-200/80 focus-visible:ring-brand-600/20 flex size-10 items-center justify-center rounded-full border bg-white/75 text-zinc-600 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-4"
            }
          >
            {viewer ? (
              <ProfileAvatar
                className="size-full rounded-full text-sm"
                name={viewer.name}
                photoUrl={viewer.photoUrl}
                sizes="40px"
              />
            ) : (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0116 0" />
              </svg>
            )}
          </Link>

          <form action={logoutFormAction}>
            <input type="hidden" name="intent" value="logout" />
            <LogoutSubmitButton />
          </form>

          {logoutState.message ? (
            <p
              role="alert"
              className="absolute top-12 right-0 w-56 rounded-xl border border-rose-200 bg-white px-4 py-3 text-xs font-medium text-rose-700 shadow-xl"
            >
              {logoutState.message}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
};

/*
 * Learning notes
 *
 * Focused Client Component
 * - Route-aware active states and logout form state require browser interaction;
 *   authenticated pages beneath this small header remain Server Components.
 * - `useActionState` exposes the React 19 logout Action result. React 18.2
 *   typically coordinated request and result state with multiple hooks.
 *
 * Next.js versions
 * - `usePathname` provides the active App Router path in both Next.js 14.1 and
 *   16.3. The shared route-group layout keeps this header mounted during
 *   authenticated client navigation.
 */
