import { HeuristicItem } from './types';

export const NIELSEN_HEURISTICS: HeuristicItem[] = [
  { id: 1, name: "Visibility of system status", weight: 1.0, description: "The design should always keep users informed about what is going on." },
  { id: 2, name: "Match between system and real world", weight: 1.0, description: "The design should speak the users' language. Use words, phrases, and concepts familiar to the user." },
  { id: 3, name: "User control and freedom", weight: 1.2, description: "Users often perform actions by mistake. They need a clearly marked 'emergency exit' to leave the unwanted action." },
  { id: 4, name: "Consistency and standards", weight: 1.0, description: "Users should not have to wonder whether different words, situations, or actions mean the same thing." },
  { id: 5, name: "Error prevention", weight: 1.5, description: "Good error messages are important, but the best designs carefully prevent problems from occurring in the first place." },
  { id: 6, name: "Recognition rather than recall", weight: 1.0, description: "Minimize the user's memory load by making elements, actions, and options visible." },
  { id: 7, name: "Flexibility and efficiency of use", weight: 1.0, description: "Shortcuts — hidden from novice users — may speed up the interaction for the expert user." },
  { id: 8, name: "Aesthetic and minimalist design", weight: 0.8, description: "Interfaces should not contain information that is irrelevant or rarely needed." },
  { id: 9, name: "Help users recognize, diagnose, and recover from errors", weight: 1.2, description: "Error messages should be expressed in plain language (no error codes), precisely indicate the problem, and constructively suggest a solution." },
  { id: 10, name: "Help and documentation", weight: 0.8, description: "It’s best if the system doesn’t need any additional explanation. However, it may be necessary to provide documentation." }
];

export const WEIGHT_DESCRIPTION = "The Overall UX Score is a weighted average of all 10 Nielsen Heuristics. Critical factors like 'Error Prevention' and 'User Control' carry higher weights (1.5x and 1.2x respectively) because they impact the usability floor more significantly than 'Aesthetic Design' or 'Help/Documentation' (0.8x). Formula: Σ(Score * Weight) / ΣWeights.";

export const UI_UX_FUN_FACTS: string[] = [
  "Did you know... the term 'user experience' was coined by Don Norman at Apple in the early '90s?",
  "Did you know... 88% of online consumers won't return to a site after a bad experience?",
  "Did you know... the average human attention span is now just 8 seconds, making concise UI vital?",
  "Did you know... Hick's Law states decision time increases with the number of choices?",
  "Did you know... Fitts's Law explains why larger, closer targets are easier to click?",
  "Did you know... the 'Save' icon is a floppy disk, an object many users have never seen?",
  "Did you know... 'above the fold' is a newspaper term for content visible without scrolling?",
  "Did you know... good color usage can improve readership by 40% and comprehension by 70%?",
  "Did you know... rounded corners are easier for our brains to process than sharp ones?",
  "Did you know... the hamburger menu icon was designed for the Xerox Star back in 1981?"
];