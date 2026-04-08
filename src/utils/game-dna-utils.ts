
import type { UserMetrics } from '@/hooks/use-user-metrics';
import type { GenreStat } from '@/hooks/use-genre-stats';

export interface DNADimension {
  key: string;
  label: string;
  score: number; // 0-100
  icon: string; // lucide icon name
  stat: string; // key stat driving the score
  description: string; // witty one-liner
}

export interface DNAProfile {
  dimensions: DNADimension[];
  archetype: string;
  archetypeDescription: string;
  surprisingStat: string;
}

// --- Scoring functions (pure, no DB) ---

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(v)));
}

function calcCollector(totalGames: number): { score: number; stat: string; desc: string } {
  // Average Steam user owns ~10-15 games. 200+ is huge. 500+ is extreme.
  const score = clamp(Math.min(100, (totalGames / 400) * 100));
  const stat = `${totalGames} games owned`;
  const tiers: [number, string][] = [
    [90, "Your library has its own gravitational pull"],
    [70, "Steam sales fear your wallet"],
    [50, "A respectable collection in the making"],
    [25, "Quality over quantity, right?"],
    [0,  "Just getting started — the world awaits"],
  ];
  const desc = tiers.find(([t]) => score >= t)?.[1] ?? tiers[tiers.length - 1][1];
  return { score, stat, desc };
}

function calcExplorer(genreStats: GenreStat[]): { score: number; stat: string; desc: string } {
  if (!genreStats.length) return { score: 0, stat: '0 genres', desc: 'No genre data yet' };
  const uniqueGenres = genreStats.length;
  // Shannon entropy for evenness
  const total = genreStats.reduce((s, g) => s + g.game_count, 0);
  if (total === 0) return { score: 0, stat: '0 genres', desc: 'No genre data yet' };
  const probs = genreStats.map(g => g.game_count / total).filter(p => p > 0);
  const entropy = -probs.reduce((s, p) => s + p * Math.log2(p), 0);
  const maxEntropy = Math.log2(uniqueGenres) || 1;
  const evenness = entropy / maxEntropy; // 0-1
  // Combine: genre count (60%) + evenness (40%)
  const genreScore = Math.min(1, uniqueGenres / 20) * 60 + evenness * 40;
  const score = clamp(genreScore);
  const stat = `${uniqueGenres} genres explored`;
  const tiers: [number, string][] = [
    [85, "A true renaissance gamer — you play it all"],
    [60, "Adventurous and open-minded"],
    [35, "You know what you like"],
    [0,  "Loyal to your favorites"],
  ];
  const desc = tiers.find(([t]) => score >= t)?.[1] ?? tiers[tiers.length - 1][1];
  return { score, stat, desc };
}

function calcCompletionist(metrics: UserMetrics): { score: number; stat: string; desc: string } {
  const { playedGames, totalPlaytimeHours, totalGames } = metrics;
  if (!playedGames || !totalGames) return { score: 0, stat: '0h avg', desc: 'Nothing played yet' };
  const avgHoursPerPlayed = totalPlaytimeHours / playedGames;
  // 20h avg = ~100 score
  const score = clamp((avgHoursPerPlayed / 20) * 100);
  const stat = `${avgHoursPerPlayed.toFixed(1)}h avg per game`;
  const tiers: [number, string][] = [
    [85, "Every achievement unlocked, every secret found"],
    [60, "You finish what you start"],
    [35, "You give games a fair shot"],
    [0,  "So many games, so little time"],
  ];
  const desc = tiers.find(([t]) => score >= t)?.[1] ?? tiers[tiers.length - 1][1];
  return { score, stat, desc };
}

function calcHoarder(metrics: UserMetrics): { score: number; stat: string; desc: string } {
  const { unplayedGames, totalGames, averageDustScore } = metrics;
  if (!totalGames) return { score: 0, stat: '0% unplayed', desc: 'Nothing to hoard yet' };
  const unplayedPct = (unplayedGames / totalGames) * 100;
  // Combine unplayed % (70%) + avg dust score normalized to 0-100 (30%)
  const dustNorm = Math.min(100, (averageDustScore / 80) * 100);
  const score = clamp(unplayedPct * 0.7 + dustNorm * 0.3);
  const stat = `${Math.round(unplayedPct)}% unplayed`;
  const tiers: [number, string][] = [
    [85, "Digital dragon sitting on a pile of games"],
    [60, "Your backlog has a backlog"],
    [35, "A manageable pile of shame"],
    [0,  "Impressively disciplined"],
  ];
  const desc = tiers.find(([t]) => score >= t)?.[1] ?? tiers[tiers.length - 1][1];
  return { score, stat, desc };
}

