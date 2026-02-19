import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { CompletedMatch, getMatches, deleteMatch } from "../services/storageService";
import { Player } from "./PlayerSetup";

interface StatsOverviewProps {
  onNewMatch: () => void;
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function aggregatePlayers(matches: CompletedMatch[]): Player[] {
  const map = new Map<string, Player>();
  for (const match of matches) {
    for (const p of match.players) {
      const existing = map.get(p.name);
      if (existing) {
        existing.goals += p.goals;
        existing.assists += p.assists;
        existing.plus += p.plus;
        existing.minus += p.minus;
        existing.plusMinus += p.plusMinus;
      } else {
        map.set(p.name, { ...p });
      }
    }
  }
  return Array.from(map.values());
}

function pluralZapas(n: number): string {
  if (n === 1) return "zápas";
  if (n >= 2 && n <= 4) return "zápasy";
  return "zápasů";
}

function StatsTable({ players }: { players: Player[] }) {
  const sorted = [...players].sort((a, b) => {
    const aTotal = a.goals + a.assists;
    const bTotal = b.goals + b.assists;
    if (bTotal !== aTotal) return bTotal - aTotal;
    return b.plusMinus - a.plusMinus;
  });

  if (sorted.length === 0) {
    return <p className="text-sm text-gray-500">Žádní hráči.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="space-y-1 min-w-[400px]">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-3 px-3 py-2 text-xs text-gray-600 font-medium border-b">
          <div className="w-8">#</div>
          <div>Jméno</div>
          <div className="w-10 text-center">G</div>
          <div className="w-10 text-center">A</div>
          <div className="w-10 text-center">+</div>
          <div className="w-10 text-center">-</div>
          <div className="w-10 text-center">+/-</div>
        </div>
        {sorted.map((player) => (
          <div
            key={player.id}
            className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-3 px-3 py-2 border-b last:border-b-0"
          >
            <div className="w-8 font-mono text-sm">{player.number}</div>
            <div className="text-sm truncate">{player.name}</div>
            <div className="w-10 text-center font-mono text-sm">{player.goals}</div>
            <div className="w-10 text-center font-mono text-sm">{player.assists}</div>
            <div className="w-10 text-center font-mono text-sm text-green-600">+{player.plus}</div>
            <div className="w-10 text-center font-mono text-sm text-red-600">-{player.minus}</div>
            <div
              className={`w-10 text-center font-mono text-sm font-medium ${
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
  );
}

export function StatsOverview({ onNewMatch }: StatsOverviewProps) {
  const [matches, setMatches] = useState<CompletedMatch[]>(() => getMatches());
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(
    () => getMatches()[0]?.id ?? null,
  );

  const handleDelete = (id: string) => {
    deleteMatch(id);
    const updated = getMatches();
    setMatches(updated);
    if (selectedMatchId === id) {
      setSelectedMatchId(updated[0]?.id ?? null);
    }
  };

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) ?? null;
  const aggregated = aggregatePlayers(matches);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Přehled statistik</h1>
          <Button onClick={onNewMatch}>Nový zápas</Button>
        </div>

        {matches.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-sm text-gray-500">
              Žádné zápasy zatím nebyly zaznamenány.
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all">
            <TabsList className="w-full">
              <TabsTrigger value="match" className="flex-1">
                Zápas
              </TabsTrigger>
              <TabsTrigger value="all" className="flex-1">
                Celkem ({matches.length} {pluralZapas(matches.length)})
              </TabsTrigger>
            </TabsList>

            {/* ZÁPAS */}
            <TabsContent value="match" className="space-y-3">
              <Card>
                <CardHeader>
                  <CardTitle>Výběr zápasu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {matches.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMatchId(m.id)}
                      className={`flex items-center justify-between p-3 border rounded cursor-pointer transition-colors ${
                        selectedMatchId === m.id
                          ? "bg-gray-100 border-gray-400"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div>
                        <div className="font-medium text-sm">{m.label}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(m.date)} · {m.ourScore}:{m.opponentScore}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(m.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Smazat zápas"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {selectedMatch && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {selectedMatch.label} · {selectedMatch.ourScore}:{selectedMatch.opponentScore}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StatsTable players={selectedMatch.players} />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* CELKEM */}
            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Celkem — {matches.length} {pluralZapas(matches.length)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <StatsTable players={aggregated} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
