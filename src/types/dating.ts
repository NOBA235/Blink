export type PreferenceCategory = "activity" | "food" | "drink";

export interface PreferenceOption {
  id: string;
  label: string;
  category: PreferenceCategory;
  selected: boolean;
  iconName?: string;
  tagline?: string;
  accentBg?: string;
}

export interface DatePreferencesState {
  activities: string[];
  foods: string[];
  drinks: string[];
}

export interface ActivityCategoryItem {
  id: string;
  label: string;
  subtitle: string;
  icon: string;
  pastelBg: string;
}

export const DATE_ACTIVITIES: ActivityCategoryItem[] = [
  {
    id: "drinks",
    label: "Drinks",
    subtitle: "Cocktails & intimate speakeasies",
    icon: "wine",
    pastelBg: "#F6EFF7",
  },
  {
    id: "dining",
    label: "Dining",
    subtitle: "Candlelit dinners & cozy bistros",
    icon: "utensils",
    pastelBg: "#FDF2EC",
  },
  {
    id: "movie",
    label: "Movie",
    subtitle: "Indie theatres & rooftop cinema",
    icon: "film",
    pastelBg: "#EEF4FC",
  },
  {
    id: "live_music",
    label: "Live Music",
    subtitle: "Acoustic sets & jazz lounges",
    icon: "music",
    pastelBg: "#FDF0F4",
  },
  {
    id: "coffee_walk",
    label: "Stroll",
    subtitle: "Coffee walk & botanical parks",
    icon: "footprints",
    pastelBg: "#EEF5F0",
  },
  {
    id: "games",
    label: "Arcade & Games",
    subtitle: "Playful mini-golf & board cafes",
    icon: "gamepad-2",
    pastelBg: "#FDF6E2",
  },
];

export const FOOD_OPTIONS: string[] = [
  "Pizza",
  "Sushi",
  "Burgers",
  "Pasta",
  "Indian",
  "Desserts",
  "Tacos",
  "Thai",
  "Tapas",
  "Mediterranean",
];

export const DRINK_OPTIONS: string[] = [
  "Coffee",
  "Cocktails",
  "Wine",
  "Tea",
  "Mocktails",
  "Craft Beer",
  "Matcha",
  "Boba",
];

export const DEFAULT_DATE_PREFERENCES: DatePreferencesState = {
  activities: ["dining", "drinks"],
  foods: ["Pizza", "Sushi"],
  drinks: ["Coffee", "Cocktails"],
};
