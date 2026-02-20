import { useState } from "react";
import { Player } from "./components/PlayerSetup";
import { PlayerSetup } from "./components/PlayerSetup";
import { MatchTracking } from "./components/MatchTracking";
import { MatchLoader } from "./components/MatchLoader";
import { StatsOverview } from "./components/StatsOverview";
import { TeamRoster } from "./services/matchService";
import { CompletedMatch, saveMatch } from "./services/storageService";

type AppView = "loader" | "setup" | "tracking" | "stats";

function rosterToPlayers(team: TeamRoster): Player[] {
  return team.players.map((p, i) => ({
    id: `${i}-${p.name}`,
    number: p.number,
    name: p.name,
    shots: 0,
    goals: 0,
    assists: 0,
    plus: 0,
    minus: 0,
    plusMinus: 0,
  }));
}

export default function App() {
  const [view, setView] = useState<AppView>("loader");
  const [players, setPlayers] = useState<Player[]>([]);
  const [matchLabel, setMatchLabel] = useState("");
  const [currentMatchStorageId, setCurrentMatchStorageId] = useState("");

  const handleRosterLoaded = (team: TeamRoster, matchId?: string, opponentName?: string) => {
    setPlayers(rosterToPlayers(team));
    const label = opponentName
      ? `${team.teamName} vs ${opponentName}`
      : matchId
      ? `Zápas #${matchId}`
      : "";
    setMatchLabel(label);
    setView("setup");
  };

  const handleManualEntry = (initialPlayers?: Player[]) => {
    setPlayers(initialPlayers ?? []);
    setMatchLabel("");
    setView("setup");
  };

  const handleStartMatch = (p: Player[]) => {
    setPlayers(p);
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
          onStartMatch={handleStartMatch}
          onBack={handleBackFromSetup}
        />
      )}
      {view === "tracking" && (
        <MatchTracking initialPlayers={players} matchLabel={matchLabel} onFinish={handleFinishMatch} />
      )}
      {view === "stats" && (
        <StatsOverview onNewMatch={() => setView("loader")} />
      )}
    </div>
  );
}
