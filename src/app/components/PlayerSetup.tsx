import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Line } from "../types";

export interface Player {
  id: string;
  number: string;
  name: string;
  shots: number;
  goals: number;
  assists: number;
  plus: number;
  minus: number;
  plusMinus: number;
  role?: "goalkeeper" | "field";
  lineId?: string | null;
}

interface PlayerSetupProps {
  onStartMatch: (players: Player[], lines: Line[]) => void;
  initialPlayers?: Player[];
  lines: Line[];
  onBack?: () => void;
}

export function PlayerSetup({ onStartMatch, initialPlayers, lines: initialLines, onBack }: PlayerSetupProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers ?? []);
  const [lines, setLines] = useState<Line[]>(initialLines);
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");

  const addPlayer = () => {
    if (number && name) {
      const newPlayer: Player = {
        id: Date.now().toString(),
        number,
        name,
        shots: 0,
        goals: 0,
        assists: 0,
        plus: 0,
        minus: 0,
        plusMinus: 0,
      };
      setPlayers([...players, newPlayer]);
      setNumber("");
      setName("");
    }
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter((p) => p.id !== id));
  };

  const assignGoalkeeper = (playerId: string) => {
    setPlayers(players.map((p) => {
      if (p.id !== playerId) return p;
      return p.role === "goalkeeper"
        ? { ...p, role: "field", lineId: null }
        : { ...p, role: "goalkeeper", lineId: null };
    }));
  };

  const assignLine = (playerId: string, lineId: string) => {
    setPlayers(players.map((p) => {
      if (p.id !== playerId) return p;
      return p.role !== "goalkeeper" && p.lineId === lineId
        ? { ...p, role: "field", lineId: null }
        : { ...p, role: "field", lineId };
    }));
  };

  const addLine = () => {
    if (lines.length >= 4) return;
    const n = lines.length + 1;
    setLines([...lines, { id: `line-${n}`, name: `Formace ${n}` }]);
  };

  const goalkeeperCount = players.filter((p) => p.role === "goalkeeper").length;
  const substituteCount = players.filter((p) => p.role !== "goalkeeper" && !p.lineId).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 mb-1">
                <ArrowLeft className="size-4" />
                Zpět
              </Button>
            )}
            <CardTitle>Příprava sestavy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500 bg-gray-100 rounded-md px-3 py-2 leading-relaxed">
              Zkontrolujte sestavu. Přidejte nebo odeberte hráče, kteří dnes nastoupí, a klepněte na Zahájit utkání.
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="number">Číslo</Label>
                <Input
                  id="number"
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="10"
                  onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                />
              </div>
              <div className="flex-[2]">
                <Label htmlFor="name">Jméno hráče</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jan Novák"
                  onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addPlayer} size="icon">
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            {players.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Sestava ({players.length})</h3>
                <div className="space-y-1">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-2 p-2 bg-white border rounded"
                    >
                      <span className="font-mono text-sm w-7 shrink-0">{player.number}</span>
                      <span className="text-sm truncate flex-1">{player.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant={player.role === "goalkeeper" ? "secondary" : "outline"}
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => assignGoalkeeper(player.id)}
                        >
                          BG
                        </Button>
                        {lines.map((line) => (
                          <Button
                            key={line.id}
                            variant={player.role !== "goalkeeper" && player.lineId === line.id ? "secondary" : "outline"}
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => assignLine(player.id, line.id)}
                          >
                            {line.name.replace("Formace ", "F")}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePlayer(player.id)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-gray-400 space-y-0.5 pt-1">
                  <span>BG: {goalkeeperCount}</span>
                  {lines.map((line) => (
                    <span key={line.id} className="ml-3">
                      {line.name}: {players.filter((p) => p.lineId === line.id).length}
                    </span>
                  ))}
                  <span className="ml-3">Náhradníci: {substituteCount}</span>
                </div>

                {lines.length < 4 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-500 px-0"
                    onClick={addLine}
                  >
                    + Přidat formaci
                  </Button>
                )}
              </div>
            )}

            <Button
              onClick={() => onStartMatch(players, lines)}
              disabled={players.length === 0}
              className="w-full"
            >
              Zahájit utkání
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
