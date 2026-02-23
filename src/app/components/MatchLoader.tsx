import { useEffect, useState } from "react";
import { Loader2, ArrowLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import {
  fetchMatchRoster,
  fetchTeamMatches,
  searchTeams,
  MatchListItem,
  MatchRoster,
  RosterPlayer,
  TeamRoster,
  TeamSearchResult,
} from "../services/matchService";
import { getMatches, getSavedTeam, saveTeam, clearSavedTeam } from "../services/storageService";
import { Player } from "./PlayerSetup";

interface MatchLoaderProps {
  onRosterLoaded: (myTeam: TeamRoster, matchId?: string, opponentName?: string, matchDate?: string, competition?: string) => void;
  onManualEntry: (initialPlayers?: Player[]) => void;
  onShowStats: () => void;
}

type LoaderView = "team" | "matches" | "direct";

function RosterList({ players }: { players: RosterPlayer[] }) {
  if (players.length === 0) {
    return <p className="text-sm text-gray-500">Žádní hráči.</p>;
  }
  return (
    <div className="max-h-64 overflow-y-auto space-y-1">
      {players.map((p, i) => (
        <div key={i} className="flex items-center gap-3 p-2 bg-white border rounded text-sm">
          <span className="font-mono w-8 text-right">{p.number}</span>
          <span className="flex-1">{p.name}</span>
          {p.birthYear && <span className="text-gray-400">{p.birthYear}</span>}
        </div>
      ))}
    </div>
  );
}

const EMPTY_ROSTER_ERROR = "Soupisky jsou prázdné. Utkání možná ještě nemá zveřejněnou soupisku.";

function RosterError({
  error,
  lastPlayers,
  onUseLastRoster,
}: {
  error: string;
  lastPlayers?: Player[];
  onUseLastRoster: () => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-red-600">{error}</p>
      {error === EMPTY_ROSTER_ERROR && lastPlayers && (
        <Button variant="outline" size="sm" onClick={onUseLastRoster}>
          Použít soupisku z posledního zápasu
        </Button>
      )}
    </div>
  );
}

function MatchListRow({
  match,
  loading,
  isPast,
  onClick,
}: {
  match: MatchListItem;
  loading: boolean;
  isPast: boolean;
  onClick: () => void;
}) {
  const label =
    match.homeTeam && match.awayTeam
      ? `${match.homeTeam} — ${match.awayTeam}`
      : `Zápas #${match.matchId}`;

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full flex items-center justify-between p-3 border rounded disabled:opacity-50 text-left transition-colors ${
        isPast
          ? "bg-gray-50 hover:bg-gray-100 text-gray-500"
          : "bg-white hover:bg-gray-50"
      }`}
    >
      <div>
        <div className={`font-medium text-sm ${isPast ? "text-gray-500" : ""}`}>{label}</div>
        {match.date && <div className="text-xs text-gray-400">{match.date}</div>}
      </div>
      {loading ? (
        <Loader2 className="size-4 animate-spin text-gray-400 shrink-0" />
      ) : (
        <ChevronRight className={`size-4 shrink-0 ${isPast ? "text-gray-300" : "text-gray-400"}`} />
      )}
    </button>
  );
}

function sortMatchList(matches: MatchListItem[]): MatchListItem[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const withDate = matches.filter((m) => m.dateIso);
  const withoutDate = matches.filter((m) => !m.dateIso);

  const upcoming = withDate.filter((m) => new Date(m.dateIso!) >= now);
  const past = withDate.filter((m) => new Date(m.dateIso!) < now);

  upcoming.sort((a, b) => new Date(a.dateIso!).getTime() - new Date(b.dateIso!).getTime());
  past.sort((a, b) => new Date(b.dateIso!).getTime() - new Date(a.dateIso!).getTime());

  return [...upcoming, ...past, ...withoutDate];
}

export function MatchLoader({ onRosterLoaded, onManualEntry, onShowStats }: MatchLoaderProps) {
  const lastPlayers = getMatches()[0]?.players?.map((p) => ({
    ...p,
    goals: 0,
    assists: 0,
    plus: 0,
    minus: 0,
    plusMinus: 0,
  }));

  const [view, setView] = useState<LoaderView>("team");

  // Team search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TeamSearchResult[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Team match list state
  const [selectedTeamName, setSelectedTeamName] = useState("");
  const [selectedCompetition, setSelectedCompetition] = useState<string | undefined>(undefined);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [matchList, setMatchList] = useState<MatchListItem[] | null>(null);

  // Roster loading state
  const [pendingMatchDate, setPendingMatchDate] = useState<string | undefined>(undefined);
  const [loadingMatchId, setLoadingMatchId] = useState<string | null>(null);
  const [loadingDirect, setLoadingDirect] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);

  // Direct match ID entry
  const [directMatchId, setDirectMatchId] = useState("");

  // Loaded roster
  const [roster, setRoster] = useState<MatchRoster | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<"home" | "away">("home");

  // Debounced team search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      setSearchError(null);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    const timeout = setTimeout(async () => {
      const result = await searchTeams(searchQuery);
      setSearchLoading(false);
      if (result.ok) {
        setSearchResults(result.data);
      } else {
        setSearchResults(null);
        setSearchError(result.error);
      }
    }, 400);
    return () => {
      clearTimeout(timeout);
      setSearchLoading(false);
    };
  }, [searchQuery]);

  // Auto-load saved team on mount
  useEffect(() => {
    const saved = getSavedTeam();
    if (saved) {
      setLoadingTeam(true);
      setSelectedTeamName(saved.teamName);
      setSelectedCompetition(saved.competition);
      fetchTeamMatches(saved.teamId).then((result) => {
        setLoadingTeam(false);
        if (result.ok) {
          setMatchList(sortMatchList(result.data));
          setView("matches");
        } else {
          setTeamError(result.error);
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTeamSelect = async (teamId: string, teamName: string, competition?: string) => {
    if (loadingTeam) return;
    setLoadingTeam(true);
    setTeamError(null);
    setSelectedTeamName(teamName);
    setSelectedCompetition(competition);
    saveTeam({ teamId, teamName, competition });

    const result = await fetchTeamMatches(teamId);
    setLoadingTeam(false);

    if (result.ok) {
      setMatchList(sortMatchList(result.data));
      setView("matches");
    } else {
      setTeamError(result.error);
    }
  };

  const handleChangeTeam = () => {
    clearSavedTeam();
    setMatchList(null);
    setSelectedCompetition(undefined);
    setRosterError(null);
    setTeamError(null);
    setView("team");
  };

  const handleMatchSelect = async (matchId: string) => {
    if (loadingMatchId) return;
    setLoadingMatchId(matchId);
    setRosterError(null);
    setPendingMatchDate(matchList?.find((m) => m.matchId === matchId)?.dateIso);

    const result = await fetchMatchRoster(matchId);
    setLoadingMatchId(null);

    if (result.ok) {
      setRoster(result.data);
      setSelectedTeam("home");
    } else {
      setRosterError(result.error);
    }
  };

  const handleLoadDirect = async () => {
    if (!directMatchId.trim() || loadingDirect) return;
    setLoadingDirect(true);
    setRosterError(null);

    const result = await fetchMatchRoster(directMatchId.trim());
    setLoadingDirect(false);

    if (result.ok) {
      setRoster(result.data);
      setSelectedTeam("home");
    } else {
      setRosterError(result.error);
    }
  };

  const handleUseRoster = () => {
    if (!roster) return;
    const team = selectedTeam === "home" ? roster.home : roster.away;
    const opponent = selectedTeam === "home" ? roster.away : roster.home;
    onRosterLoaded(team, roster.matchId, opponent.teamName, pendingMatchDate, selectedCompetition);
  };

  const selectedName = roster
    ? selectedTeam === "home"
      ? roster.home.teamName
      : roster.away.teamName
    : "";

  const goBack = () => {
    setView("team");
    setRosterError(null);
    setTeamError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {!roster && (
          <Card>
            <CardHeader>
              <CardTitle>Načíst soupisku z Českého florbalu (FIS)</CardTitle>
              {view === "matches" && selectedCompetition && (
                <p className="text-sm text-gray-500">{selectedCompetition}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500 bg-gray-100 rounded-md px-3 py-2 leading-relaxed">
                Vyhledejte svůj tým podle názvu a vyberte zápas — soupiska se načte automaticky. Nemáte internet nebo chybí soupiska? Zadejte hráče ručně.
              </p>
              {/* loading saved team */}
              {view === "team" && loadingTeam && (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                  <Loader2 className="size-4 animate-spin" />
                  Načítám zápasy…
                </div>
              )}

              {/* TEAM SEARCH */}
              {view === "team" && !loadingTeam && (
                <>
                  <div className="space-y-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                      <Input
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Hledat tým…"
                        className="pl-9"
                        disabled={loadingTeam}
                      />
                      {searchLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-gray-400" />
                      )}
                    </div>
                  </div>

                  {searchError && (
                    <p className="text-sm text-gray-500">{searchError}</p>
                  )}

                  {searchResults && searchResults.length > 0 && (
                    <div className="max-h-72 overflow-y-auto space-y-1">
                      {searchResults.map((t) => (
                        <button
                          key={t.teamId}
                          onClick={() => handleTeamSelect(t.teamId, t.teamName, t.competition)}
                          disabled={loadingTeam}
                          className="w-full flex items-center justify-between p-3 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 text-left transition-colors"
                        >
                          <div>
                            <div className="font-medium text-sm">{t.teamName}</div>
                            <div className="text-xs text-gray-500">
                              {[t.competition, t.city].filter(Boolean).join(" · ")}
                            </div>
                          </div>
                          {loadingTeam && t.teamName === selectedTeamName ? (
                            <Loader2 className="size-4 animate-spin text-gray-400 shrink-0" />
                          ) : (
                            <ChevronRight className="size-4 text-gray-400 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {teamError && <p className="text-sm text-red-600">{teamError}</p>}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 px-0"
                    onClick={() => { setView("direct"); setRosterError(null); }}
                  >
                    Zadat ID zápasu přímo
                  </Button>
                </>
              )}

              {/* MATCH LIST */}
              {view === "matches" && matchList && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{selectedTeamName}</div>
                      <div className="text-xs text-gray-500">
                        {[selectedCompetition, `${matchList.length} zápasů`].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleChangeTeam} className="shrink-0 text-gray-500">
                      Změnit tým
                    </Button>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-1">
                    {matchList.map((match) => {
                      const isPast = !!match.dateIso && new Date(match.dateIso) < new Date();
                      return (
                        <MatchListRow
                          key={match.matchId}
                          match={match}
                          loading={loadingMatchId === match.matchId}
                          isPast={isPast}
                          onClick={() => handleMatchSelect(match.matchId)}
                        />
                      );
                    })}
                  </div>

                  {rosterError && (
                    <RosterError
                      error={rosterError}
                      lastPlayers={lastPlayers}
                      onUseLastRoster={() => onManualEntry(lastPlayers)}
                    />
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 px-0"
                    onClick={() => { setView("direct"); setRosterError(null); }}
                  >
                    Zadat ID zápasu přímo
                  </Button>
                </>
              )}

              {/* DIRECT MATCH ID */}
              {view === "direct" && (
                <>
                  <Button variant="ghost" size="sm" onClick={goBack}>
                    <ArrowLeft className="size-4" />
                    Zpět
                  </Button>

                  <div className="space-y-1">
                    <Label htmlFor="matchId">ID zápasu</Label>
                    <div className="flex gap-2">
                      <Input
                        id="matchId"
                        inputMode="numeric"
                        value={directMatchId}
                        onChange={(e) => setDirectMatchId(e.target.value)}
                        placeholder="např. 1227627"
                        onKeyDown={(e) => e.key === "Enter" && handleLoadDirect()}
                        disabled={loadingDirect}
                      />
                      <Button
                        onClick={handleLoadDirect}
                        disabled={!directMatchId.trim() || loadingDirect}
                      >
                        {loadingDirect ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Načítám…
                          </>
                        ) : (
                          "Načíst"
                        )}
                      </Button>
                    </div>
                  </div>
                  {rosterError && (
                    <RosterError
                      error={rosterError}
                      lastPlayers={lastPlayers}
                      onUseLastRoster={() => onManualEntry(lastPlayers)}
                    />
                  )}
                </>
              )}

              <Button variant="ghost" className="w-full" onClick={() => onManualEntry()}>
                Zadat ručně
              </Button>
              {lastPlayers && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => onManualEntry(lastPlayers)}
                >
                  Použít soupisku z posledního zápasu
                </Button>
              )}
              <Button variant="ghost" className="w-full text-gray-500" onClick={onShowStats}>
                Přehled statistik
              </Button>
            </CardContent>
          </Card>
        )}

        {roster && (
          <Card>
            <CardHeader>
              <CardTitle>Vyberte svůj tým</CardTitle>
              {selectedCompetition && (
                <p className="text-sm text-gray-500">{selectedTeamName} · {selectedCompetition}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500 bg-gray-100 rounded-md px-3 py-2 leading-relaxed">
                Vyberte záložku s vaším týmem (domácí nebo hosté) a potvrďte klepnutím na tlačítko níže.
              </p>
              <Button variant="ghost" size="sm" onClick={() => setRoster(null)}>
                <ArrowLeft className="size-4" />
                Zpět na výběr zápasu
              </Button>
              <Tabs
                value={selectedTeam}
                onValueChange={(v) => setSelectedTeam(v as "home" | "away")}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="home" className="flex-1">
                    {roster.home.teamName}
                  </TabsTrigger>
                  <TabsTrigger value="away" className="flex-1">
                    {roster.away.teamName}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="home">
                  <RosterList players={roster.home.players} />
                </TabsContent>
                <TabsContent value="away">
                  <RosterList players={roster.away.players} />
                </TabsContent>
              </Tabs>

              <Button className="w-full" onClick={handleUseRoster}>
                Použít soupisku — {selectedName}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
