import { useState } from "react";
import { Player } from "./PlayerSetup";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ChevronLeft, RotateCcw } from "lucide-react";
import { Line, LINE_COLOR_MAP } from "../types";

interface MatchTrackingProps {
  initialPlayers: Player[];
  lines: Line[];
  matchLabel?: string;
  matchDate?: string;
  initialOurScore?: number;
  initialOpponentScore?: number;
  onFinish: (players: Player[], ourScore: number, opponentScore: number) => void;
}

type StatKey = "shots" | "goals" | "assists" | "plus" | "minus";

const POSITION_STYLE: Record<string, string> = {
  U: "bg-orange-100 text-orange-700",
  O: "bg-sky-100 text-sky-700",
  G: "bg-yellow-100 text-yellow-700",
};
const POSITION_LABEL: Record<string, string> = { U: "Ú", O: "O", G: "BG" };

function formatMatchDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("cs-CZ", { weekday: "short", day: "numeric", month: "numeric", year: "numeric" });
}

interface PlayerRowProps {
  player: Player;
  lines: Line[];
  showReassign: boolean;
  onStat: (id: string, stat: StatKey) => void;
  onReassign: (id: string, lineId: string | null) => void;
}

function PlayerRow({ player, lines, showReassign, onStat, onReassign }: PlayerRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 p-2 border-b last:border-b-0">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="font-mono text-sm w-7 shrink-0">{player.number}</span>
        {player.position && (
          <span className={`text-xs font-medium px-1 py-0.5 rounded shrink-0 ${POSITION_STYLE[player.position]}`}>
            {POSITION_LABEL[player.position]}
          </span>
        )}
        <span className="text-sm truncate">{player.name}</span>
      </div>
      <div className="flex items-center justify-between sm:justify-end sm:ml-auto gap-1">
        {showReassign && (
          <Select
            value={player.lineId ?? "sub"}
            onValueChange={(val) => onReassign(player.id, val === "sub" ? null : val)}
          >
            <SelectTrigger className="h-7 w-20 text-xs px-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {lines.map((line) => (
                <SelectItem key={line.id} value={line.id}>
                  {line.name.replace("Formace ", "F")}
                </SelectItem>
              ))}
              <SelectItem value="sub">Náhr.</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Button size="sm" variant="outline" onClick={() => onStat(player.id, "shots")}
          className="h-11 flex-1 sm:flex-none sm:w-11 p-0 flex flex-col items-center justify-center">
          <div className="text-sm font-semibold">S</div>
          <div className="text-xs text-gray-500">({player.shots ?? 0})</div>
        </Button>
        <Button size="sm" variant="outline" onClick={() => onStat(player.id, "goals")}
          className="h-11 flex-1 sm:flex-none sm:w-11 p-0 flex flex-col items-center justify-center">
          <div className="text-sm font-semibold">G</div>
          <div className="text-xs text-gray-500">({player.goals})</div>
        </Button>
        <Button size="sm" variant="outline" onClick={() => onStat(player.id, "assists")}
          className="h-11 flex-1 sm:flex-none sm:w-11 p-0 flex flex-col items-center justify-center">
          <div className="text-sm font-semibold">A</div>
          <div className="text-xs text-gray-500">({player.assists})</div>
        </Button>
        <Button size="sm" variant="outline" onClick={() => onStat(player.id, "plus")}
          className="h-11 flex-1 sm:flex-none sm:w-11 p-0 flex flex-col items-center justify-center">
          <div className="text-sm font-semibold text-green-600">+</div>
          <div className="text-xs text-gray-500">({player.plus})</div>
        </Button>
        <Button size="sm" variant="outline" onClick={() => onStat(player.id, "minus")}
          className="h-11 flex-1 sm:flex-none sm:w-11 p-0 flex flex-col items-center justify-center">
          <div className="text-sm font-semibold text-red-600">−</div>
          <div className="text-xs text-gray-500">({player.minus})</div>
        </Button>
      </div>
    </div>
  );
}

interface GroupSectionProps {
  title: string;
  titleClass: string;
  players: Player[];
  lines: Line[];
  showReassign: boolean;
  onStat: (id: string, stat: StatKey) => void;
  onReassign: (id: string, lineId: string | null) => void;
  onGroupStat?: (stat: "plus" | "minus") => void;
}

function GroupSection({ title, titleClass, players, lines, showReassign, onStat, onReassign, onGroupStat }: GroupSectionProps) {
  if (players.length === 0) return null;
  return (
    <div>
      <div className={`flex items-center gap-2 px-2 pt-3 pb-1 ${titleClass}`}>
        <span className="text-xs font-semibold uppercase tracking-wide">{title}</span>
        {onGroupStat && (
          <>
            <Button size="sm" variant="ghost"
              className="h-6 w-7 p-0 text-green-600 font-bold text-base leading-none"
              onClick={() => onGroupStat("plus")}>+</Button>
            <Button size="sm" variant="ghost"
              className="h-6 w-7 p-0 text-red-600 font-bold text-base leading-none"
              onClick={() => onGroupStat("minus")}>−</Button>
          </>
        )}
      </div>
      {players.map((player) => (
        <PlayerRow
          key={player.id}
          player={player}
          lines={lines}
          showReassign={showReassign}
          onStat={onStat}
          onReassign={onReassign}
        />
      ))}
    </div>
  );
}

