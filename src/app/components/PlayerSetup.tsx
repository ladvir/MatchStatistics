import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ArrowLeft, Plus, X } from "lucide-react";

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
}

interface PlayerSetupProps {
  onStartMatch: (players: Player[]) => void;
  initialPlayers?: Player[];
  onBack?: () => void;
}

export function PlayerSetup({ onStartMatch, initialPlayers, onBack }: PlayerSetupProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers ?? []);
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
                      className="flex items-center justify-between p-2 bg-white border rounded"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono w-8">{player.number}</span>
                        <span>{player.name}</span>
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
              </div>
            )}

            <Button
              onClick={() => onStartMatch(players)}
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