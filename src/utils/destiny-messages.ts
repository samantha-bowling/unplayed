
// Array of destiny/fate-themed messages to display when a game is selected
export const destinyMessages = [
  "The fates have spoken, and they choose:",
  "Destiny has decreed your next adventure:",
  "The cosmic dice have rolled, revealing:",
  "The gaming gods have chosen:",
  "Your digital destiny awaits with:",
  "The universe has aligned to bring you:",
  "Fate has guided you to:",
  "The ancient algorithms have decided:",
  "Your gaming stars have aligned for:",
  "The prophecy foretells you shall play:",
  "The digital oracle reveals:",
  "Your predetermined path leads to:",
  "The wheel of fortune stops on:",
  "Destiny's thread weaves toward:",
  "The cosmic lottery selects:",
  "Your next chapter begins with:",
  "The gaming constellation points to:",
  "Fate's hand guides you to:",
  "The universe whispers your choice:",
  "Your destined adventure is:",
  "The digital winds carry you to:",
  "Your gaming karma leads to:",
  "The sacred randomness chooses:",
  "Your predetermined quest:",
  "The cosmic forces converge on:"
];

export const getRandomDestinyMessage = (): string => {
  const randomIndex = Math.floor(Math.random() * destinyMessages.length);
  return destinyMessages[randomIndex];
};