export function MatchTracking({ initialPlayers, lines, matchLabel, matchDate, initialOurScore = 0, initialOpponentScore = 0, onFinish }: MatchTrackingProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [ourScore, setOurScore] = useState(initialOurScore);
  const [opponentScore, setOpponentScore] = useState(initialOpponentScore);
  const [sortBy, setSortBy] = useState<"formation" | "number" | "name">("formation");

  const updatePlayerStat = (playerId: string, stat: StatKey) => {
    setPlayers(prev => prev.map((p) => {
      if (p.id !== playerId) return p;
      const updated = { ...p, [stat]: p[stat] + 1 };
      if (stat === "plus" || stat === "minus") updated.plusMinus = updated.plus - updated.minus;
      return updated;
    }));
  };

  const reassignPlayer = (playerId: string, lineId: string | null) => {
    setPlayers(prev => prev.map((p) =>
      p.id !== playerId ? p : { ...p, role: "field", lineId }
    ));
  };

  const updateFormationStat = (lineId: string, stat: "plus" | "minus") => {
    setPlayers(prev => prev.map((p) => {
      if (p.lineId !== lineId || p.role === "goalkeeper") return p;
      const updated = { ...p, [stat]: p[stat] + 1 };
      updated.plusMinus = updated.plus - updated.minus;
      return updated;
    }));
  };

  const resetStats = () => {
    setPlayers(prev => prev.map((p) => ({
      ...p, shots: 0, goals: 0, assists: 0, plus: 0, minus: 0, plusMinus: 0,
    })));
  };

  const sortList = (list: Player[]) => {
    if (sortBy === "number") return [...list].sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0));
    if (sortBy === "name") return [...list].sort((a, b) => a.name.localeCompare(b.name, "cs"));
    return list; // "formation" = preserve group order
  };

  const goalkeeper = players.filter((p) => p.role === "goalkeeper");
  const playersForLine = (lineId: string) => sortList(players.filter((p) => p.role !== "goalkeeper" && p.lineId === lineId));
  const substitutes = sortList(players.filter((p) => p.role !== "goalkeeper" && !p.lineId));

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => onFinish(players, ourScore, opponentScore)}>
            <ChevronLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Průběh utkání</h1>
            {matchLabel && <p className="text-sm text-gray-500">{matchLabel}</p>}
            {matchDate && <p className="text-xs text-gray-400">{formatMatchDate(matchDate)}</p>}
          </div>
          <Button variant="ghost" size="sm" className="ml-auto text-gray-500"
            onClick={() => onFinish(players, ourScore, opponentScore)}>
            Přehled statistik
          </Button>
        </div>

        {/* Skóre */}
        <Card>
          <CardContent className="pt-6 relative">
            <Button variant="ghost" size="icon"
              onClick={() => { setOurScore(0); setOpponentScore(0); }}
              className="absolute top-2 right-2 h-8 w-8" title="Resetovat skóre">
              <RotateCcw className="size-4" />
            </Button>
            <div className="flex items-center justify-center gap-8">
              <button onClick={() => setOurScore(ourScore + 1)}
                className="text-center hover:bg-gray-50 rounded-lg p-4 transition-colors cursor-pointer">
                <div className="text-4xl font-mono">{ourScore}</div>
                <div className="text-sm text-gray-600 mt-1">Náš tým</div>
              </button>
              <div className="text-2xl text-gray-400">:</div>
              <button onClick={() => setOpponentScore(opponentScore + 1)}
                className="text-center hover:bg-gray-50 rounded-lg p-4 transition-colors cursor-pointer">
                <div className="text-4xl font-mono">{opponentScore}</div>
                <div className="text-sm text-gray-600 mt-1">Soupeř</div>
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-4">Klepněte na skóre pro přidání gólu</p>
          </CardContent>
        </Card>

        {/* Soupiska */}
        <Card>
          <CardHeader>
            <p className="text-sm text-gray-500 bg-gray-100 rounded-md px-3 py-2 leading-relaxed">
              S = střela · G = gól · A = asistence · + a − = plusminus. Každé klepnutí připočte 1.
            </p>
            <div className="flex items-center justify-between">
              <CardTitle>Soupiska</CardTitle>
              <div className="flex items-center gap-1">
                <Button variant={sortBy === "formation" ? "secondary" : "ghost"} size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setSortBy("formation")}>F</Button>
                <Button variant={sortBy === "number" ? "secondary" : "ghost"} size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setSortBy(sortBy === "number" ? "formation" : "number")}>#</Button>
                <Button variant={sortBy === "name" ? "secondary" : "ghost"} size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setSortBy(sortBy === "name" ? "formation" : "name")}>A–Z</Button>
                <Button variant="ghost" size="icon" onClick={resetStats}
                  className="h-7 w-7" title="Resetovat statistiky">
                  <RotateCcw className="size-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <GroupSection title="Brankář" titleClass="text-yellow-600"
              players={goalkeeper} lines={lines} showReassign={false}
              onStat={updatePlayerStat} onReassign={reassignPlayer} />
            {lines.map((line) => (
              <GroupSection
                key={line.id}
                title={line.name}
                titleClass={LINE_COLOR_MAP[line.color].header}
                players={playersForLine(line.id)}
                lines={lines}
                showReassign={true}
                onStat={updatePlayerStat}
                onReassign={reassignPlayer}
                onGroupStat={(stat) => updateFormationStat(line.id, stat)}
              />
            ))}
            <GroupSection title="Náhradníci" titleClass="text-gray-400"
              players={substitutes} lines={lines} showReassign={true}
              onStat={updatePlayerStat} onReassign={reassignPlayer} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
