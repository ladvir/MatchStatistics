# MatchStatistics

Minimalistická aplikace pro sběr kanadského bodování a +/- statistik ve florbale.

## 📋 Funkce

- **Příprava sestavy** - Zadávání čísla dresu a jména hráče
- **Sledování skóre** - Rychlé zadávání gólů klepnutím na skóre
- **Statistiky hráčů** - Zaznamenávání:
  - Góly (G)
  - Asistence (A)
  - Plus body (+)
  - Minus body (-)
  - Celková bilance (+/-)
- **Přehled statistik** - Seřazená tabulka podle bodů
- **Reset funkcionalita** - Samostatné resetování skóre a statistik hráčů
- **Responsivní design** - Funguje na mobilních i desktopových zařízeních

## 🚀 Technologie

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS v4** - Styling
- **Radix UI** - Accessible components
- **Lucide React** - Icons

## 📦 Instalace

### Pro JetBrains Rider

1. **Otevřete projekt v Rider**
   - File → Open → vyberte složku projektu

2. **Instalace závislostí**
   - Rider automaticky detekuje `package.json`
   - Nebo v terminálu: `npm install` nebo `pnpm install`

3. **Spuštění aplikace**
   - Použijte připravenou run konfiguraci "Dev Server" (Shift+F10)
   - Nebo v terminálu: `npm run dev`

4. **Build aplikace**
   - Použijte připravenou run konfiguraci "Build"
   - Nebo v terminálu: `npm run build`

### Klasická instalace

```bash
# Klonování repozitáře
git clone https://github.com/ladvir/MatchStatistics.git

# Vstup do složky
cd MatchStatistics

# Instalace závislostí (použijte npm, pnpm nebo yarn)
npm install
# nebo
pnpm install

# Spuštění dev serveru
npm run dev
# nebo
pnpm dev
```

## 🏗️ Dostupné příkazy

```bash
npm run dev      # Spuštění dev serveru (localhost:5173)
npm run build    # Build pro produkci
npm run preview  # Preview produkčního buildu
npm run lint     # TypeScript type checking
```

## 🏗️ Build

```bash
pnpm build
```

Výstup bude v `/dist` složce.

## 📱 Použití

1. **Příprava sestavy**
   - Zadejte číslo dresu a jméno hráče
   - Klikněte na tlačítko "+" nebo stiskněte Enter
   - Po zadání všech hráčů klikněte "Zahájit utkání"

2. **Průběh utkání**
   - Klepněte na skóre pro přidání gólu
   - U každého hráče klepněte na tlačítka G, A, +, nebo - pro zaznamenání statistiky
   - Bilance +/- se počítá automaticky

3. **Přehled statistik**
   - Hráči jsou seřazeni podle celkových bodů (G+A)
   - Zobrazuje kompletní statistiky všech hráčů

4. **Reset**
   - Reset skóre - tlačítko v kartě se skóre
   - Reset statistik - tlačítko v kartě Soupiska

## 📄 Licence

MIT

## 👤 Autor

ladvir