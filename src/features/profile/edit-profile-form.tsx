"use client";

import { useRouter } from "next/navigation";
import { useActionState, useOptimistic, type ReactNode } from "react";

import {
  InterestCheckboxGroup,
  SelectField,
  TextAreaField,
  TextField,
} from "@/features/profile/edit-profile-fields";
import {
  editProfileAction,
  initialEditProfileActionState,
} from "@/features/profile/edit-profile.action";
import { EditProfileSubmitButton } from "@/features/profile/edit-profile-submit-button";
import { ProfileConstantsCollection } from "@/features/profile/profile.constants";
import { ProfilePortrait } from "@/features/profile/profile-portrait";
import type { ViewerProfile } from "@/features/profile/profile.schemas";

interface EditProfileFormProps {
  profile: ViewerProfile;
}

interface ProfilePreview {
  age: number;
  city: string;
  jobTitle: string;
  name: string;
}

interface ProfileSectionProps {
  children: ReactNode;
  title: string;
}

interface LabeledOption {
  label: string;
  value: string;
}

const SECTION_CLASS_NAME =
  "space-y-4 rounded-[1.6rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_40px_-28px_rgba(30,41,59,0.32)]";

const getLabeledOptions = ({
  labels,
}: {
  labels: Record<string, string>;
}): LabeledOption[] => {
  return Object.entries(labels).map(([value, label]) => ({
    label,
    value,
  }));
};

