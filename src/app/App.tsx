import { useState } from "react";
import { Player } from "./components/PlayerSetup";
import { PlayerSetup } from "./components/PlayerSetup";
import { MatchTracking } from "./components/MatchTracking";
import { MatchLoader } from "./components/MatchLoader";
import { TeamRoster } from "./services/matchService";

type AppView = "loader" | "setup" | "tracking";

function rosterToPlayers(team: TeamRoster): Player[] {
  return team.players.map((p, i) => ({
    id: `${i}-${p.name}`,
    number: p.number,
    name: p.name,
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

  const handleRosterLoaded = (team: TeamRoster) => {
    setPlayers(rosterToPlayers(team));
    setView("setup");
  };

  const handleManualEntry = () => {
    setPlayers([]);
    setView("setup");
  };

  const handleStartMatch = (p: Player[]) => {
    setPlayers(p);
    setView("tracking");
  };

  const handleBackFromTracking = () => {
    setView("setup");
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
        <MatchTracking initialPlayers={players} onBack={handleBackFromTracking} />
      )}
    </div>
  );
}