interface SpendingData {
  totalSpentCents: number;
  freeGames: number;
  paidGames: number;
  totalGames: number;
  totalPlaytimeHours: number;
}

function calcBargainHunter(spending: SpendingData): { score: number; stat: string; desc: string } {
  const { totalSpentCents, freeGames, paidGames, totalGames, totalPlaytimeHours } = spending;
  if (!totalGames) return { score: 0, stat: '$0 spent', desc: 'No spending data yet' };
  const freePct = (freeGames / totalGames) * 100;
  const avgPricePaid = paidGames > 0 ? totalSpentCents / paidGames / 100 : 0;
  const costPerHour = totalPlaytimeHours > 0 ? (totalSpentCents / 100) / totalPlaytimeHours : 999;
  // Lower avg price = higher score, more free games = higher score, lower cost/hour = higher
  const priceScore = clamp(100 - (avgPricePaid / 30) * 100); // $30 avg = 0
  const freeScore = clamp(freePct * 2); // 50% free = 100
  const cphScore = clamp(100 - (costPerHour / 5) * 100); // $5/hr = 0
  const score = clamp(priceScore * 0.4 + freeScore * 0.3 + cphScore * 0.3);
  const stat = `$${(totalSpentCents / 100).toFixed(0)} total · $${costPerHour.toFixed(2)}/hr`;
  const tiers: [number, string][] = [
    [85, "Steam sale sniper — never pays full price"],
    [60, "Savvy shopper with an eye for deals"],
    [35, "You treat yourself sometimes"],
    [0,  "Money is no object"],
  ];
  const desc = tiers.find(([t]) => score >= t)?.[1] ?? tiers[tiers.length - 1][1];
  return { score, stat, desc };
}

interface GameAgeData {
  avgYearsOld: number;
  vintagePct: number; // % of games 11+ years old
}

function calcRetroGamer(ageData: GameAgeData): { score: number; stat: string; desc: string } {
  const { avgYearsOld, vintagePct } = ageData;
  // 10 years avg = high. vintage % directly contributes.
  const ageScore = clamp((avgYearsOld / 12) * 100);
  const vintageScore = clamp(vintagePct * 1.5);
  const score = clamp(ageScore * 0.5 + vintageScore * 0.5);
  const stat = `${avgYearsOld.toFixed(1)}yr avg age · ${Math.round(vintagePct)}% vintage`;
  const tiers: [number, string][] = [
    [85, "A connoisseur of gaming history"],
    [60, "Classics and modern mix nicely"],
    [35, "Mostly keeping current"],
    [0,  "Bleeding edge only"],
  ];
  const desc = tiers.find(([t]) => score >= t)?.[1] ?? tiers[tiers.length - 1][1];
  return { score, stat, desc };
}

// --- Archetype detection ---

function detectArchetype(dims: DNADimension[]): { name: string; description: string } {
  const byScore = [...dims].sort((a, b) => b.score - a.score);
  const top = byScore.slice(0, 2).map(d => d.key);
  const topSet = new Set(top);

  if (topSet.has('collector') && topSet.has('hoarder'))
    return { name: 'The Digital Dragon', description: "Amasses games like treasure, plays them... eventually." };
  if (topSet.has('collector') && topSet.has('explorer'))
    return { name: 'The Thoughtful Collector', description: "Curates a vast, diverse library with intention." };
  if (topSet.has('completionist') && topSet.has('explorer'))
    return { name: 'The Adventurer', description: "Dives deep into every genre with passion." };
  if (topSet.has('completionist') && topSet.has('bargain'))
    return { name: 'The Efficient Gamer', description: "Gets maximum value from every purchase." };
  if (topSet.has('retro') && topSet.has('completionist'))
    return { name: 'The Nostalgia Seeker', description: "Revisits and masters the classics." };
  if (topSet.has('bargain') && topSet.has('hoarder'))
    return { name: 'The Sale Hoarder', description: "Never misses a deal, rarely hits play." };
  if (topSet.has('retro') && topSet.has('explorer'))
    return { name: 'The Historian', description: "Explores gaming's rich past across all genres." };
  if (topSet.has('collector') && topSet.has('completionist'))
    return { name: 'The Dedicated Gamer', description: "Owns many, plays most, finishes plenty." };

  // Fallback based on single highest
  const highest = byScore[0];
  const fallbacks: Record<string, { name: string; description: string }> = {
    collector: { name: 'The Collector', description: "Building an empire, one game at a time." },
    explorer: { name: 'The Explorer', description: "No genre is off limits." },
    completionist: { name: 'The Completionist', description: "100% or bust." },
    hoarder: { name: 'The Hoarder', description: "Your backlog is legendary." },
    bargain: { name: 'The Bargain Hunter', description: "Patience pays — literally." },
    retro: { name: 'The Retro Gamer', description: "They don't make 'em like they used to." },
  };
  return fallbacks[highest.key] || { name: 'The Gamer', description: "A unique blend of gaming styles." };
}

