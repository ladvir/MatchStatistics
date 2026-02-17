import { useState } from "react";
import { Player } from "./PlayerSetup";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ChevronLeft, RotateCcw } from "lucide-react";

interface MatchTrackingProps {
  initialPlayers: Player[];
  onBack: () => void;
}

export function MatchTracking({ initialPlayers, onBack }: MatchTrackingProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [ourScore, setOurScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);

  const updatePlayerStat = (
    playerId: string,
    stat: "goals" | "assists" | "plus" | "minus"
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
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="size-4" />
          </Button>
          <h1 className="text-xl font-semibold">Průběh utkání</h1>
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
          <CardHeader className="relative">
            <CardTitle>Soupiska</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={resetStats}
              className="absolute top-3 right-3 h-8 w-8"
              title="Resetovat statistiky"
            >
              <RotateCcw className="size-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Hráči */}
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border-b last:border-b-0"
                >
                  {/* Jméno a číslo */}
                  <div className="flex items-center gap-3 min-w-0 flex-shrink">
                    <div className="w-8 font-mono text-sm flex-shrink-0">{player.number}</div>
                    <div className="text-sm truncate">{player.name}</div>
                  </div>
                  
                  {/* Statistiky */}
                  <div className="flex items-center gap-2 justify-end sm:ml-auto flex-wrap">
                    {/* Góly */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updatePlayerStat(player.id, "goals")}
                      className="h-12 w-12 p-0 flex flex-col items-center justify-center"
                    >
                      <div className="text-sm font-semibold">G</div>
                      <div className="text-xs text-gray-500">({player.goals})</div>
                    </Button>

                    {/* Asistence */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updatePlayerStat(player.id, "assists")}
                      className="h-12 w-12 p-0 flex flex-col items-center justify-center"
                    >
                      <div className="text-sm font-semibold">A</div>
                      <div className="text-xs text-gray-500">({player.assists})</div>
                    </Button>

                    {/* Plus */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updatePlayerStat(player.id, "plus")}
                      className="h-12 w-12 p-0 flex flex-col items-center justify-center"
                    >
                      <div className="text-sm font-semibold text-green-600">+</div>
                      <div className="text-xs text-gray-500">({player.plus})</div>
                    </Button>

                    {/* Minus */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updatePlayerStat(player.id, "minus")}
                      className="h-12 w-12 p-0 flex flex-col items-center justify-center"
                    >
                      <div className="text-sm font-semibold text-red-600">−</div>
                      <div className="text-xs text-gray-500">({player.minus})</div>
                    </Button>

                    {/* Celková bilance */}
                    <div className="h-12 w-12 flex flex-col items-center justify-center border rounded bg-gray-50">
                      <div className="text-xs text-gray-500">+/-</div>
                      <div
                        className={`text-sm font-semibold ${
                          player.plusMinus > 0
                            ? "text-green-600"
                            : player.plusMinus < 0
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {player.plusMinus > 0 ? "+" : ""}
                        {player.plusMinus}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Statistiky */}
        <Card>
          <CardHeader>
            <CardTitle>Přehled statistik</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="space-y-1 min-w-[500px]">
                <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-3 px-3 py-2 text-xs text-gray-600 font-medium border-b">
                  <div className="w-8">#</div>
                  <div>Jméno</div>
                  <div className="w-12 text-center">G</div>
                  <div className="w-12 text-center">A</div>
                  <div className="w-12 text-center">+</div>
                  <div className="w-12 text-center">-</div>
                  <div className="w-12 text-center">+/-</div>
                </div>
                {[...players]
                  .sort((a, b) => {
                    const aTotal = a.goals + a.assists;
                    const bTotal = b.goals + b.assists;
                    if (bTotal !== aTotal) return bTotal - aTotal;
                    return b.plusMinus - a.plusMinus;
                  })
                  .map((player) => (
                    <div
                      key={player.id}
                      className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-3 px-3 py-2 border-b last:border-b-0"
                    >
                      <div className="w-8 font-mono text-sm">
                        {player.number}
                      </div>
                      <div className="text-sm truncate">{player.name}</div>
                      <div className="w-12 text-center font-mono text-sm">
                        {player.goals}
                      </div>
                      <div className="w-12 text-center font-mono text-sm">
                        {player.assists}
                      </div>
                      <div className="w-12 text-center font-mono text-sm text-green-600">
                        +{player.plus}
                      </div>
                      <div className="w-12 text-center font-mono text-sm text-red-600">
                        -{player.minus}
                      </div>
                      <div
                        className={`w-12 text-center font-mono text-sm font-medium ${
                          player.plusMinus > 0
                            ? "text-green-600"
                            : player.plusMinus < 0
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {player.plusMinus > 0 ? "+" : ""}
                        {player.plusMinus}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}