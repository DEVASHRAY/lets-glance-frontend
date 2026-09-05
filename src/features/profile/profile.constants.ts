enum ProfileLoadOutcome {
  Failure = "failure",
  NotFound = "not-found",
  Success = "success",
  Unauthorized = "unauthorized",
}

enum UserGender {
  Female = "female",
  Male = "male",
  Other = "other",
}

enum UserInterest {
  Female = "female",
  Male = "male",
}

const UserInterestLabel = {
  [UserInterest.Female]: "Women",
  [UserInterest.Male]: "Men",
} satisfies Record<UserInterest, string>;

enum MovieNightStyle {
  CouchRewatch = "couch-rewatch",
  CrowdedFirstDay = "crowded-first-day",
  SilentSubtitles = "silent-subtitles",
  TheatreInterval = "theatre-interval",
}

enum WeekdayPace {
  NightShiftBrain = "night-shift-brain",
  PackedCalendar = "packed-calendar",
  SlowMorning = "slow-morning",
  SplitShift = "split-shift",
}

enum SocialBattery {
  CrowdFirst = "crowd-first",
  OneOnOne = "one-on-one",
  QuietHome = "quiet-home",
  SmallCircle = "small-circle",
}

enum HomeEnergy {
  AlwaysSomeoneOver = "always-someone-over",
  EmptyFlatPeace = "empty-flat-peace",
  HotelMode = "hotel-mode",
  PlantsAndGuests = "plants-and-guests",
}

enum NoiseComfort {
  HonkingOkay = "honking-okay",
  NeedQuietBlock = "need-quiet-block",
  RainOnWindowOnly = "rain-on-window-only",
}

enum FoodCourage {
  HomeCookAlways = "home-cook-always",
  Mixed = "mixed",
  ReservationOnly = "reservation-only",
  StreetStallFirst = "street-stall-first",
}

enum FamilyOrbit {
  ChosenFamily = "chosen-family",
  FarButWarm = "far-but-warm",
  SameBuilding = "same-building",
  WeeklyCall = "weekly-call",
}

enum SleepWindow {
  DawnPerson = "dawn-person",
  MidnightOil = "midnight-oil",
  SplitSleep = "split-sleep",
  WheneverTheWorkEnds = "whenever-the-work-ends",
}

const MovieNightStyleLabel = {
  [MovieNightStyle.CouchRewatch]: "Rewatching a comfort movie at home",
  [MovieNightStyle.CrowdedFirstDay]: "A new release with a lively crowd",
  [MovieNightStyle.SilentSubtitles]: "Watching quietly with subtitles",
  [MovieNightStyle.TheatreInterval]: "A relaxed cinema trip with snacks",
} satisfies Record<MovieNightStyle, string>;

const WeekdayPaceLabel = {
  [WeekdayPace.NightShiftBrain]: "Most active late at night",
  [WeekdayPace.PackedCalendar]: "A packed schedule most days",
  [WeekdayPace.SlowMorning]: "A slow start to the day",
  [WeekdayPace.SplitShift]: "A workday split into two parts",
} satisfies Record<WeekdayPace, string>;

const SocialBatteryLabel = {
  [SocialBattery.CrowdFirst]: "A lively event with lots of people",
  [SocialBattery.OneOnOne]: "One-on-one time",
  [SocialBattery.QuietHome]: "A quiet evening at home",
  [SocialBattery.SmallCircle]: "A small group of close friends",
} satisfies Record<SocialBattery, string>;

const HomeEnergyLabel = {
  [HomeEnergy.AlwaysSomeoneOver]: "Someone is always over",
  [HomeEnergy.EmptyFlatPeace]: "Empty flat is the point",
  [HomeEnergy.HotelMode]: "Lives like a suitcase",
  [HomeEnergy.PlantsAndGuests]: "Plants, and you can stay",
} satisfies Record<HomeEnergy, string>;

const NoiseComfortLabel = {
  [NoiseComfort.HonkingOkay]: "City noise is fine",
  [NoiseComfort.NeedQuietBlock]: "Needs a quiet block",
  [NoiseComfort.RainOnWindowOnly]: "Only rain is allowed",
} satisfies Record<NoiseComfort, string>;

const FoodCourageLabel = {
  [FoodCourage.HomeCookAlways]: "Will cook instead",
  [FoodCourage.Mixed]: "Depends on the week",
  [FoodCourage.ReservationOnly]: "Reservation, or not going",
  [FoodCourage.StreetStallFirst]: "Street stall first",
} satisfies Record<FoodCourage, string>;

const FamilyOrbitLabel = {
  [FamilyOrbit.ChosenFamily]: "Chosen family",
  [FamilyOrbit.FarButWarm]: "Far, still warm",
  [FamilyOrbit.SameBuilding]: "Family in the same building",
  [FamilyOrbit.WeeklyCall]: "Weekly family call",
} satisfies Record<FamilyOrbit, string>;

const SleepWindowLabel = {
  [SleepWindow.DawnPerson]: "Up with the light",
  [SleepWindow.MidnightOil]: "Midnight oil",
  [SleepWindow.SplitSleep]: "Sleeps in two pieces",
  [SleepWindow.WheneverTheWorkEnds]: "Sleeps when the work ends",
} satisfies Record<SleepWindow, string>;

enum ProfileUpdateOutcome {
  Failure = "failure",
  Success = "success",
  Unauthorized = "unauthorized",
}

enum ProfileFormField {
  Age = "age",
  Bio = "bio",
  City = "city",
  CityTheyMiss = "cityTheyMiss",
  ComfortMovie = "comfortMovie",
  ConversationFuel = "conversationFuel",
  CurrentlyObsessed = "currentlyObsessed",
  CurrentlyWatching = "currentlyWatching",
  FamilyOrbit = "familyOrbit",
  FirstDateSetting = "firstDateSetting",
  FoodCourage = "foodCourage",
  Gender = "gender",
  HomeEnergy = "homeEnergy",
  InterestedIn = "interestedIn",
  JobTitle = "jobTitle",
  MovieNightStyle = "movieNightStyle",
  Name = "name",
  NoiseComfort = "noiseComfort",
  OffscreenHobby = "offscreenHobby",
  PhoneNumber = "phoneNumber",
  PlaylistWeather = "playlistWeather",
  SleepWindow = "sleepWindow",
  SocialBattery = "socialBattery",
  SundayRitual = "sundayRitual",
  WeekdayPace = "weekdayPace",
}

const FieldLimit = {
  Bio: 500,
  City: 80,
  CityTheyMiss: 80,
  ComfortMovie: 80,
  ConversationFuel: 200,
  CurrentlyObsessed: 120,
  CurrentlyWatching: 120,
  FirstDateSetting: 200,
  JobTitle: 80,
  Name: 50,
  OffscreenHobby: 80,
  PhoneNumber: 20,
  PlaylistWeather: 80,
  SundayRitual: 200,
};

export const ProfileConstantsCollection = {
  FamilyOrbit,
  FamilyOrbitLabel,
  FieldLimit,
  FoodCourage,
  FoodCourageLabel,
  HomeEnergy,
  HomeEnergyLabel,
  MovieNightStyle,
  MovieNightStyleLabel,
  NoiseComfort,
  NoiseComfortLabel,
  ProfileFormField,
  ProfileLoadOutcome,
  ProfileUpdateOutcome,
  SleepWindow,
  SleepWindowLabel,
  SocialBattery,
  SocialBatteryLabel,
  UserGender,
  UserInterest,
  UserInterestLabel,
  WeekdayPace,
  WeekdayPaceLabel,
};