// --- Surprising stat ---

function findSurprisingStat(metrics: UserMetrics, genreStats: GenreStat[], spending: SpendingData): string {
  const candidates: string[] = [];
  if (metrics.unplayedGames > 50)
    candidates.push(`You own ${metrics.unplayedGames} games you've never launched`);
  if (metrics.totalPlaytimeHours > 1000)
    candidates.push(`You've logged ${Math.round(metrics.totalPlaytimeHours)} hours — that's ${Math.round(metrics.totalPlaytimeHours / 24)} full days of gaming`);
  if (spending.freeGames > 20)
    candidates.push(`${spending.freeGames} of your games were free — nice hustle`);
  if (genreStats.length > 15)
    candidates.push(`Your library spans ${genreStats.length} different genres`);
  if (metrics.cleanScore > 80)
    candidates.push(`Your Clean Score of ${metrics.cleanScore} puts you in elite territory`);
  if (spending.totalSpentCents > 100000)
    candidates.push(`You've invested over $${(spending.totalSpentCents / 100).toFixed(0)} in your collection`);

  return candidates.length
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : `You own ${metrics.totalGames} games across ${genreStats.length} genres`;
}

// --- Main builder ---

export interface GameDNAInput {
  metrics: UserMetrics;
  genreStats: GenreStat[];
  spendingMetrics: {
    total_spent_cents: number;
    free_games: number;
    paid_games: number;
    total_games: number;
  } | null;
  gameAgeData: GameAgeData;
}

export function buildGameDNA(input: GameDNAInput): DNAProfile {
  const { metrics, genreStats, spendingMetrics, gameAgeData } = input;

  const spending: SpendingData = {
    totalSpentCents: spendingMetrics?.total_spent_cents ?? 0,
    freeGames: spendingMetrics?.free_games ?? 0,
    paidGames: spendingMetrics?.paid_games ?? 0,
    totalGames: metrics.totalGames,
    totalPlaytimeHours: metrics.totalPlaytimeHours,
  };

  const collector = calcCollector(metrics.totalGames);
  const explorer = calcExplorer(genreStats);
  const completionist = calcCompletionist(metrics);
  const hoarder = calcHoarder(metrics);
  const bargain = calcBargainHunter(spending);
  const retro = calcRetroGamer(gameAgeData);

  const dimensions: DNADimension[] = [
    { key: 'collector', label: 'Collector', score: collector.score, icon: 'Library', stat: collector.stat, description: collector.desc },
    { key: 'explorer', label: 'Explorer', score: explorer.score, icon: 'Compass', stat: explorer.stat, description: explorer.desc },
    { key: 'completionist', label: 'Completionist', score: completionist.score, icon: 'Trophy', stat: completionist.stat, description: completionist.desc },
    { key: 'hoarder', label: 'Hoarder', score: hoarder.score, icon: 'PackageOpen', stat: hoarder.stat, description: hoarder.desc },
    { key: 'bargain', label: 'Bargain Hunter', score: bargain.score, icon: 'BadgeDollarSign', stat: bargain.stat, description: bargain.desc },
    { key: 'retro', label: 'Retro Gamer', score: retro.score, icon: 'Gamepad2', stat: retro.stat, description: retro.desc },
  ];

  const archetype = detectArchetype(dimensions);
  const surprisingStat = findSurprisingStat(metrics, genreStats, spending);

  return {
    dimensions,
    archetype: archetype.name,
    archetypeDescription: archetype.description,
    surprisingStat,
  };
}