const readPreviewField = ({
  formData,
  name,
}: {
  formData: FormData;
  name: string;
}): string => {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const ProfileSection = ({ children, title }: ProfileSectionProps) => {
  return (
    <section className={SECTION_CLASS_NAME}>
      <h2 className="text-brand-700 text-[0.65rem] font-bold tracking-[0.18em] uppercase">
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
};

export const EditProfileForm = ({ profile }: EditProfileFormProps) => {
  const router = useRouter();
  const field = ProfileConstantsCollection.ProfileFormField;
  const limit = ProfileConstantsCollection.FieldLimit;
  const cinema = profile.life?.cinema;
  const lifestyle = profile.life?.lifestyle;
  const cityLife = profile.life?.cityLife;
  const texture = profile.life?.texture;
  const [preview, showPreview] = useOptimistic(
    {
      age: profile.age,
      city: profile.location?.city || "",
      jobTitle: profile.jobTitle || "",
      name: profile.name,
    },
    (_current, nextPreview: ProfilePreview) => nextPreview,
  );
  const [state, formAction] = useActionState(
    async (
      previousState: typeof initialEditProfileActionState,
      formData: FormData,
    ) => {
      const nextAgeText = readPreviewField({ formData, name: field.Age });
      const nextAge = Number.parseInt(nextAgeText, 10);

      showPreview({
        age: Number.isInteger(nextAge) ? nextAge : profile.age,
        city: readPreviewField({ formData, name: field.City }),
        jobTitle: readPreviewField({ formData, name: field.JobTitle }),
        name: readPreviewField({ formData, name: field.Name }) || profile.name,
      });

      const nextState = await editProfileAction(previousState, formData);

      if (nextState.success) {
        router.refresh();
      }

      return nextState;
    },
    initialEditProfileActionState,
  );

  return (
    <form
      action={formAction}
      className="mx-auto max-w-6xl space-y-6 px-4 py-6 pb-32 lg:pt-8"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)] lg:items-start">
        <aside className="lg:sticky lg:top-20">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[1.8rem] bg-zinc-200">
            <ProfilePortrait
              name={preview.name}
              photoUrl={profile.photoUrl}
              fetchPriority="high"
              sizes="(min-width: 1024px) 20rem, 100vw"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-5 pt-20 pb-5">
              <p className="text-[0.65rem] font-bold tracking-[0.22em] text-white/70 uppercase">
                Your card
              </p>
              <h2 className="mt-1 text-3xl leading-[0.95] font-semibold tracking-[-0.045em] text-white">
                {preview.name}
              </h2>
              <p className="mt-2 text-sm text-white/80">
                {preview.age}
                {preview.jobTitle ? ` · ${preview.jobTitle}` : ""}
                {preview.city ? ` · ${preview.city}` : ""}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            This is the card other people see. Edit the fields, then save.
          </p>
        </aside>

        <div className="space-y-4">
          <ProfileSection title="Basics">
            <TextField
              defaultValue={profile.name}
              htmlFor={field.Name}
              label="Name"
              maxLength={limit.Name}
              name={field.Name}
              required
            />
            <TextField
              defaultValue={String(profile.age)}
              htmlFor={field.Age}
              label="Age"
              maxLength={3}
              name={field.Age}
              required
              type="number"
            />
            <SelectField
              defaultValue={profile.gender}
              htmlFor={field.Gender}
              label="Gender"
              name={field.Gender}
              required
              options={Object.values(ProfileConstantsCollection.UserGender).map(
                (gender) => ({
                  label: `${gender.charAt(0).toUpperCase()}${gender.slice(1)}`,
                  value: gender,
                }),
              )}
            />
            <InterestCheckboxGroup
              hint="Choose one or both. This is who appears in Discover."
              legend="Looking for"
              name={field.InterestedIn}
              options={Object.values(
                ProfileConstantsCollection.UserInterest,
              ).map((interest) => ({
                checked: profile.interestedIn.includes(interest),
                label: ProfileConstantsCollection.UserInterestLabel[interest],
                value: interest,
              }))}
            />
            <TextField
              defaultValue={profile.jobTitle}
              htmlFor={field.JobTitle}
              label="Job title"
              maxLength={limit.JobTitle}
              name={field.JobTitle}
            />
            <TextField
              defaultValue={profile.location?.city}
              htmlFor={field.City}
              label="City"
              maxLength={limit.City}
              name={field.City}
            />
            <TextField
              defaultValue={profile.phoneNumber}
              htmlFor={field.PhoneNumber}
              label="Phone"
              maxLength={limit.PhoneNumber}
              name={field.PhoneNumber}
              type="tel"
            />
            <div className="sm:col-span-2">
              <p className="text-sm font-semibold text-zinc-800">Email</p>
              <p className="mt-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-600">
                {profile.email}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Email is used to sign in and cannot be changed here.
              </p>
            </div>
          </ProfileSection>

          <ProfileSection title="About you">
            <div className="sm:col-span-2">
              <TextAreaField
                defaultValue={profile.bio}
                htmlFor={field.Bio}
                label="Bio"
                maxLength={limit.Bio}
                name={field.Bio}
                rows={5}
              />
            </div>
          </ProfileSection>

          <ProfileSection title="Cinema">
            <TextField
              defaultValue={cinema?.comfortMovie}
              htmlFor={field.ComfortMovie}
              label="Comfort movie"
              maxLength={limit.ComfortMovie}
              name={field.ComfortMovie}
            />
            <TextField
              defaultValue={cinema?.currentlyWatching}
              htmlFor={field.CurrentlyWatching}
              label="Currently watching"
              maxLength={limit.CurrentlyWatching}
              name={field.CurrentlyWatching}
            />
            <div className="sm:col-span-2">
              <SelectField
                defaultValue={cinema?.movieNightStyle}
                htmlFor={field.MovieNightStyle}
                label="Movie night"
                name={field.MovieNightStyle}
                options={getLabeledOptions({
                  labels: ProfileConstantsCollection.MovieNightStyleLabel,
                })}
              />
            </div>
          </ProfileSection>

          <ProfileSection title="Lifestyle">
            <SelectField
              defaultValue={lifestyle?.weekdayPace}
              htmlFor={field.WeekdayPace}
              label="Weekday pace"
              name={field.WeekdayPace}
              options={getLabeledOptions({
                labels: ProfileConstantsCollection.WeekdayPaceLabel,
              })}
            />
            <SelectField
              defaultValue={lifestyle?.sleepWindow}
              htmlFor={field.SleepWindow}
              label="Sleep"
              name={field.SleepWindow}
              options={getLabeledOptions({
                labels: ProfileConstantsCollection.SleepWindowLabel,
              })}
            />
            <SelectField
              defaultValue={lifestyle?.socialBattery}
              htmlFor={field.SocialBattery}
              label="Social battery"
              name={field.SocialBattery}
              options={getLabeledOptions({
                labels: ProfileConstantsCollection.SocialBatteryLabel,
              })}
            />
            <SelectField
              defaultValue={lifestyle?.homeEnergy}
              htmlFor={field.HomeEnergy}
              label="Home"
              name={field.HomeEnergy}
              options={getLabeledOptions({
                labels: ProfileConstantsCollection.HomeEnergyLabel,
              })}
            />
            <div className="sm:col-span-2">
              <TextAreaField
                defaultValue={lifestyle?.sundayRitual}
                htmlFor={field.SundayRitual}
                label="Sunday ritual"
                maxLength={limit.SundayRitual}
                name={field.SundayRitual}
              />
            </div>
          </ProfileSection>

          <ProfileSection title="City life">
            <SelectField
              defaultValue={cityLife?.noiseComfort}
              htmlFor={field.NoiseComfort}
              label="Noise"
              name={field.NoiseComfort}
              options={getLabeledOptions({
                labels: ProfileConstantsCollection.NoiseComfortLabel,
              })}
            />
            <SelectField
              defaultValue={cityLife?.foodCourage}
              htmlFor={field.FoodCourage}
              label="Food"
              name={field.FoodCourage}
              options={getLabeledOptions({
                labels: ProfileConstantsCollection.FoodCourageLabel,
              })}
            />
            <div className="sm:col-span-2">
              <TextField
                defaultValue={cityLife?.cityTheyMiss}
                htmlFor={field.CityTheyMiss}
                label="City you miss"
                maxLength={limit.CityTheyMiss}
                name={field.CityTheyMiss}
              />
            </div>
          </ProfileSection>

          <ProfileSection title="The rest">
            <TextAreaField
              defaultValue={texture?.firstDateSetting}
              htmlFor={field.FirstDateSetting}
              label="An evening"
              maxLength={limit.FirstDateSetting}
              name={field.FirstDateSetting}
            />
            <TextAreaField
              defaultValue={texture?.conversationFuel}
              htmlFor={field.ConversationFuel}
              label="Conversation fuel"
              maxLength={limit.ConversationFuel}
              name={field.ConversationFuel}
            />
            <TextField
              defaultValue={texture?.currentlyObsessed}
              htmlFor={field.CurrentlyObsessed}
              label="Obsessed with"
              maxLength={limit.CurrentlyObsessed}
              name={field.CurrentlyObsessed}
            />
            <TextField
              defaultValue={texture?.offscreenHobby}
              htmlFor={field.OffscreenHobby}
              label="Offscreen"
              maxLength={limit.OffscreenHobby}
              name={field.OffscreenHobby}
            />
            <TextField
              defaultValue={texture?.playlistWeather}
              htmlFor={field.PlaylistWeather}
              label="Playlist weather"
              maxLength={limit.PlaylistWeather}
              name={field.PlaylistWeather}
            />
            <SelectField
              defaultValue={texture?.familyOrbit}
              htmlFor={field.FamilyOrbit}
              label="Family"
              name={field.FamilyOrbit}
              options={getLabeledOptions({
                labels: ProfileConstantsCollection.FamilyOrbitLabel,
              })}
            />
          </ProfileSection>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto mx-auto flex max-w-6xl flex-col items-center gap-2">
          {state.message ? (
            <p
              role={state.success ? "status" : "alert"}
              className={
                state.success
                  ? "rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800"
                  : "rounded-full bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700"
              }
            >
              {state.message}
            </p>
          ) : null}
          <EditProfileSubmitButton
            idleLabel="Update profile"
            pendingLabel="Saving…"
          />
        </div>
      </div>
    </form>
  );
};

/*
 * Learning notes
 *
 * React 19 `useActionState` and `useOptimistic`
 * - Saving the profile is a form Action. `useOptimistic` updates the preview
 *   card immediately; a failed Express PATCH restores the previous name and
 *   details when the Action finishes.
 *
 * React 18.2 comparison
 * - React 18 usually copied form values into local state, then rolled them
 *   back in a `catch` after `fetch`.
 */
