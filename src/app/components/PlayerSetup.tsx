import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Line, LINE_COLORS, LINE_COLOR_MAP } from "../types";

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
  position?: "U" | "O" | "G";
}

const POSITION_STYLE: Record<string, string> = {
  U: "bg-orange-100 text-orange-700",
  O: "bg-sky-100 text-sky-700",
  G: "bg-yellow-100 text-yellow-700",
};

const POSITION_LABEL: Record<string, string> = { U: "Ú", O: "O", G: "BG" };

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
      setPlayers([...players, {
        id: Date.now().toString(),
        number,
        name,
        shots: 0, goals: 0, assists: 0, plus: 0, minus: 0, plusMinus: 0,
      }]);
      setNumber("");
      setName("");
    }
  };

  const removePlayer = (id: string) => setPlayers(players.filter((p) => p.id !== id));

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
    setLines([...lines, {
      id: `line-${lines.length + 1}`,
      name: `Formace ${lines.length + 1}`,
      color: LINE_COLORS[lines.length],
    }]);
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
                <Input id="number" type="text" value={number}
                  onChange={(e) => setNumber(e.target.value)} placeholder="10"
                  onKeyDown={(e) => e.key === "Enter" && addPlayer()} />
              </div>
              <div className="flex-[2]">
                <Label htmlFor="name">Jméno hráče</Label>
                <Input id="name" type="text" value={name}
                  onChange={(e) => setName(e.target.value)} placeholder="Jan Novák"
                  onKeyDown={(e) => e.key === "Enter" && addPlayer()} />
              </div>
              <div className="flex items-end">
                <Button onClick={addPlayer} size="icon"><Plus className="size-4" /></Button>
              </div>
            </div>

            {players.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Sestava ({players.length})</h3>
                <div className="space-y-1">
                  {players.map((player) => {
                    const isGkByPosition = player.position === "G";
                    const isFieldByPosition = player.position === "U" || player.position === "O";

                    return (
                      <div key={player.id} className="flex items-center gap-2 p-2 bg-white border rounded">
                        <span className="font-mono text-sm w-7 shrink-0">{player.number}</span>
                        {player.position && (
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded shrink-0 ${POSITION_STYLE[player.position]}`}>
                            {POSITION_LABEL[player.position]}
                          </span>
                        )}
                        <span className="text-sm truncate flex-1">{player.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* BG button — hidden for field-position players */}
                          {!isFieldByPosition && (
                            <Button
                              variant="outline"
                              size="sm"
                              className={`h-7 px-2 text-xs ${player.role === "goalkeeper" ? "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200" : ""}`}
                              onClick={() => !isGkByPosition && assignGoalkeeper(player.id)}
                              disabled={isGkByPosition}
                            >
                              BG
                            </Button>
                          )}
                          {/* Formation buttons — hidden for GK-position players */}
                          {!isGkByPosition && lines.map((line) => {
                            const isActive = player.role !== "goalkeeper" && player.lineId === line.id;
                            const colors = LINE_COLOR_MAP[line.color];
                            return (
                              <Button
                                key={line.id}
                                variant="outline"
                                size="sm"
                                className={`h-7 px-2 text-xs ${isActive ? colors.activeBtn : ""}`}
                                onClick={() => assignLine(player.id, line.id)}
                              >
                                {line.name.replace("Formace ", "F")}
                              </Button>
                            );
                          })}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removePlayer(player.id)}>
                          <X className="size-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>

                <div className="text-xs text-gray-400 flex flex-wrap gap-x-3 gap-y-1 pt-1">
                  <span>BG: {goalkeeperCount}</span>
                  {lines.map((line) => (
                    <span key={line.id} className={LINE_COLOR_MAP[line.color].header}>
                      {line.name}: {players.filter((p) => p.lineId === line.id).length}
                    </span>
                  ))}
                  <span>Náhradníci: {substituteCount}</span>
                </div>

                {lines.length < 4 && (
                  <Button variant="ghost" size="sm" className="text-xs text-gray-500 px-0" onClick={addLine}>
                    + Přidat formaci
                  </Button>
                )}
              </div>
            )}

            <Button onClick={() => onStartMatch(players, lines)} disabled={players.length === 0} className="w-full">
              Zahájit utkání
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
