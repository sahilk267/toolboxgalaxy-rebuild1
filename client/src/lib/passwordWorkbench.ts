import { secureRandomInt } from "@/lib/secureRandom";

/**
 * Local password generation and heuristic auditing.
 * Generation uses crypto.getRandomValues via unbiased secureRandomInt.
 * Do not infer breach status or resistance to an actual attack from these heuristics.
 */
export type PasswordOptions = {
  length: number;
  count: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
};

export const PASSWORD_DEFAULTS: PasswordOptions = {
  length: 18, count: 1, uppercase: true, lowercase: true,
  numbers: true, symbols: true, excludeAmbiguous: true,
};

const CHAR_GROUPS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%&*?",
} as const;
const AMBIGUOUS = "O0Il1|";
const WORDS = (
  "acorn amber anchor apple apricot arctic arrow artist atlas autumn azure bacon badge bamboo banana "
  + "banner basil beacon beach beaver berry biscuit blossom boat breeze brick brook bubble button cabin "
  + "cactus candle canyon captain carrot castle cedar cherry circle cloud clover coast cocoa comet coral "
  + "cotton creek crystal daisy dancer dawn desert dolphin dragon dream drift eagle earth echo ember engine "
  + "falcon feather field fiesta firefly flag flamingo flower forest fox fresh frost garden ginger glacier "
  + "globe golden grape green harbor harmony hazel honey horizon island ivory jade jasmine jelly journey "
  + "juniper kettle kiwi lantern lavender lemon library lightning linen lion lotus lunar maple marble meadow "
  + "melon melody meteor midnight mint mirror mist mountain mosaic mustard nectar nest nickel night novel "
  + "oasis ocean olive orange orchid otter owl panda paper pebble pepper picnic pine planet plum pocket "
  + "pond prairie prism pumpkin quartz rabbit radar rainbow raven reef river rocket rose ruby sail salmon "
  + "sandal satin scarlet sea shell sherbet silver sky slate snow solar song sparrow spice spring spruce "
  + "star stone storm summer sunrise sunset swift table tango teacup temple thistle thunder tiger timber "
  + "tinsel toast tomato torch trail treasure tulip velvet violet voyage walnut water willow winter wren "
  + "yarrow yellow yogurt zebra zenith zephyr"
).split(/\s+/).filter(Boolean);

export function passwordCharset(options: PasswordOptions): { groups: string[]; pool: string } {
  const groups: string[] = [];
  for (const key of ["uppercase", "lowercase", "numbers", "symbols"] as const) {
    if (!options[key]) continue;
    let chars: string = CHAR_GROUPS[key];
    if (options.excludeAmbiguous) chars = Array.from(chars).filter(c => !AMBIGUOUS.includes(c)).join("");
    if (chars) groups.push(chars);
  }
  return { groups, pool: groups.join("") };
}

export function passwordConfigError(options: PasswordOptions): string | null {
  if (!Number.isSafeInteger(options.length) || options.length < 12 || options.length > 128)
    return "Password length must be 12–128 characters.";
  if (!Number.isSafeInteger(options.count) || options.count < 1 || options.count > 20)
    return "Generate between 1 and 20 passwords.";
  const { groups } = passwordCharset(options);
  if (!groups.length) return "Select at least one character category.";
  if (groups.length > options.length) return "Length must cover every selected character group.";
  return null;
}

export function generatePasswords(options: PasswordOptions): string[] {
  const error = passwordConfigError(options);
  if (error) throw new Error(error);
  const { pool, groups } = passwordCharset(options);
  return Array.from({ length: options.count }, () => {
    const password = groups.map(group => group[secureRandomInt(0, group.length - 1)]);
    while (password.length < options.length) password.push(pool[secureRandomInt(0, pool.length - 1)]);
    for (let i = password.length - 1; i > 0; i--) {
      const j = secureRandomInt(0, i);
      [password[i], password[j]] = [password[j], password[i]];
    }
    return password.join("");
  });
}

export function generatedPasswordEntropy(options: PasswordOptions): number {
  const { pool } = passwordCharset(options);
  return pool ? options.length * Math.log2(pool.length) : 0;
}

export function generatePassphrases(wordCount: number, count: number, separator: "-" | " " | "."): string[] {
  if (!Number.isSafeInteger(wordCount) || wordCount < 6 || wordCount > 12)
    throw new Error("Passphrase must contain 6–12 words.");
  if (!Number.isSafeInteger(count) || count < 1 || count > 20)
    throw new Error("Generate between 1 and 20 phrases.");
  if (!["-", " ", "."].includes(separator)) throw new Error("Unsupported separator.");
  return Array.from({ length: count }, () =>
    Array.from({ length: wordCount }, () => WORDS[secureRandomInt(0, WORDS.length - 1)]).join(separator));
}

export const PASSPHRASE_WORDLIST_SIZE = WORDS.length;
export function generatedPassphraseEntropy(count: number): number { return count * Math.log2(WORDS.length); }

const COMMON = new Set([
  "password","password1","password123","password1234","qwerty","qwerty123",
  "123456","12345678","123456789","1234567890","123456789123","abc123",
  "admin","admin123","letmein","welcome","welcome123","iloveyou",
  "monkey","dragon","football","111111","123123","000000","passw0rd",
]);

export type PasswordAssessment = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  issues: string[];
  tips: string[];
  length: number;
};

export function assessPassword(value: string): PasswordAssessment {
  const length = Array.from(value).length;
  if (!length) return { score: 0, label: "Waiting", issues: [], tips: ["Enter a password to check it locally."], length: 0 };
  const lower = value.toLowerCase();
  const issues: string[] = [];
  const tips: string[] = [];
  const common = COMMON.has(lower) || /^(password|qwerty|admin|welcome|letmein|iloveyou)/i.test(value);
  if (common) issues.push("Starts with or matches an easily guessed password.");
  if (length < 12) issues.push("Shorter than the recommended 12-character baseline.");
  if (/^(.)\1{3,}$/.test(value)) issues.push("Mostly a single repeated character.");
  if (/(123456|abcdef|qwerty|asdfgh|098765|654321)/i.test(value)) issues.push("Contains a common keyboard or number sequence.");
  if (/^(?:\d{4,}|[a-z]{1,3}\d{4,})$/i.test(value)) issues.push("Simple digit or short-prefix pattern.");
  if (length >= 16 && !common && !issues.length) tips.push("Long, unique passwords are generally preferable; avoid reuse.");
  if (length < 16) tips.push("Consider a unique 16+ character random password or a long random passphrase.");
  tips.push("This local heuristic cannot check password reuse or known data breaches.");
  let score = length < 8 ? 0 : length < 12 ? 1 : length < 16 ? 2 : length < 24 ? 3 : 4;
  if (common) score = 0;
  else if (issues.some(i => i.includes("repeated"))) score = Math.min(score, 1);
  else if (issues.some(i => i.includes("sequence") || i.includes("pattern"))) score = Math.min(score, 2);
  const names = ["Very weak","Weak","Fair","Good","Stronger"] as const;
  return { score: score as PasswordAssessment["score"], label: names[score], issues, tips, length };
}
