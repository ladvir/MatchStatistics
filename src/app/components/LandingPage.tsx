import { Download, Users, Activity, BarChart2, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { getMatches } from "../services/storageService";

const steps = [
  {
    icon: Download,
    label: "Načíst soupisku",
    desc: "Ze ČFbU nebo ručně",
  },
  {
    icon: Users,
    label: "Připravit sestavu",
    desc: "Upravit hráče",
  },
  {
    icon: Activity,
    label: "Sledovat zápas",
    desc: "Zaznamenat akce",
  },
  {
    icon: BarChart2,
    label: "Výsledky",
    desc: "Zobrazit a sdílet",
  },
];

interface LandingPageProps {
  onStart: () => void;
  onShowStats: () => void;
}

export function LandingPage({ onStart, onShowStats }: LandingPageProps) {
  const hasMatches = getMatches().length > 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Florbalové statistiky</h1>
          <p className="text-sm text-gray-500">
            Sledujte statistiky hráčů v průběhu utkání a sdílejte výsledky.
          </p>
        </div>

        <div className="flex items-start justify-between">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start">
              <div className="flex flex-col items-center text-center w-16">
                <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                  <step.icon className="size-5 text-gray-600" />
                </div>
                <div className="mt-2">
                  <div className="text-xs font-medium leading-tight">{step.label}</div>
                  <div className="text-xs text-gray-400 leading-tight mt-0.5">{step.desc}</div>
                </div>
              </div>
              {i < steps.length - 1 && (
                <ChevronRight className="size-4 text-gray-300 mt-4 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-3">
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
