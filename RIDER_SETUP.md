# JetBrains Rider - Návod k použití

## 🚀 Rychlý start

### 1. Otevření projektu
1. Spusťte JetBrains Rider
2. `File` → `Open` → Vyberte složku `MatchStatistics`
3. Rider automaticky detekuje Node.js projekt

### 2. Instalace závislostí
Po otevření projektu Rider zobrazí notifikaci o chybějících závislostech:
- Klikněte na `Run 'npm install'` nebo `Run 'pnpm install'`
- Nebo ručně v terminálu (Alt+F12):
  ```bash
  npm install
  # nebo pokud máte pnpm
  pnpm install
  ```

### 3. Spuštění aplikace
Máte dvě možnosti:

**A) Použití Run Configuration (doporučeno)**
- V horní liště vyberte `Dev Server` z dropdown menu
- Klikněte na zelené tlačítko Play (Shift+F10)
- Aplikace se spustí na `http://localhost:5173`

**B) Terminál**
```bash
npm run dev
```

### 4. Build aplikace
**A) Použití Run Configuration**
- V horní liště vyberte `Build` z dropdown menu
- Klikněte na zelené tlačítko Play
- Build se vytvoří ve složce `/dist`

**B) Terminál**
```bash
npm run build
```

## 📋 Dostupné příkazy

| Příkaz | Popis |
|--------|-------|
| `npm run dev` | Spustí vývojový server (port 5173) |
| `npm run build` | Vytvoří produkční build |
| `npm run preview` | Náhled produkčního buildu |
| `npm run lint` | TypeScript type checking |

## 🔧 Konfigurace projektu

### Předpřipravené Run Configurations
Projekt obsahuje dvě run konfigurace:
1. **Dev Server** - Spuštění vývojového serveru
2. **Build** - Vytvoření produkčního buildu

Najdete je v: `.idea/runConfigurations/`

### Struktura projektu
```
MatchStatistics/
├── .idea/                      # Rider konfigurace
│   ├── runConfigurations/      # Run konfigurace
│   └── vcs.xml                 # Git nastavení
├── src/
│   ├── app/
│   │   ├── components/         # React komponenty
│   │   │   ├── PlayerSetup.tsx
│   │   │   ├── MatchTracking.tsx
│   │   │   └── ui/             # UI komponenty
│   │   └── App.tsx
│   ├── styles/                 # CSS styly
│   └── main.tsx                # Entry point
├── index.html                  # HTML template
├── package.json
├── tsconfig.json               # TypeScript konfigurace
├── vite.config.ts              # Vite konfigurace
└── README.md
```

## 🐛 Řešení problémů

### Node.js není nainstalován
1. Stáhněte Node.js z https://nodejs.org/ (LTS verze)
2. Restartujte Rider
3. `Settings` → `Languages & Frameworks` → `Node.js` → Nastavte cestu k Node.js

### Závislosti se nenainstalují
```bash
# Smažte node_modules a lock soubory
rm -rf node_modules package-lock.json

# Zkuste znovu
npm install
```

### Port 5173 je obsazený
Vite automaticky zkusí další volný port (5174, 5175, atd.)

### TypeScript chyby
```bash
# Spusťte type checking
npm run lint
```

## 💡 Tipy pro Rider

### Užitečné klávesové zkratky
- **Shift+F10** - Spustit vybranou run konfiguraci
- **Alt+F12** - Otevřít terminál
- **Ctrl+Shift+F10** - Spustit soubor pod kurzorem
- **Ctrl+F5** - Spustit bez debuggingu
- **Shift+F9** - Debug mode

### IntelliSense
- Rider automaticky poskytuje:
  - TypeScript type hints
  - Auto-import pro React komponenty
  - CSS class suggestions (Tailwind)
  - Component props autocomplete

### Hot Module Replacement (HMR)
- Vite automaticky aktualizuje stránku při změnách
- Není potřeba restartovat dev server

## 📝 Další informace

- **Oficiální dokumentace Vite**: https://vitejs.dev/
- **React dokumentace**: https://react.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **TypeScript**: https://www.typescriptlang.org/

## 🆘 Podpora

Pokud narazíte na problém:
1. Zkontrolujte, že máte nainstalovaný Node.js (verze 18+)
2. Zkontrolujte, že jsou nainstalovány všechny závislosti
3. Zkuste smazat `node_modules` a nainstalovat znovu
4. Podívejte se do terminálu na chybové hlášky
