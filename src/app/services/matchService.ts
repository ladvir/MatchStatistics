export interface RosterPlayer {
  number: string;
  name: string;
  birthYear?: string;
  position?: "U" | "O" | "G";
}

export interface TeamRoster {
  teamName: string;
  players: RosterPlayer[];
}

export interface MatchRoster {
  matchId: string;
  home: TeamRoster;
  away: TeamRoster;
}

export type FetchRosterResult =
  | { ok: true; data: MatchRoster }
  | { ok: false; error: string };

export interface MatchListItem {
  matchId: string;
  homeTeam?: string;
  awayTeam?: string;
  date?: string;    // display string, e.g. "SO, 27. 9. 1. kolo"
  dateIso?: string; // ISO date string for sorting
}

export type FetchMatchListResult =
  | { ok: true; data: MatchListItem[] }
  | { ok: false; error: string };

export interface TeamSearchResult {
  teamId: string;
  teamName: string;
  competition?: string;
  city?: string;
}

export type FetchTeamSearchResult =
  | { ok: true; data: TeamSearchResult[] }
  | { ok: false; error: string };

function parseTeamDiv(div: Element, fallbackName: string): TeamRoster {
  // Determine team name
  let teamName = '';

  const heading = div.querySelector('h2, h3, h4, caption');
  if (heading?.textContent?.trim()) {
    teamName = heading.textContent.trim();
  }

  if (!teamName) {
    const id = div.id;
    if (id) {
      const trigger =
        document.querySelector(`[href="#${id}"]`) ??
        document.querySelector(`[data-bs-target="#${id}"]`) ??
        document.querySelector(`[data-target="#${id}"]`);
      if (trigger?.textContent?.trim()) {
        teamName = trigger.textContent.trim();
      }
    }
  }

  if (!teamName) {
    teamName = fallbackName;
  }

  // Parse players from table rows
  const rows = div.querySelectorAll('table tbody tr');
  const players: RosterPlayer[] = [];

  rows.forEach((row) => {
    const cells = Array.from(row.querySelectorAll('td'));
    if (cells.length < 2) return;

    const number = cells[0].textContent?.trim() ?? '';

    // Find name cell: first cell containing an <a> tag (player profile link)
    const nameCell = cells.find((c) => c.querySelector('a'));
    const name = nameCell
      ? (nameCell.querySelector('a')?.textContent?.trim() ?? nameCell.textContent?.trim() ?? '')
      : '';
    if (!name) return;

    // Birth year: last cell whose text looks like a 4-digit year
    const yearCell = [...cells].reverse().find((c) => /^\d{4}$/.test(c.textContent?.trim() ?? ''));
    const birthYear = yearCell?.textContent?.trim() || undefined;

    // Position: cell with exactly "U", "O" or "G"
    const positionCell = cells.find((c) => /^[UOG]$/.test(c.textContent?.trim() ?? ''));
    const position = positionCell?.textContent?.trim() as RosterPlayer['position'] | undefined;

    players.push({ number, name, birthYear, position });
  });

  return { teamName, players };
}

function parseRosterHtml(html: string, matchId: string): MatchRoster {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const homeDiv = doc.querySelector('#tab-domaci');
  const awayDiv = doc.querySelector('#tab-hoste');

  if (!homeDiv && !awayDiv) {
    throw new Error('Nepodařilo se najít soupisky v HTML. Zkontrolujte ID utkání.');
  }

  const home = homeDiv
    ? parseTeamDiv(homeDiv, 'Domácí')
    : { teamName: 'Domácí', players: [] };
  const away = awayDiv
    ? parseTeamDiv(awayDiv, 'Hosté')
    : { teamName: 'Hosté', players: [] };

  if (home.players.length === 0 && away.players.length === 0) {
    throw new Error(
      'Soupisky jsou prázdné. Utkání možná ještě nemá zveřejněnou soupisku.',
    );
  }

  return { matchId, home, away };
}

function extractSideTeamName(matchDiv: Element, sideClass: string): string | undefined {
  const sideEl = matchDiv.querySelector(`.${sideClass}`);
  if (!sideEl) return undefined;

  // Try common class-name patterns for team name
  const selectors = [
    '.Match-teamName',
    '[class*="teamName"]',
    '[class*="TeamName"]',
    '[class*="team-name"]',
    '[class*="TeamLabel"]',
    '[class*="team_name"]',
  ];
  for (const sel of selectors) {
    const text = sideEl.querySelector(sel)?.textContent?.trim();
    if (text && text.length > 1) return text;
  }

  // Fall back: first leaf element with 3–60 chars (likely a team name)
  for (const el of sideEl.querySelectorAll('*')) {
    if (el.children.length === 0) {
      const text = el.textContent?.trim();
      if (text && text.length >= 3 && text.length <= 60) return text;
    }
  }

  return undefined;
}

// Parses Czech short date "d. m." and infers year from current season (±9 months from today).
function parseCzechShortDate(text: string): string | undefined {
  const m = text.match(/(\d{1,2})\.\s*(\d{1,2})\./);
  if (!m) return undefined;
  const day = parseInt(m[1]);
  const month = parseInt(m[2]);
  if (day < 1 || day > 31 || month < 1 || month > 12) return undefined;

  const now = new Date();
  const nineMonths = 9 * 30 * 24 * 3600 * 1000;
  const candidates = [-1, 0, 1]
    .map(offset => new Date(now.getFullYear() + offset, month - 1, day))
    .filter(d => Math.abs(d.getTime() - now.getTime()) <= nineMonths);
  if (candidates.length === 0) return undefined;
  candidates.sort((a, b) => Math.abs(a.getTime() - now.getTime()) - Math.abs(b.getTime() - now.getTime()));
  return candidates[0].toISOString();
}

