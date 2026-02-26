import { useRef, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, ChevronsUpDown, Download, FileText, Loader2, Trash2 } from "lucide-react";
import { toPng } from "html-to-image";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { CompletedMatch, getMatches, deleteMatch, deleteAllMatches } from "../services/storageService";
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

function normalizePlayerName(name: string): string {
  return name.replace(/\s+C$/, "").trim();
}

function aggregatePlayers(matches: CompletedMatch[]): Player[] {
  const map = new Map<string, Player>();
  for (const match of matches) {
    for (const p of match.players) {
      const key = normalizePlayerName(p.name);
      const existing = map.get(key);
      if (existing) {
        existing.shots = (existing.shots ?? 0) + (p.shots ?? 0);
        existing.goals += p.goals;
        existing.assists += p.assists;
        existing.plus += p.plus;
        existing.minus += p.minus;
        existing.plusMinus += p.plusMinus;
      } else {
        map.set(key, { ...p, name: key });
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
  type OverflowFix = { el: HTMLElement; overflowX: string; width: string };
  type CardFix = { el: HTMLElement; border: string; borderRadius: string; boxShadow: string };
  type TruncateFix = { el: HTMLElement; overflow: string; textOverflow: string };

  const overflowFixes: OverflowFix[] = [];
  const cardFixes: CardFix[] = [];
  const truncateFixes: TruncateFix[] = [];

  // Remove card border/radius so the export doesn't look like a phone frame
  el.querySelectorAll<HTMLElement>("[data-slot='card']").forEach((card) => {
    cardFixes.push({ el: card, border: card.style.border, borderRadius: card.style.borderRadius, boxShadow: card.style.boxShadow });
    card.style.border = "none";
    card.style.borderRadius = "0";
    card.style.boxShadow = "none";
  });

  // Fix truncated text so full names are visible — must happen BEFORE measuring scrollWidth
  el.querySelectorAll<HTMLElement>("*").forEach((child) => {
    const computed = window.getComputedStyle(child);
    if (computed.textOverflow === "ellipsis") {
      truncateFixes.push({ el: child, overflow: child.style.overflow, textOverflow: child.style.textOverflow });
      child.style.overflow = "visible";
      child.style.textOverflow = "clip";
    }
  });

  // Remove overflow restrictions to capture full table content
  el.querySelectorAll<HTMLElement>("*").forEach((child) => {
    const computed = window.getComputedStyle(child);
    if (computed.overflowX === "auto" || computed.overflowX === "scroll") {
      overflowFixes.push({ el: child, overflowX: child.style.overflowX, width: child.style.width });
      child.style.overflowX = "visible";
      child.style.width = child.scrollWidth + "px";
    }
  });

  try {
    return await toPng(el, {
      backgroundColor: "#ffffff",
      pixelRatio: 2,
      width: el.scrollWidth,
      height: el.scrollHeight,
    });
  } finally {
    overflowFixes.forEach(({ el, overflowX, width }) => {
      el.style.overflowX = overflowX;
      el.style.width = width;
    });
    cardFixes.forEach(({ el, border, borderRadius, boxShadow }) => {
      el.style.border = border;
      el.style.borderRadius = borderRadius;
      el.style.boxShadow = boxShadow;
    });
    truncateFixes.forEach(({ el, overflow, textOverflow }) => {
      el.style.overflow = overflow;
      el.style.textOverflow = textOverflow;
    });
  }
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `${filename}.png`;
  a.click();
}

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function generateTextStats(players: Player[], title: string, subtitle?: string): string {
  const sorted = sortPlayers(players, "goals", "desc");
  const lines: string[] = [];
  lines.push(title);
  if (subtitle) lines.push(subtitle);
  lines.push("");
  const header =
    " # ".padEnd(5) +
    "Jméno".padEnd(24) +
    "  S".padStart(4) +
    "  G".padStart(4) +
    "  A".padStart(4) +
    "   +".padStart(5) +
    "   -".padStart(5) +
    "  +/-".padStart(6);
  lines.push(header);
  lines.push("-".repeat(header.length));
  for (const p of sorted) {
    const pm = (p.plusMinus >= 0 ? "+" : "") + String(p.plusMinus);
    lines.push(
      (p.number ?? "").padStart(3).padEnd(5) +
        normalizePlayerName(p.name).substring(0, 23).padEnd(24) +
        String(p.shots ?? 0).padStart(4) +
        String(p.goals).padStart(4) +
        String(p.assists).padStart(4) +
        String(p.plus).padStart(5) +
        String(p.minus).padStart(5) +
        pm.padStart(6),
    );
  }
  return lines.join("\n");
}

type SortKey = "formation" | "number" | "name" | "shots" | "goals" | "assists" | "plus" | "minus" | "plusMinus";
type SortDir = "asc" | "desc";

function formationOrder(p: Player): number {
  if (p.role === "goalkeeper") return 0;
  if (!p.lineId) return 999;
  return parseInt(p.lineId.replace("line-", "")) || 99;
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
      <div className="space-y-1 min-w-[360px]">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto] gap-3 px-3 py-2 text-xs text-gray-600 font-medium border-b">
          {col("number", "#", "w-8 flex items-center gap-0.5 hover:text-gray-900 transition-colors")}
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
            className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto] gap-3 px-3 py-2 border-b last:border-b-0"
          >
            <div className="w-8 font-mono text-sm">{player.number}</div>
            <div className="text-sm truncate">{normalizePlayerName(player.name)}</div>
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
  const [sharingMatchText, setSharingMatchText] = useState(false);
  const [sharingAllText, setSharingAllText] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const matchCardRef = useRef<HTMLDivElement>(null);
  const allCardRef = useRef<HTMLDivElement>(null);

  const handleDeleteAll = () => {
    if (!confirmDeleteAll) {
      setConfirmDeleteAll(true);
      return;
    }
    deleteAllMatches();
    setMatches([]);
    setSelectedMatchId(null);
    setConfirmDeleteAll(false);
  };

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

  const handleShareMatchText = () => {
    if (!selectedMatch || sharingMatchText) return;
    setSharingMatchText(true);
    try {
      const subtitle = [
        formatDate(selectedMatch.date),
        `${selectedMatch.ourScore}:${selectedMatch.opponentScore}`,
        selectedMatch.teamName,
        selectedMatch.competition,
      ]
        .filter(Boolean)
        .join(" · ");
      const content = generateTextStats(selectedMatch.players, selectedMatch.label, subtitle);
      downloadText(content, selectedMatch.label ?? "statistiky");
    } finally {
      setSharingMatchText(false);
    }
  };

  const handleShareAllText = () => {
    if (sharingAllText) return;
    setSharingAllText(true);
    try {
      const title =
        (selectedTeamFilter ? teamLabel(selectedTeamFilter) : "Celkem") +
        ` — ${filteredMatches.length} ${pluralZapas(filteredMatches.length)}`;
      const content = generateTextStats(aggregated, title);
      downloadText(content, selectedTeamFilter ? teamLabel(selectedTeamFilter) : "statistiky-celkem");
    } finally {
      setSharingAllText(false);
    }
  };

  // Composite key: "teamName|||competition" (or just teamName if no competition)
  function teamKey(m: { teamName?: string; competition?: string }): string | null {
    if (!m.teamName) return null;
    return m.competition ? `${m.teamName}|||${m.competition}` : m.teamName;
  }
  function teamLabel(key: string): string {
    const [name, comp] = key.split("|||");
    return comp ? `${name} · ${comp}` : name;
  }

  const teamKeys = Array.from(
    new Set(matches.map(teamKey).filter(Boolean) as string[])
  );
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string | null>(
    () => matches.map(teamKey).find(Boolean) ?? null
  );

  const filteredMatches = selectedTeamFilter
    ? matches.filter((m) => teamKey(m) === selectedTeamFilter)
    : matches;

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) ?? null;
  const aggregated = aggregatePlayers(filteredMatches);

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
          <div className="flex items-center gap-2">
            {matches.length > 0 && (
              <Button
                variant={confirmDeleteAll ? "destructive" : "ghost"}
                size="sm"
                className={confirmDeleteAll ? "" : "text-gray-400"}
                onClick={handleDeleteAll}
                onBlur={() => setConfirmDeleteAll(false)}
              >
                <Trash2 className="size-4 mr-1" />
                {confirmDeleteAll ? "Opravdu smazat?" : "Smazat vše"}
              </Button>
            )}
            <Button onClick={onNewMatch}>Nový zápas</Button>
          </div>
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
                          {[formatDate(m.date), `${m.ourScore}:${m.opponentScore}`, teamKeys.length > 1 ? (m.competition ? `${m.teamName} · ${m.competition}` : m.teamName) : undefined].filter(Boolean).join(" · ")}
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
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleShareMatchText}
                          disabled={sharingMatchText}
                          className="text-gray-500"
                          title="Exportovat jako text"
                        >
                          {sharingMatchText ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <FileText className="size-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleShareMatch}
                          disabled={sharingMatch}
                          className="text-gray-500"
                          title="Exportovat jako obrázek"
                        >
                          {sharingMatch ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Download className="size-4" />
                          )}
                        </Button>
                      </div>
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
              {teamKeys.length > 1 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {teamKeys.map((key) => (
                    <Button
                      key={key}
                      size="sm"
                      variant={selectedTeamFilter === key ? "secondary" : "outline"}
                      className="text-xs h-7"
                      onClick={() => setSelectedTeamFilter(key)}
                    >
                      {teamLabel(key)}
                    </Button>
                  ))}
                </div>
              )}
              <div ref={allCardRef}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle>
                      {selectedTeamFilter ? teamLabel(selectedTeamFilter) : "Celkem"} — {filteredMatches.length} {pluralZapas(filteredMatches.length)}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleShareAllText}
                        disabled={sharingAllText}
                        className="text-gray-500"
                        title="Exportovat jako text"
                      >
                        {sharingAllText ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <FileText className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleShareAll}
                        disabled={sharingAll}
                        className="text-gray-500"
                        title="Exportovat jako obrázek"
                      >
                        {sharingAll ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Download className="size-4" />
                        )}
                      </Button>
                    </div>
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
