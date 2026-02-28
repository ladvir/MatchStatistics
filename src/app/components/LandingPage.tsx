import { Download, Users, Activity, BarChart2, Play } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { CompletedMatch, getMatches } from "../services/storageService";

const steps = [
  {
    icon: Download,
    number: "1",
    title: "Načíst soupisku",
    desc: "Vyhledejte tým z Českého florbalu (FIS) nebo zadejte hráče ručně.",
  },
  {
    icon: Users,
    number: "2",
    title: "Připravit sestavu",
    desc: "Upravte seznam hráčů, kteří dnes nastoupí.",
  },
  {
    icon: Activity,
    number: "3",
    title: "Sledovat zápas",
    desc: "Zaznamenávejte střely, góly, asistence a plusminus.",
  },
  {
    icon: BarChart2,
    number: "4",
    title: "Výsledky",
    desc: "Zobrazte statistiky a sdílejte je",
  },
];

interface LandingPageProps {
  onStart: () => void;
  onShowStats: () => void;
  onContinueMatch?: (match: CompletedMatch) => void;
}

export function LandingPage({ onStart, onShowStats, onContinueMatch }: LandingPageProps) {
  const allMatches = getMatches();
  const hasMatches = allMatches.length > 0;
  const inProgressMatch = allMatches.find((m) => m.inProgress);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-sm w-full space-y-3">
        <div className="text-center pb-2">
          <h1 className="text-2xl font-bold tracking-tight">Florbalové statistiky</h1>
        </div>

        {steps.map((step) => (
          <Card key={step.number}>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <step.icon className="size-5 text-gray-600" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-sm">
                  <span className="text-gray-400 mr-1">{step.number}.</span>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{step.desc}</div>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="space-y-2 pt-2">
          {inProgressMatch && onContinueMatch && (
            <Button
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              size="lg"
              onClick={() => onContinueMatch(inProgressMatch)}
            >
              <Play className="size-4 mr-2" />
              Pokračovat: {inProgressMatch.label}
            </Button>
          )}
          <Button className="w-full" size="lg" onClick={onStart}>
            Začít nový zápas
          </Button>
          {hasMatches && (
            <Button variant="outline" className="w-full" onClick={onShowStats}>
              Přehled statistik
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
