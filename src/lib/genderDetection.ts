const FEMALE_NAMES = new Set([
  // German/Austrian
  "anna","maria","laura","lisa","sarah","sophie","julia","lena","hannah","emma",
  "lea","mia","nina","jana","alina","lara","clara","elena","melanie","nadine",
  "stefanie","christina","katharina","alexandra","bianca","daniela","jessica","sandra",
  "sabrina","tamara","vanessa","jennifer","michaela","verena","denise","jasmin",
  "carina","manuela","martina","petra","silvia","claudia","monika","amelie","charlotte","luisa",
  // English
  "emily","ashley","samantha","brittany","taylor","olivia","madison",
  "chloe","grace","natalie","victoria","amber","nicole","rachel","megan","kate",
  "rebecca","amanda","stephanie","heather","lauren","bella","sophia","ava","isabella",
  "harper","ella","scarlett","aria","lily","zoe","riley","michelle","tiffany",
  // Turkish
  "ayse","fatma","emine","hatice","zeynep","elif","merve","busra","esra","tugba",
  "selin","dilara","nur","buse","ceren","irem","gamze","gizem","pinar","derya","defne",
  // Spanish/Portuguese
  "carmen","lucia","paula","sofia","valentina","camila","gabriela",
  "andrea","ana","rosa","adriana","diana","carolina","alejandra",
  // Arabic
  "fatima","aisha","maryam","layla","sara","nour","hana","amira","dina","rania",
  "yasmin","lina","maya","nadia","salma","sana","zahra","khadija","reem","zara","dana",
  // Slavic
  "natasha","katya","olga","tatiana","irina","svetlana","marina",
  "daria","polina","anastasia","kristina","milena","ivana","jelena","vera",
]);

const MALE_NAMES = new Set([
  // German/Austrian
  "max","lukas","leon","paul","jonas","felix","david","moritz","julian","niklas",
  "tobias","daniel","stefan","michael","thomas","alexander","christian","florian",
  "markus","patrick","dominik","sebastian","bernhard","wolfgang","franz","josef",
  "andreas","martin","peter","hans","karl","helmut","gerhard","manfred","manuel","ben","tim",
  // English
  "james","john","robert","william","richard","joseph",
  "charles","christopher","matthew","anthony","mark","donald","steven","andrew",
  "brian","joshua","kevin","jason","ryan","jacob","ethan","noah","liam","mason",
  "logan","alex","tyler","brandon","dylan","connor","luke","jack","owen","chris",
  // Turkish
  "mehmet","mustafa","ahmet","ali","hasan","ibrahim","murat","ismail","osman",
  "yusuf","emre","burak","serkan","volkan","cem","baris","arda","kerem","kaan","can","hakan",
  // Arabic
  "mohammed","muhammad","ahmed","omar","khalid","hassan","hussein","saif","amir",
  "tariq","youssef","karim","nabil","bilal","hamza","abdullah","nasser","samir","walid","faisal","rami",
  // Slavic
  "ivan","vladimir","sergei","dmitri","alexei","nikola","milan","dragan","boris",
  "andrej","marko","pavel","oleg","nikolai",
]);

const FEMALE_ENDINGS = ["a","e","ie","ine","elle","ette","ina","iya"];
const MALE_ENDINGS = ["o","us","er","on","an","en","ard","ald"];

export function detectGender(fullName: string | null | undefined): "male" | "female" | "unknown" {
  if (!fullName) return "unknown";

  const cleaned = fullName
    .replace(/[\u{1F600}-\u{1F9FF}]/gu, "")
    .replace(/[|📷📸🇷🇺🇦🇹🇩🇪]/g, "")
    .trim();
  const parts = cleaned.split(/\s+/);
  if (!parts[0]) return "unknown";
  const firstName = parts[0].toLowerCase().replace(/[^a-zäöüß]/g, "");
  if (!firstName || firstName.length < 2) return "unknown";

  if (FEMALE_NAMES.has(firstName)) return "female";
  if (MALE_NAMES.has(firstName)) return "male";

  for (const ending of FEMALE_ENDINGS) {
    if (firstName.endsWith(ending) && firstName.length > ending.length + 1) return "female";
  }
  for (const ending of MALE_ENDINGS) {
    if (firstName.endsWith(ending) && firstName.length > ending.length + 1) return "male";
  }

  return "unknown";
}

export function categorizeFollow(followerCount: number | null, isPrivate: boolean): string {
  if (isPrivate) return "private";
  if (followerCount && followerCount > 100000) return "celebrity";
  if (followerCount && followerCount > 10000) return "influencer";
  return "normal";
}
