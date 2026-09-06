import type { ReactNode } from "react";

import { ProfileConstantsCollection } from "@/features/profile/profile.constants";
import { ProfilePortrait } from "@/features/profile/profile-portrait";
import type { PublicProfile } from "@/features/profile/profile.schemas";

interface PersonProfileDetailsProps {
  actions?: ReactNode;
  eyebrow: string;
  floatingActions?: ReactNode;
  privateFacts?: DetailFact[];
  profile: PublicProfile;
}

interface DetailFact {
  label: string;
  value: string;
}

interface ProfilePhoto {
  sortOrder: number;
  url: string;
}

interface SpotlightCardProps {
  body?: string;
  kicker: string;
  label: string;
}

const PILL_CLASS_NAME =
  "rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md";

const TILE_CLASS_NAME =
  "border-brand-border bg-brand-panel/90 shadow-brand-panel rounded-[1.4rem] border p-4";

const getOrderedPhotos = ({
  photoUrl,
  photos,
}: {
  photoUrl?: string;
  photos?: ProfilePhoto[];
}): ProfilePhoto[] => {
  const album = photos
    ? [...photos].sort((left, right) => left.sortOrder - right.sortOrder)
    : [];

  if (photoUrl && !album.some((photo) => photo.url === photoUrl)) {
    return [{ sortOrder: -1, url: photoUrl }, ...album];
  }

  if (album.length) {
    return album;
  }

  if (photoUrl) {
    return [{ sortOrder: 0, url: photoUrl }];
  }

  return [];
};

const getFactsWithValues = ({
  facts,
}: {
  facts: DetailFact[];
}): DetailFact[] => {
  return facts.filter((fact) => fact.value);
};

const SpotlightCard = ({ body, kicker, label }: SpotlightCardProps) => {
  return (
    <section className={TILE_CLASS_NAME}>
      <p className="text-brand-700/70 text-[0.65rem] font-bold tracking-[0.18em] uppercase">
        {label}
      </p>
      <p className="text-brand-ink mt-2 text-xl leading-snug font-semibold tracking-[-0.03em]">
        {kicker}
      </p>
      {body ? (
        <p className="text-brand-muted mt-2 text-sm leading-6">{body}</p>
      ) : null}
    </section>
  );
};

const FactTile = ({ label, value }: DetailFact) => {
  return (
    <div className={TILE_CLASS_NAME}>
      <p className="text-brand-700/70 text-[0.65rem] font-bold tracking-[0.16em] uppercase">
        {label}
      </p>
      <p className="text-brand-ink/90 mt-1.5 text-sm leading-6 font-medium">
        {value}
      </p>
    </div>
  );
};

