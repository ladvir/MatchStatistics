# Instalační průvodce - Match Statistics

## ✅ Přehled

Projekt je nyní **kompletně připravený** pro JetBrains Rider a zahrnuje:

- ✅ TypeScript konfigurace
- ✅ Vite konfigurace
- ✅ Run Configurations pro Rider
- ✅ Všechny potřebné soubory pro build
- ✅ Git konfigurace
- ✅ README dokumentace

## 📁 Vytvořené soubory

### Konfigurace
- `tsconfig.json` - TypeScript hlavní konfigurace
- `tsconfig.node.json` - TypeScript konfigurace pro build nástroje
- `vite.config.ts` - Vite build konfigurace
- `postcss.config.mjs` - PostCSS konfigurace

### Entry points
- `index.html` - HTML template
- `src/main.tsx` - React entry point

### Rider konfigurace
- `.idea/runConfigurations/Dev_Server.xml` - Run konfigurace pro dev server
- `.idea/runConfigurations/Build.xml` - Run konfigurace pro build
- `.idea/vcs.xml` - Git konfigurace

### Ostatní
- `.editorconfig` - Nastavení editoru
- `.gitignore` - Git ignore pravidla
- `README.md` - Hlavní dokumentace
- `RIDER_SETUP.md` - Detailní návod pro Rider
- `public/vite.svg` - Favicon

## 🚀 Postup spuštění v Rider

### 1. Otevřete projekt
```
JetBrains Rider → File → Open → vyberte složku MatchStatistics
```

### 2. Instalujte závislosti
Rider zobrazí notifikaci - klikněte na "Run 'npm install'"

Nebo manuálně v terminálu (Alt+F12):
```bash
npm install
```

### 3. Spusťte aplikaci
**Metoda A - Run Configuration:**
1. V horní liště vyberte "Dev Server"
2. Klikněte na zelené Play tlačítko (nebo Shift+F10)

**Metoda B - Terminál:**
```bash
npm run dev
```

Aplikace běží na: `http://localhost:5173`

## 📦 Dostupné příkazy

```bash
# Development
npm run dev         # Spustí dev server

# Build
npm run build       # Vytvoří produkční build do /dist

# Preview
npm run preview     # Náhled produkčního buildu

# Type checking
npm run lint        # TypeScript kontrola
```

## 🔧 Struktura projektu

```
MatchStatistics/
│
├── .idea/                          # Rider konfigurace
│   ├── runConfigurations/
│   │   ├── Dev_Server.xml
│   │   └── Build.xml
│   └── vcs.xml
│
├── public/                         # Statické soubory
│   └── vite.svg
│
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── PlayerSetup.tsx     # Zadání sestavy
│   │   │   ├── MatchTracking.tsx   # Sledování utkání
│   │   │   ├── ui/                 # UI komponenty (button, card, input, atd.)
│   │   │   └── figma/              # Figma komponenty
│   │   └── App.tsx                 # Hlavní komponenta
│   │
│   ├── styles/
│   │   ├── index.css               # Hlavní CSS
│   │   ├── tailwind.css            # Tailwind import
│   │   ├── theme.css               # Design tokens
│   │   └── fonts.css               # Font definice
│   │
│   └── main.tsx                    # React entry point
│
├── index.html                      # HTML template
├── package.json                    # NPM závislosti
├── tsconfig.json                   # TypeScript konfigurace
├── tsconfig.node.json              # TypeScript pro build
├── vite.config.ts                  # Vite konfigurace
├── postcss.config.mjs              # PostCSS konfigurace
├── .editorconfig                   # Editor nastavení
├── .gitignore                      # Git ignore
├── README.md                       # Hlavní dokumentace
├── RIDER_SETUP.md                  # Rider návod
└── INSTALLATION.md                 # Tento soubor
```

## 📋 Požadavky

- **Node.js**: verze 18 nebo vyšší
- **JetBrains Rider**: 2023.1 nebo vyšší
- **Správce balíčků**: npm (součástí Node.js) nebo pnpm

## 🌐 Po spuštění

Aplikace bude dostupná na:
- Dev server: http://localhost:5173
- Preview: http://localhost:4173

## 🎯 Jak používat aplikaci

1. **Příprava sestavy**
   - Zadejte číslo dresu a jméno
   - Stiskněte Enter nebo klikněte na "+"
   - Po zadání všech hráčů: "Zahájit utkání"

2. **Sledování zápasu**
   - Klikněte na skóre pro přidání gólu
   - Klikněte na tlačítka G, A, +, - u hráčů

3. **Statistiky**
   - Automaticky seřazené podle bodů
   - Bilance +/- počítána automaticky

## 🐛 Řešení problémů

### "Node.js není nalezen"
Nainstalujte Node.js z https://nodejs.org/ (LTS verze)

### "Cannot find module"
```bash
rm -rf node_modules
npm install
```

### Port je obsazený
Vite automaticky použije další volný port

### TypeScript chyby
```bash
npm run lint
```

## 📤 Push do GitHub

```bash
git init
git add .
git commit -m "Initial commit: Florbal match statistics app"
git remote add origin https://github.com/ladvir/MatchStatistics.git
git branch -M main
git push -u origin main
```

## 📞 Podpora

Pro detailní návod k Rider viz `RIDER_SETUP.md`

---

**Projekt je připraven k použití! 🎉**
