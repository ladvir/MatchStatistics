import { useState } from "react";
import { Player } from "./components/PlayerSetup";
import { PlayerSetup } from "./components/PlayerSetup";
import { MatchTracking } from "./components/MatchTracking";
import { MatchLoader } from "./components/MatchLoader";
import { StatsOverview } from "./components/StatsOverview";
import { LandingPage } from "./components/LandingPage";
import { TeamRoster } from "./services/matchService";
import { CompletedMatch, saveMatch } from "./services/storageService";
import { Line, DEFAULT_LINES } from "./types";

type AppView = "landing" | "loader" | "setup" | "tracking" | "stats";

function rosterToPlayers(team: TeamRoster): Player[] {
  return team.players.map((p) => ({
    id: crypto.randomUUID(),
    number: p.number,
    name: p.name,
    position: p.position,
    role: p.position === "G" ? "goalkeeper" : undefined,
    lineId: undefined,
    shots: 0,
    goals: 0,
    assists: 0,
    plus: 0,
    minus: 0,
    plusMinus: 0,
  }));
}

export default function App() {
  const [view, setView] = useState<AppView>("landing");
  const [players, setPlayers] = useState<Player[]>([]);
  const [lines, setLines] = useState<Line[]>(DEFAULT_LINES);
  const [matchLabel, setMatchLabel] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [myTeamName, setMyTeamName] = useState("");
  const [myCompetition, setMyCompetition] = useState<string | undefined>(undefined);
  const [currentMatchStorageId, setCurrentMatchStorageId] = useState("");

  const handleRosterLoaded = (team: TeamRoster, matchId?: string, opponentName?: string, date?: string, competition?: string) => {
    setPlayers(rosterToPlayers(team));
    setLines(DEFAULT_LINES);
    const label = opponentName
      ? `${team.teamName} vs ${opponentName}`
      : matchId
      ? `Zápas #${matchId}`
      : "";
    setMatchLabel(label);
    setMatchDate(date ?? "");
    setMyTeamName(team.teamName);
    setMyCompetition(competition);
    setView("setup");
  };

  const handleManualEntry = (initialPlayers?: Player[]) => {
    setPlayers(initialPlayers ?? []);
    setLines(DEFAULT_LINES);
    setMatchLabel("");
    setMyTeamName("");
    setMyCompetition(undefined);
    setView("setup");
  };

  const handleStartMatch = (p: Player[], updatedLines: Line[]) => {
    setPlayers(p);
    setLines(updatedLines);
    setCurrentMatchStorageId(Date.now().toString());
    setView("tracking");
  };

  const handleFinishMatch = (
    finalPlayers: Player[],
    ourScore: number,
    opponentScore: number,
  ) => {
    const match: CompletedMatch = {
      id: currentMatchStorageId,
      date: new Date().toISOString(),
      label: matchLabel || new Date().toLocaleDateString("cs-CZ"),
      teamName: myTeamName || undefined,
      competition: myCompetition,
      ourScore,
      opponentScore,
      players: finalPlayers,
    };
    saveMatch(match);
    setView("stats");
  };

  const handleBackFromSetup = () => {
    setView("loader");
  };

  return (
    <div className="size-full">
      {view === "landing" && (
        <LandingPage
          onStart={() => setView("loader")}
          onShowStats={() => setView("stats")}
        />
      )}
      {view === "loader" && (
        <MatchLoader
          onRosterLoaded={handleRosterLoaded}
          onManualEntry={handleManualEntry}
          onShowStats={() => setView("stats")}
        />
      )}
      {view === "setup" && (
        <PlayerSetup
          initialPlayers={players}
          lines={lines}
          onStartMatch={handleStartMatch}
          onBack={handleBackFromSetup}
        />
      )}
      {view === "tracking" && (
        <MatchTracking
          initialPlayers={players}
          lines={lines}
          matchLabel={matchLabel}
          matchDate={matchDate}
          onFinish={handleFinishMatch}
        />
      )}
      {view === "stats" && (
        <StatsOverview onNewMatch={() => setView("loader")} />
      )}
    </div>
  );
}