export const PersonProfileDetails = ({
  actions,
  eyebrow,
  floatingActions,
  privateFacts,
  profile,
}: PersonProfileDetailsProps) => {
  const orderedPhotos = getOrderedPhotos({
    photoUrl: profile.photoUrl,
    photos: profile.photos,
  });
  const mainPhoto = orderedPhotos[0];
  const extraPhotos = orderedPhotos.slice(1);
  const cinema = profile.life?.cinema;
  const lifestyle = profile.life?.lifestyle;
  const cityLife = profile.life?.cityLife;
  const texture = profile.life?.texture;
  const compactFacts = getFactsWithValues({
    facts: [
      {
        label: "Weekday pace",
        value: lifestyle?.weekdayPace
          ? ProfileConstantsCollection.WeekdayPaceLabel[lifestyle.weekdayPace]
          : "",
      },
      {
        label: "Sleep",
        value: lifestyle?.sleepWindow
          ? ProfileConstantsCollection.SleepWindowLabel[lifestyle.sleepWindow]
          : "",
      },
      {
        label: "Social battery",
        value: lifestyle?.socialBattery
          ? ProfileConstantsCollection.SocialBatteryLabel[
              lifestyle.socialBattery
            ]
          : "",
      },
      {
        label: "Home",
        value: lifestyle?.homeEnergy
          ? ProfileConstantsCollection.HomeEnergyLabel[lifestyle.homeEnergy]
          : "",
      },
      {
        label: "Noise",
        value: cityLife?.noiseComfort
          ? ProfileConstantsCollection.NoiseComfortLabel[cityLife.noiseComfort]
          : "",
      },
      {
        label: "Food",
        value: cityLife?.foodCourage
          ? ProfileConstantsCollection.FoodCourageLabel[cityLife.foodCourage]
          : "",
      },
      {
        label: "City they miss",
        value: cityLife?.cityTheyMiss || "",
      },
      {
        label: "Movie night",
        value: cinema?.movieNightStyle
          ? ProfileConstantsCollection.MovieNightStyleLabel[
              cinema.movieNightStyle
            ]
          : "",
      },
      {
        label: "Obsessed with",
        value: texture?.currentlyObsessed || "",
      },
      {
        label: "Offscreen",
        value: texture?.offscreenHobby || "",
      },
      {
        label: "Playlist weather",
        value: texture?.playlistWeather || "",
      },
      {
        label: "Family",
        value: texture?.familyOrbit
          ? ProfileConstantsCollection.FamilyOrbitLabel[texture.familyOrbit]
          : "",
      },
    ],
  });

  return (
    <article
      className={
        floatingActions
          ? "mx-auto grid max-w-6xl gap-4 px-4 pt-5 pb-24 lg:grid-cols-[minmax(17rem,22rem)_minmax(0,1fr)] lg:items-start lg:pt-6 lg:pb-24"
          : "mx-auto grid max-w-6xl gap-4 px-4 py-5 lg:grid-cols-[minmax(17rem,22rem)_minmax(0,1fr)] lg:items-start lg:py-6"
      }
    >
      <div className="lg:sticky lg:top-20">
        <div className="relative aspect-[3/4] overflow-hidden rounded-[1.8rem] bg-zinc-200 sm:aspect-[4/5] lg:aspect-auto lg:h-[calc(100svh-6.5rem)]">
          <ProfilePortrait
            name={profile.name}
            photoUrl={mainPhoto?.url}
            fetchPriority="high"
            sizes="(min-width: 1024px) 22rem, 100vw"
          />
          <div
            className={
              actions
                ? "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-5 pt-24 pb-24"
                : "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-5 pt-24 pb-5"
            }
          >
            <p className="text-[0.65rem] font-bold tracking-[0.22em] text-white/70 uppercase">
              {eyebrow}
            </p>
            <h1 className="mt-1 text-3xl leading-[0.95] font-semibold tracking-[-0.045em] text-white sm:text-4xl">
              {profile.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`${PILL_CLASS_NAME} tabular-nums`}>
                {profile.age}
              </span>
              {profile.jobTitle ? (
                <span className={PILL_CLASS_NAME}>{profile.jobTitle}</span>
              ) : null}
              {profile.location?.city ? (
                <span className={PILL_CLASS_NAME}>{profile.location.city}</span>
              ) : null}
              <span className={`${PILL_CLASS_NAME} capitalize`}>
                {profile.gender}
              </span>
            </div>
          </div>
          {actions ? (
            <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center">
              {actions}
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        {profile.bio ? (
          <p
            className={`${TILE_CLASS_NAME} text-brand-ink/90 text-base leading-7`}
          >
            {profile.bio}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          {cinema?.comfortMovie ? (
            <SpotlightCard
              label="Cinema"
              kicker={cinema.comfortMovie}
              body={cinema.currentlyWatching}
            />
          ) : null}

          {texture?.firstDateSetting ? (
            <SpotlightCard
              label="An evening"
              kicker={texture.firstDateSetting}
              body={texture.conversationFuel}
            />
          ) : null}

          {lifestyle?.sundayRitual ? (
            <section className={`${TILE_CLASS_NAME} sm:col-span-2`}>
              <p className="text-brand-700/70 text-[0.65rem] font-bold tracking-[0.18em] uppercase">
                Sunday
              </p>
              <p className="text-brand-ink/90 mt-2 text-sm leading-6">
                {lifestyle.sundayRitual}
              </p>
            </section>
          ) : null}

          {compactFacts.map((fact) => (
            <FactTile key={fact.label} label={fact.label} value={fact.value} />
          ))}

          {privateFacts?.map((fact) => (
            <FactTile key={fact.label} label={fact.label} value={fact.value} />
          ))}
        </div>

        {extraPhotos.length ? (
          <ul className="grid grid-cols-2 gap-3">
            {extraPhotos.map((photo) => (
              <li
                key={photo.url}
                className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] bg-zinc-200"
              >
                <ProfilePortrait
                  name={profile.name}
                  photoUrl={photo.url}
                  sizes="(max-width: 1024px) 50vw, 176px"
                />
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {floatingActions ? (
        <div className="fixed right-4 bottom-4 z-40 sm:right-6 sm:bottom-6">
          {floatingActions}
        </div>
      ) : null}
    </article>
  );
};
