import { useState } from "react";
import { Player } from "./PlayerSetup";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ChevronLeft, RotateCcw } from "lucide-react";

interface MatchTrackingProps {
  initialPlayers: Player[];
  onFinish: (players: Player[], ourScore: number, opponentScore: number) => void;
}

export function MatchTracking({ initialPlayers, onFinish }: MatchTrackingProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [ourScore, setOurScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [sortBy, setSortBy] = useState<"default" | "number" | "name">("default");

  const updatePlayerStat = (
    playerId: string,
    stat: "shots" | "goals" | "assists" | "plus" | "minus"
  ) => {
    setPlayers(
      players.map((p) => {
        if (p.id !== playerId) return p;
        
        const updated = { ...p, [stat]: p[stat] + 1 };
        
        // Přepočítat plusMinus
        if (stat === "plus" || stat === "minus") {
          updated.plusMinus = updated.plus - updated.minus;
        }
        
        return updated;
      })
    );
  };

  const resetStats = () => {
    setPlayers(
      players.map((p) => ({
        ...p,
        shots: 0,
        goals: 0,
        assists: 0,
        plus: 0,
        minus: 0,
        plusMinus: 0,
      }))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => onFinish(players, ourScore, opponentScore)}>
            <ChevronLeft className="size-4" />
          </Button>
          <h1 className="text-xl font-semibold">Průběh utkání</h1>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-gray-500"
            onClick={() => onFinish(players, ourScore, opponentScore)}
          >
            Přehled statistik
          </Button>
        </div>

        {/* Skóre */}
        <Card>
          <CardContent className="pt-6 relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setOurScore(0);
                setOpponentScore(0);
              }}
              className="absolute top-2 right-2 h-8 w-8"
              title="Resetovat skóre"
            >
              <RotateCcw className="size-4" />
            </Button>
            
            <div className="flex items-center justify-center gap-8">
              <button
                onClick={() => setOurScore(ourScore + 1)}
                className="text-center hover:bg-gray-50 rounded-lg p-4 transition-colors cursor-pointer"
              >
                <div className="text-4xl font-mono">{ourScore}</div>
                <div className="text-sm text-gray-600 mt-1">Náš tým</div>
              </button>
              
              <div className="text-2xl text-gray-400">:</div>
              
              <button
                onClick={() => setOpponentScore(opponentScore + 1)}
                className="text-center hover:bg-gray-50 rounded-lg p-4 transition-colors cursor-pointer"
              >
                <div className="text-4xl font-mono">{opponentScore}</div>
                <div className="text-sm text-gray-600 mt-1">Soupeř</div>
              </button>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              Klepněte na skóre pro přidání gólu
            </p>
          </CardContent>
        </Card>

        {/* Soupiska */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Soupiska</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant={sortBy === "number" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setSortBy(sortBy === "number" ? "default" : "number")}
                >
                  #
                </Button>
                <Button
                  variant={sortBy === "name" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setSortBy(sortBy === "name" ? "default" : "name")}
                >
                  A–Z
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetStats}
                  className="h-7 w-7"
                  title="Resetovat statistiky"
                >
                  <RotateCcw className="size-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {[...players]
                .sort((a, b) => {
                  if (sortBy === "number") return (parseInt(a.number) || 0) - (parseInt(b.number) || 0);
                  if (sortBy === "name") return a.name.localeCompare(b.name, "cs");
                  return 0;
                })
                .map((player) => (
                <div
                  key={player.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 p-2 border-b last:border-b-0"
                >
                  {/* Číslo + jméno */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-sm w-7 flex-shrink-0">{player.number}</span>
                    <span className="text-sm truncate">{player.name}</span>
                  </div>

                  {/* Tlačítka statistik */}
                  <div className="flex items-center justify-between sm:justify-end sm:ml-auto gap-1">
                    {/* Střely */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updatePlayerStat(player.id, "shots")}
                      className="h-11 flex-1 sm:flex-none sm:w-11 p-0 flex flex-col items-center justify-center"
                    >
                      <div className="text-sm font-semibold">S</div>
                      <div className="text-xs text-gray-500">({player.shots ?? 0})</div>
                    </Button>

                    {/* Góly */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updatePlayerStat(player.id, "goals")}
                      className="h-11 flex-1 sm:flex-none sm:w-11 p-0 flex flex-col items-center justify-center"
                    >
                      <div className="text-sm font-semibold">G</div>
                      <div className="text-xs text-gray-500">({player.goals})</div>
                    </Button>

                    {/* Asistence */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updatePlayerStat(player.id, "assists")}
                      className="h-11 flex-1 sm:flex-none sm:w-11 p-0 flex flex-col items-center justify-center"
                    >
                      <div className="text-sm font-semibold">A</div>
                      <div className="text-xs text-gray-500">({player.assists})</div>
                    </Button>

                    {/* Plus */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updatePlayerStat(player.id, "plus")}
                      className="h-11 flex-1 sm:flex-none sm:w-11 p-0 flex flex-col items-center justify-center"
                    >
                      <div className="text-sm font-semibold text-green-600">+</div>
                      <div className="text-xs text-gray-500">({player.plus})</div>
                    </Button>

                    {/* Minus */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updatePlayerStat(player.id, "minus")}
                      className="h-11 flex-1 sm:flex-none sm:w-11 p-0 flex flex-col items-center justify-center"
                    >
                      <div className="text-sm font-semibold text-red-600">−</div>
                      <div className="text-xs text-gray-500">({player.minus})</div>
                    </Button>

                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}