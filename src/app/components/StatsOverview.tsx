import { useRef, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, ChevronsUpDown, Loader2, Share2, Trash2 } from "lucide-react";
import { toPng } from "html-to-image";
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
        existing.shots = (existing.shots ?? 0) + (p.shots ?? 0);
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

async function captureImage(el: HTMLElement): Promise<string> {
  return toPng(el, { backgroundColor: "#ffffff", pixelRatio: 2 });
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `${filename}.png`;
  a.click();
}

type SortKey = "formation" | "number" | "name" | "shots" | "goals" | "assists" | "plus" | "minus" | "plusMinus";
type SortDir = "asc" | "desc";

function formationOrder(p: Player): number {
  if (p.role === "goalkeeper") return 0;
  if (!p.lineId) return 999;
  return parseInt(p.lineId.replace("line-", "")) || 99;
}

function formationLabel(p: Player): string {
  if (p.role === "goalkeeper") return "BG";
  if (!p.lineId) return "—";
  const m = p.lineId.match(/line-(\d+)/);
  return m ? `F${m[1]}` : p.lineId;
}

function sortPlayers(players: Player[], key: SortKey, dir: SortDir): Player[] {
  return [...players].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;
    if (key === "formation") {
      aVal = formationOrder(a);
      bVal = formationOrder(b);
    } else if (key === "number") {
      aVal = parseInt(a.number) || 0;
      bVal = parseInt(b.number) || 0;
    } else if (key === "name") {
      aVal = a.name;
      bVal = b.name;
    } else {
      aVal = (a[key] as number) ?? 0;
      bVal = (b[key] as number) ?? 0;
    }
    if (typeof aVal === "string") {
      return dir === "asc" ? aVal.localeCompare(bVal as string, "cs") : (bVal as string).localeCompare(aVal, "cs");
    }
    return dir === "asc" ? aVal - (bVal as number) : (bVal as number) - aVal;
  });
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="size-3 opacity-30" />;
  return dir === "desc" ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />;
}

function StatsTable({ players }: { players: Player[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("goals");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" || key === "number" || key === "formation" ? "asc" : "desc");
    }
  };

  const sorted = sortPlayers(players, sortKey, sortDir);

  if (sorted.length === 0) {
    return <p className="text-sm text-gray-500">Žádní hráči.</p>;
  }

  const col = (key: SortKey, label: string, className = "w-10 text-center") => (
    <button
      onClick={() => handleSort(key)}
      className={`${className} flex items-center justify-center gap-0.5 hover:text-gray-900 transition-colors ${sortKey === key ? "text-gray-900" : ""}`}
    >
      {label}
      <SortIcon active={sortKey === key} dir={sortDir} />
    </button>
  );

  return (
    <div className="overflow-x-auto">
      <div className="space-y-1 min-w-[420px]">
        <div className="grid grid-cols-[auto_auto_1fr_auto_auto_auto_auto_auto_auto] gap-3 px-3 py-2 text-xs text-gray-600 font-medium border-b">
          {col("number", "#", "w-8 flex items-center gap-0.5 hover:text-gray-900 transition-colors")}
          {col("formation", "F", "w-8 flex items-center justify-center gap-0.5 hover:text-gray-900 transition-colors")}
          {col("name", "Jméno", "text-left flex items-center gap-0.5 hover:text-gray-900 transition-colors")}
          {col("shots", "S")}
          {col("goals", "G")}
          {col("assists", "A")}
          {col("plus", "+")}
          {col("minus", "−")}
          {col("plusMinus", "+/-")}
        </div>
        {sorted.map((player) => (
          <div
            key={player.id}
            className="grid grid-cols-[auto_auto_1fr_auto_auto_auto_auto_auto_auto] gap-3 px-3 py-2 border-b last:border-b-0"
          >
            <div className="w-8 font-mono text-sm">{player.number}</div>
            <div className="w-8 text-center text-xs text-gray-400 font-mono">{formationLabel(player)}</div>
            <div className="text-sm truncate">{player.name}</div>
            <div className="w-10 text-center font-mono text-sm">{player.shots ?? 0}</div>
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
  const [sharingMatch, setSharingMatch] = useState(false);
  const [sharingAll, setSharingAll] = useState(false);

  const matchCardRef = useRef<HTMLDivElement>(null);
  const allCardRef = useRef<HTMLDivElement>(null);

  const handleDelete = (id: string) => {
    deleteMatch(id);
    const updated = getMatches();
    setMatches(updated);
    if (selectedMatchId === id) {
      setSelectedMatchId(updated[0]?.id ?? null);
    }
  };

  const handleShareMatch = async () => {
    if (!matchCardRef.current || sharingMatch) return;
    setSharingMatch(true);
    try {
      const dataUrl = await captureImage(matchCardRef.current);
      downloadDataUrl(dataUrl, selectedMatch?.label ?? "statistiky");
    } finally {
      setSharingMatch(false);
    }
  };

  const handleShareAll = async () => {
    if (!allCardRef.current || sharingAll) return;
    setSharingAll(true);
    try {
      const dataUrl = await captureImage(allCardRef.current);
      downloadDataUrl(dataUrl, "statistiky-celkem");
    } finally {
      setSharingAll(false);
    }
  };

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) ?? null;
  const aggregated = aggregatePlayers(matches);

  return (
    <>
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onNewMatch}>
              <ArrowLeft className="size-4" />
            </Button>
            <h1 className="text-xl font-semibold">Přehled statistik</h1>
          </div>
          <Button onClick={onNewMatch}>Nový zápas</Button>
        </div>

        <p className="text-sm text-gray-500 bg-gray-100 rounded-md px-3 py-2 leading-relaxed">
          Zobrazte statistiky jednotlivých zápasů nebo souhrnné výsledky za celou sezónu. Klepnutím na ikonu sdílení vytvoříte obrázek.
        </p>

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
                <div ref={matchCardRef}>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-base">
                        {selectedMatch.label} · {selectedMatch.ourScore}:{selectedMatch.opponentScore}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleShareMatch}
                        disabled={sharingMatch}
                        className="text-gray-500"
                      >
                        {sharingMatch ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Share2 className="size-4" />
                        )}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <StatsTable players={selectedMatch.players} />
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* CELKEM */}
            <TabsContent value="all">
              <div ref={allCardRef}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle>
                      Celkem — {matches.length} {pluralZapas(matches.length)}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShareAll}
                      disabled={sharingAll}
                      className="text-gray-500"
                    >
                      {sharingAll ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Share2 className="size-4" />
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <StatsTable players={aggregated} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
    </>
  );
}