function parseTeamMatchesHtml(html: string): MatchListItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const matchDivs = doc.querySelectorAll('div.Match');
  if (matchDivs.length === 0) {
    throw new Error('Nepodařilo se najít žádné zápasy. Zkontrolujte ID týmu.');
  }

  const matches: MatchListItem[] = [];

  matchDivs.forEach((div) => {
    const link = div.querySelector('a[href*="/match/detail/"]');
    if (!link) return;

    const href = link.getAttribute('href') ?? '';
    const idMatch = href.match(/\/match\/detail\/[^/]+\/(\d+)/);
    if (!idMatch) return;

    const matchId = idMatch[1];

    const homeTeam = extractSideTeamName(div, 'Match-leftContent');
    const awayTeam = extractSideTeamName(div, 'Match-rightContent');

    // Try <time> element, then .Match-date, then any leaf with "d. m." pattern
    const timeEl = div.querySelector('time');
    let date = timeEl?.textContent?.trim() ?? div.querySelector('.Match-date, .date')?.textContent?.trim();
    if (!date) {
      for (const el of div.querySelectorAll('*')) {
        if (el.children.length === 0) {
          const text = el.textContent?.trim() ?? '';
          if (/\d{1,2}\.\s*\d{1,2}\./.test(text)) { date = text; break; }
        }
      }
    }
    const dateIso = timeEl?.getAttribute('datetime')
      ? new Date(timeEl.getAttribute('datetime')!).toISOString()
      : parseCzechShortDate(date ?? '');

    matches.push({
      matchId,
      homeTeam: homeTeam || undefined,
      awayTeam: awayTeam || undefined,
      date: date || undefined,
      dateIso: dateIso || undefined,
    });
  });

  if (matches.length === 0) {
    throw new Error('Nepodařilo se načíst zápasy ze stránky. Zkontrolujte ID týmu.');
  }

  return matches;
}

export async function fetchTeamMatches(teamId: string): Promise<FetchMatchListResult> {
  if (!/^\d+$/.test(teamId)) {
    return { ok: false, error: 'Neplatné ID týmu — zadejte pouze číslo.' };
  }

  let html: string;
  try {
    const response = await fetch(`/api/florbal/team/detail/matches/${teamId}`);
    if (!response.ok) {
      return { ok: false, error: `Server vrátil chybu ${response.status}.` };
    }
    html = await response.text();
  } catch {
    return { ok: false, error: 'Nepodařilo se připojit k ceskyflorbal.cz.' };
  }

  try {
    const data = parseTeamMatchesHtml(html);
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Neznámá chyba při parsování.',
    };
  }
}

export async function fetchMatchRoster(matchId: string): Promise<FetchRosterResult> {
  if (!/^\d+$/.test(matchId)) {
    return { ok: false, error: 'Neplatné ID utkání — zadejte pouze číslo.' };
  }

  let html: string;
  try {
    const response = await fetch(`/api/florbal/match/detail/roster/${matchId}`);
    if (!response.ok) {
      return { ok: false, error: `Server vrátil chybu ${response.status}.` };
    }
    html = await response.text();
  } catch {
    return { ok: false, error: 'Nepodařilo se připojit k ceskyflorbal.cz.' };
  }

  try {
    const data = parseRosterHtml(html, matchId);
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Neznámá chyba při parsování.',
    };
  }
}

function parseTeamSearchHtml(html: string): TeamSearchResult[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const results: TeamSearchResult[] = [];

  doc.querySelectorAll('a[href*="/team/detail/overview/"]').forEach((link) => {
    const href = link.getAttribute('href') ?? '';
    const idMatch = href.match(/\/team\/detail\/overview\/(\d+)/);
    if (!idMatch) return;

    const teamName = link.textContent?.trim() ?? '';
    if (!teamName) return;

    const row = link.closest('tr');
    const cells = row ? Array.from(row.querySelectorAll('td')) : [];
    const competition = cells[1]?.textContent?.trim() || undefined;
    const city = cells[5]?.textContent?.trim() || undefined;

    results.push({ teamId: idMatch[1], teamName, competition, city });
  });

  return results;
}

export async function searchTeams(query: string): Promise<FetchTeamSearchResult> {
  if (query.trim().length < 2) {
    return { ok: false, error: 'Zadejte alespoň 2 znaky.' };
  }

  let html: string;
  try {
    const params = new URLSearchParams({ 'filter[search]': query.trim(), itemsPerPage: '50' });
    const response = await fetch(`/api/florbal/directory/teams/?${params}`);
    if (!response.ok) {
      return { ok: false, error: `Server vrátil chybu ${response.status}.` };
    }
    html = await response.text();
  } catch {
    return { ok: false, error: 'Nepodařilo se připojit k ceskyflorbal.cz.' };
  }

  try {
    const data = parseTeamSearchHtml(html);
    if (data.length === 0) {
      return { ok: false, error: 'Žádné týmy nebyly nalezeny.' };
    }
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Neznámá chyba při parsování.',
    };
  }
}
