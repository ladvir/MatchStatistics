import type { Player } from '../components/PlayerSetup';

const STORAGE_KEY = 'match-statistics-history';

export interface CompletedMatch {
  id: string;
  date: string; // ISO string
  label: string; // e.g. "Zápas #1227627"
  ourScore: number;
  opponentScore: number;
  players: Player[];
}

export function getMatches(): CompletedMatch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CompletedMatch[];
  } catch {
    return [];
  }
}

export function saveMatch(match: CompletedMatch): void {
  const matches = getMatches();
  const idx = matches.findIndex((m) => m.id === match.id);
  if (idx >= 0) {
    matches[idx] = match;
  } else {
    matches.unshift(match); // newest first
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
}

export function deleteMatch(id: string): void {
  const matches = getMatches().filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
}
