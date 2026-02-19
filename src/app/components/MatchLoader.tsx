import { useState } from "react";
import { Loader2, ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import {
  fetchMatchRoster,
  fetchTeamMatches,
  MatchListItem,
  MatchRoster,
  RosterPlayer,
  TeamRoster,
} from "../services/matchService";
import { getMatches } from "../services/storageService";
import { Player } from "./PlayerSetup";

interface MatchLoaderProps {
  onRosterLoaded: (myTeam: TeamRoster, matchId?: string) => void;
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

function MatchListRow({
  match,
  loading,
  onClick,
}: {
  match: MatchListItem;
  loading: boolean;
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
      className="w-full flex items-center justify-between p-3 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 text-left transition-colors"
    >
      <div>
        <div className="font-medium text-sm">{label}</div>
        {match.date && <div className="text-xs text-gray-500">{match.date}</div>}
      </div>
      {loading ? (
        <Loader2 className="size-4 animate-spin text-gray-400 shrink-0" />
      ) : (
        <ChevronRight className="size-4 text-gray-400 shrink-0" />
      )}
    </button>
  );
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

  // Team entry state
  const [teamId, setTeamId] = useState("");
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [matchList, setMatchList] = useState<MatchListItem[] | null>(null);

  // Roster loading state
  const [loadingMatchId, setLoadingMatchId] = useState<string | null>(null);
  const [loadingDirect, setLoadingDirect] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);

  // Direct match ID entry
  const [directMatchId, setDirectMatchId] = useState("");

  // Loaded roster
  const [roster, setRoster] = useState<MatchRoster | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<"home" | "away">("home");

  const handleLoadTeam = async () => {
    if (!teamId.trim() || loadingTeam) return;
    setLoadingTeam(true);
    setTeamError(null);

    const result = await fetchTeamMatches(teamId.trim());
    setLoadingTeam(false);

    if (result.ok) {
      setMatchList(result.data);
      setView("matches");
    } else {
      setTeamError(result.error);
    }
  };

  const handleMatchSelect = async (matchId: string) => {
    if (loadingMatchId) return;
    setLoadingMatchId(matchId);
    setRosterError(null);

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
    onRosterLoaded(team, roster.matchId);
  };

  const selectedName = roster
    ? selectedTeam === "home"
      ? roster.home.teamName
      : roster.away.teamName
    : "";

  const goBack = () => {
    setView("team");
    setRosterError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {!roster && (
          <Card>
            <CardHeader>
              <CardTitle>Načíst soupisku ze ČFbU</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* TEAM ENTRY */}
              {view === "team" && (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="teamId">ID týmu</Label>
                    <div className="flex gap-2">
                      <Input
                        id="teamId"
                        inputMode="numeric"
                        value={teamId}
                        onChange={(e) => setTeamId(e.target.value)}
                        placeholder="např. 41217"
                        onKeyDown={(e) => e.key === "Enter" && handleLoadTeam()}
                        disabled={loadingTeam}
                      />
                      <Button
                        onClick={handleLoadTeam}
                        disabled={!teamId.trim() || loadingTeam}
                      >
                        {loadingTeam ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Načítám…
                          </>
                        ) : (
                          "Načíst zápasy"
                        )}
                      </Button>
                    </div>
                  </div>
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
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={goBack}>
                      <ArrowLeft className="size-4" />
                      Zpět
                    </Button>
                    <span className="text-sm text-gray-500">{matchList.length} zápasů</span>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-1">
                    {matchList.map((match) => (
                      <MatchListRow
                        key={match.matchId}
                        match={match}
                        loading={loadingMatchId === match.matchId}
                        onClick={() => handleMatchSelect(match.matchId)}
                      />
                    ))}
                  </div>

                  {rosterError && <p className="text-sm text-red-600">{rosterError}</p>}

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
                  {rosterError && <p className="text-sm text-red-600">{rosterError}</p>}
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
            </CardHeader>
            <CardContent className="space-y-4">
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
