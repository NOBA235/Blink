// MOCK: replace with real profile records from a backend. Identical content
// to the web app's data — this is plain data with no platform-specific code,
// so it ports over unchanged.

export type Prompt = { q: string; a: string };

export type Contestant = {
  id: string;
  name: string;
  age: number;
  location: string;
  photo: string;
  interests: string[];
  prompts: Prompt[];
  personalityQuestion: string;
  personalityAnswer: string;
  reveal: {
    profession: string;
    education: string;
    lifestyle: string[];
  };
};

export const INTERESTS = [
  "Live music", "Hiking", "Cooking", "True crime", "Board games", "Travel",
  "Yoga", "Coffee snob", "Dogs > everything", "Reading", "Gaming",
  "Thrifting", "Running", "Wine tasting", "Photography", "Stand-up comedy",
];

export const PROMPTS = [
  "My most questionable obsession is...",
  "My green flag is...",
  "You'll probably find me...",
];

export const CONTESTANT_POOL: Contestant[] = [
  {
    id: "c1",
    name: "Micah",
    age: 28,
    location: "Austin, TX",
    photo: "https://i.pravatar.cc/600?img=13",
    interests: ["Live music", "Cooking", "Thrifting"],
    prompts: [
      { q: "My most questionable obsession is...", a: "Alphabetizing my vinyl by mood, not artist." },
      { q: "You'll probably find me...", a: "Behind the bar, or in line for tacos." },
    ],
    personalityQuestion: "What's the most spontaneous thing you've ever done?",
    personalityAnswer: "Drove four hours for a taco truck that closed the week before. Ate a gas station burrito instead. Ten out of ten trip.",
    reveal: {
      profession: "Bartender & part-time musician",
      education: "Studied audio engineering",
      lifestyle: ["Night owl", "Always has a playlist ready", "Terrible plant parent"],
    },
  },
  {
    id: "c2",
    name: "Priya",
    age: 31,
    location: "Seattle, WA",
    photo: "https://i.pravatar.cc/600?img=47",
    interests: ["Travel", "True crime", "Photography"],
    prompts: [
      { q: "My green flag is...", a: "I will absolutely research the restaurant before we go." },
      { q: "You'll probably find me...", a: "Underwater or three episodes deep into a podcast." },
    ],
    personalityQuestion: "What's a skill you're weirdly proud of?",
    personalityAnswer: "I can identify most sharks by silhouette alone. It has come up on exactly two dates. Both went well.",
    reveal: {
      profession: "Marine biologist",
      education: "PhD in marine ecology",
      lifestyle: ["Early riser", "Owns too many houseplants", "Will talk about the ocean unprompted"],
    },
  },
  {
    id: "c3",
    name: "Theo",
    age: 26,
    location: "Chicago, IL",
    photo: "https://i.pravatar.cc/600?img=33",
    interests: ["Board games", "Reading", "Stand-up comedy"],
    prompts: [
      { q: "My most questionable obsession is...", a: "I have opinions about chess openings that nobody asked for." },
      { q: "My green flag is...", a: "I remember the small things you mention once." },
    ],
    personalityQuestion: "What's the last thing that made you laugh out loud?",
    personalityAnswer: "My roommate tried to assemble furniture 'without looking at the instructions, how hard can it be.' It was very hard.",
    reveal: {
      profession: "Architecture grad student",
      education: "Master's in architecture, in progress",
      lifestyle: ["Deeply into thrifted furniture", "Makes a mean cold brew", "Dry sense of humor"],
    },
  },
  {
    id: "c4",
    name: "Sam",
    age: 29,
    location: "Denver, CO",
    photo: "https://i.pravatar.cc/600?img=25",
    interests: ["Hiking", "Board games", "Cooking"],
    prompts: [
      { q: "You'll probably find me...", a: "On a trail by 7am, complaining about it by 7:15." },
      { q: "My green flag is...", a: "I bring snacks for everyone, unprompted." },
    ],
    personalityQuestion: "What's a small thing that instantly improves your day?",
    personalityAnswer: "Fresh bread out of the oven. I have made my neighbors deeply suspicious of how often this happens.",
    reveal: {
      profession: "Product designer, former ski instructor",
      education: "BFA in industrial design",
      lifestyle: ["Bakes bread most weekends", "Owns a genuinely alarming number of board games", "Chronic over-packer"],
    },
  },
];

export const BOT_JUDGE_POOL = [
  { name: "Ava", photo: "https://i.pravatar.cc/200?img=45" },
  { name: "Liam", photo: "https://i.pravatar.cc/200?img=51" },
  { name: "Noor", photo: "https://i.pravatar.cc/200?img=48" },
  { name: "Diego", photo: "https://i.pravatar.cc/200?img=59" },
];

export const AVATAR_PRESETS = [11, 5, 65, 20, 44, 68];
