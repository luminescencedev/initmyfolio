# PROMPT — Advanced Portfolio Customization System

## Context Projet

Tu travailles sur **initmyfolio** — un générateur de portfolio GitHub en monorepo Next.js 15 + Hono.

### Stack

- `apps/web` — Next.js 15 App Router, Tailwind CSS v3, `@phosphor-icons/react`, Server Components par défaut
- `apps/api` — Hono + Node, ESM, imports `.js`, auth JWT via `jose`
- `packages/db` — Prisma, PostgreSQL (Neon), `settings` et `githubData` sont des colonnes JSONB
- Police display : `font-display` (Cabinet Grotesk), `font-mono` pour les données
- Design system : **brutalisme** — `--radius: 0`, borders `border-border`, pas d'ombres, typographie ultra-serrée (`tracking-tighter`), accent rouge en light / cyan en dark

### Design Skills actifs

- **taste-skill** : DESIGN_VARIANCE 8 / MOTION_INTENSITY 6 / VISUAL_DENSITY 4
- **brutalism** : zéro border-radius, grilles à 1px, tout en majuscules CAPS, monospace pour les chiffres

### État actuel de `settings` (JSONB)

```ts
{
  theme?: "dark" | "light" | "auto";
  pinnedRepos?: string[];                        // max 6 noms
  customLinks?: Array<{ label: string; url: string; icon?: string }>; // max 10
  hideSections?: Array<"stats" | "languages" | "repos">;
  showEmail?: boolean;
}
```

Le dashboard (`/dashboard`) affiche aujourd'hui : profil, bouton sync, stats, liste repos, langages, bloc PRO verrouillé.

Le portfolio (`/[username]`) affiche : nav sticky, hero nom massif (clamp 2.25rem→11rem), meta strip (avatar, bio, links), grille stats (repos/stars/forks/followers), table repos, barre + liste langages, footer.

---

## Objectif

Implémenter un **système de personnalisation poussé** du portfolio. Cela touche trois couches :

1. **Extension du schéma `settings`** (API + types)
2. **Panel de personnalisation dans le dashboard** (nouveau bloc UI)
3. **Rendu conditionnel des nouvelles options dans le portfolio**

---

## 1 — Nouveaux champs `settings` à ajouter

### Apparence & Thème

| Champ           | Type                                                 | Valeurs                                                 | Description                                                                                                           |
| --------------- | ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `accentColor`   | `string`                                             | `"red"` `"cyan"` `"emerald"` `"amber"` `"rose"` `"sky"` | Couleur d'accentuation (appliquée via CSS var `--primary`)                                                            |
| `fontStyle`     | `"mono"` \| `"display"` \| `"mixed"`                 | `"mixed"`                                               | Le nom affiché en HERO : mono = `font-mono`, display = `font-display` (défaut actuel), mixed = les deux en alternance |
| `layoutVariant` | `"brutalist"` \| `"terminal"` \| `"minimal"`         | `"brutalist"`                                           | Variante de layout (voir section 3)                                                                                   |
| `heroStyle`     | `"name-full"` \| `"name-initials"` \| `"name-split"` | `"name-full"`                                           | Comment afficher le nom en HERO                                                                                       |
| `showAvatar`    | `boolean`                                            | `true`                                                  | Afficher ou non l'avatar dans le meta strip                                                                           |

### Sections & Contenu

| Champ               | Type                                                      | Valeurs                                                 | Description                                    |
| ------------------- | --------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------- |
| `sectionOrder`      | `string[]`                                                | `["stats","repos","languages","about","stack","links"]` | Ordre des sections dans le portfolio           |
| `hideSections`      | `string[]`                                                | tout nom de section                                     | Étend l'existant (était limité à 3 valeurs)    |
| `repoDisplayStyle`  | `"table"` \| `"cards"` \| `"compact"`                     | `"table"`                                               | Style d'affichage des repos                    |
| `maxRepos`          | `4` \| `6` \| `8` \| `12`                                 | `8`                                                     | Nombre max de repos affichés                   |
| `repoSortBy`        | `"stars"` \| `"forks"` \| `"updated"` \| `"pinned-first"` | `"stars"`                                               | Tri des repos                                  |
| `showTopics`        | `boolean`                                                 | `true`                                                  | Afficher les topics GitHub sous les repos      |
| `showContributions` | `boolean`                                                 | `false`                                                 | Afficher le heatmap de contributions (à venir) |

### Sections personnalisées

| Champ          | Type                                                  | Description                                                   |
| -------------- | ----------------------------------------------------- | ------------------------------------------------------------- |
| `aboutText`    | `string` (max 1000 chars)                             | Texte libre "À propos" — nouvelle section                     |
| `techStack`    | `Array<{ name: string; category?: string }>` (max 30) | Technologies maîtrisées — nouvelle section                    |
| `availability` | `"open"` \| `"busy"` \| `"closed"` \| null            | Badge de disponibilité affiché dans le HERO                   |
| `featuredRepo` | `string` \| null                                      | Nom d'un repo à mettre en avant (hero card en haut des repos) |

---

## 2 — Modifications API (`apps/api/src/routes/users.ts`)

Étendre le `settingsSchema` Zod pour inclure tous les nouveaux champs ci-dessus.

Exemple partiel :

```ts
accentColor: z.enum(["red","cyan","emerald","amber","rose","sky"]).optional(),
fontStyle: z.enum(["mono","display","mixed"]).optional(),
layoutVariant: z.enum(["brutalist","terminal","minimal"]).optional(),
heroStyle: z.enum(["name-full","name-initials","name-split"]).optional(),
showAvatar: z.boolean().optional(),
sectionOrder: z.array(z.string()).max(10).optional(),
hideSections: z.array(z.string()).max(10).optional(),   // remplace l'ancien enum strict
repoDisplayStyle: z.enum(["table","cards","compact"]).optional(),
maxRepos: z.union([z.literal(4),z.literal(6),z.literal(8),z.literal(12)]).optional(),
repoSortBy: z.enum(["stars","forks","updated","pinned-first"]).optional(),
showTopics: z.boolean().optional(),
aboutText: z.string().max(1000).optional(),
techStack: z.array(z.object({ name: z.string().max(40), category: z.string().max(40).optional() })).max(30).optional(),
availability: z.enum(["open","busy","closed"]).nullable().optional(),
featuredRepo: z.string().max(100).nullable().optional(),
```

Aussi mettre à jour le type `PortfolioUser["settings"]` dans `apps/web/src/lib/api.ts`.

---

## 3 — Portfolio (`apps/[username]/page.tsx`) — Rendu des nouvelles options

### 3.1 — Accent color dynamique

Injecter une `<style>` inline dans le `<head>` qui override les CSS vars selon `settings.accentColor` :

```tsx
const ACCENT_COLORS: Record<string, { primary: string; ring: string }> = {
  red: { primary: "0 80% 50%", ring: "0 80% 50%" },
  cyan: { primary: "188 85% 48%", ring: "188 85% 48%" },
  emerald: { primary: "152 60% 42%", ring: "152 60% 42%" },
  amber: { primary: "38 90% 50%", ring: "38 90% 50%" },
  rose: { primary: "347 77% 50%", ring: "347 77% 50%" },
  sky: { primary: "200 85% 50%", ring: "200 85% 50%" },
};
```

Injecter via :

```tsx
{
  accent && (
    <style>{`:root,:root.dark{--primary:${accent.primary};--accent:${accent.primary};--ring:${accent.ring}}`}</style>
  );
}
```

### 3.2 — Hero styles

- `name-full` (défaut) : nom complet, fontSize clamp actuel
- `name-initials` : afficher uniquement les initiales, fontSize encore plus grand (clamp 4rem→20rem), effet monumental
- `name-split` : nom divisé lettre par lettre, chaque lettre dans son propre `<span>` avec un léger décalage vertical en alternance (odd +8px / even -8px), rendu "glitched grid"

### 3.3 — Badge de disponibilité dans le HERO

Si `settings.availability` est défini, afficher dans le meta strip (à côté du bio) un badge inline :

- `open` → fond emerald sombre, texte `OPEN TO WORK`
- `busy` → fond amber sombre, texte `CURRENTLY BUSY`
- `closed` → fond muted, texte `NOT AVAILABLE`

Style :

```tsx
<span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-current text-[9px] font-mono uppercase tracking-widest">
  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
  {LABEL}
</span>
```

### 3.4 — Section "About" (nouvelle)

Si `settings.aboutText` est non vide, insérer la section dans `sectionOrder` :

```tsx
<section className="border border-border mb-8">
  <div className="border-b border-border px-4 py-2.5 bg-muted">
    <span className="label">[ ABOUT ]</span>
  </div>
  <div className="px-5 py-5">
    <p className="text-sm text-muted-foreground leading-relaxed max-w-[65ch] whitespace-pre-wrap">
      {aboutText}
    </p>
  </div>
</section>
```

### 3.5 — Section "Tech Stack" (nouvelle)

Si `settings.techStack` est non vide :

- Regrouper par `category` si présente (sinon tout dans "STACK")
- Afficher chaque tag comme un bloc borderless inline pill :

```tsx
<span className="border border-border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">
  {name}
</span>
```

- Layout : `flex flex-wrap gap-1.5 px-5 py-4`

### 3.6 — Featured Repo (mise en avant)

Si `settings.featuredRepo` est défini, afficher ce repo AVANT la table standard sous la forme d'un bloc full-width :

```
┌─────────────────────────────────────────────────────┐
│ [ FEATURED ]                                         │
│ ╔═══════════════════════════════════════════════════╗│
│ ║ repo.name                          ★ 1.2k   ⑂ 87 ║│
│ ║ repo.description                                  ║│
│ ║ [ TypeScript ] [ react ] [ api ]   → VIEW ON GH  ║│
│ ╚═══════════════════════════════════════════════════╝│
└─────────────────────────────────────────────────────┘
```

Style : border double `border-2` pour distinguer, fond `bg-muted/30`.

### 3.7 — Repo display styles

**`table`** — comportement actuel (inchangé)

**`cards`** — grille 2 colonnes responsive :

```
grid grid-cols-1 sm:grid-cols-2 gap-px bg-border
```

Chaque card : fond `bg-background`, padding `p-4`, sans border-radius.

**`compact`** — liste ultra-dense, 1 ligne par repo, pas de description, padding py-1.5, font-size 10px mono partout.

### 3.8 — Ordre des sections (`sectionOrder`)

Lire `settings.sectionOrder ?? ["stats","repos","languages"]` et rendre les sections dans cet ordre. Pour chaque section inconnue ou absente des données, skip proprement.

---

## 4 — Dashboard — Panel de personnalisation

Ajouter un nouveau bloc `[ CUSTOMIZE PORTFOLIO ]` dans le dashboard, **entre** le bloc profil et le bloc repos/languages.

Ce panneau est **client-only** (les inputs locaux sont mis à jour avec debounce 800ms avant d'appeler `updateSettings`). Il ne recharge pas la page.

### Structure UI

```
┌──────────────────────────────────────────────────────┐
│  [ CUSTOMIZE PORTFOLIO ]              ✓ SAVED / ...  │
├──────────────────────────────────────────────────────┤
│  SECTION: APPEARANCE                                  │
│  ─────────────────────────────────────────────────── │
│  ACCENT COLOR                                        │
│  ○ RED  ○ CYAN  ○ EMERALD  ○ AMBER  ○ ROSE  ○ SKY   │
│                                                      │
│  LAYOUT VARIANT                                      │
│  ○ BRUTALIST  ○ TERMINAL  ○ MINIMAL                  │
│                                                      │
│  HERO NAME STYLE                                     │
│  ○ FULL  ○ INITIALS  ○ SPLIT                         │
│                                                      │
│  FONT STYLE                                          │
│  ○ DISPLAY  ○ MONO  ○ MIXED                          │
├──────────────────────────────────────────────────────┤
│  SECTION: CONTENT                                    │
│  ─────────────────────────────────────────────────── │
│  AVAILABILITY BADGE                                  │
│  ○ NONE  ○ OPEN TO WORK  ○ BUSY  ○ CLOSED           │
│                                                      │
│  SHOW EMAIL     [toggle]                             │
│  SHOW AVATAR    [toggle]                             │
│  SHOW TOPICS    [toggle]                             │
│                                                      │
│  REPOS TO SHOW   [4] [6] [8] [12]                    │
│  SORT BY         [STARS ▾]                           │
│  DISPLAY AS      [TABLE] [CARDS] [COMPACT]            │
├──────────────────────────────────────────────────────┤
│  SECTION: ABOUT TEXT                                  │
│  textarea max-h-40, placeholder, counter 0/1000      │
├──────────────────────────────────────────────────────┤
│  SECTION: TECH STACK                                  │
│  input [ ADD TECH... ] + tag list with × to delete   │
├──────────────────────────────────────────────────────┤
│  SECTION: FEATURED REPO                               │
│  select parmi les repos du user (dropdown ou chips)  │
├──────────────────────────────────────────────────────┤
│  SECTION: VISIBLE SECTIONS & ORDER                    │
│  drag-to-reorder list (simple: boutons ↑↓ sans lib)  │
│  chaque section avec toggle visible/hidden           │
└──────────────────────────────────────────────────────┘
```

### Règles de design pour ce panel

- **Pas de shadcn/radix** sauf si déjà installé — utiliser des inputs bruts stylisés en mono
- Headers de section : `label` classe, texte gris, séparé par `border-b border-border`
- Inputs texte : `border border-border bg-background font-mono text-xs` (pas de border-radius, `--radius: 0`)
- Toggles : simples `<button>` en `px-3 py-1 border border-border` changeant `bg-foreground text-background` quand actif — **pas de composant switch**
- Option groups (color picker, layout) : rangée de `<button>` avec `active:scale-[0.98]` et state actif = `border-foreground text-foreground bg-muted`
- Feedback de sauvegarde : icône `CheckCircle` + texte `SAVED` qui apparaît 2s après chaque save réussi, dans le header du bloc
- Le textarea de l'about : `font-mono text-xs resize-none`, compteur de caractères aligné à droite
- La section tech stack : l'input devient un tag en appuyant Enter ou `,`. Chaque tag : `border border-border font-mono text-[10px] px-2 py-0.5` + bouton `×` discret

### Hooks / State

```ts
const [localSettings, setLocalSettings] = useState<UserSettings>(
  user.settings ?? {},
);
const [saveStatus, setSaveStatus] = useState<
  "idle" | "saving" | "saved" | "error"
>("idle");

// Debounce save
useEffect(() => {
  if (!token || !user) return;
  const t = setTimeout(async () => {
    setSaveStatus("saving");
    const ok = await updateSettings(token, user.username, localSettings);
    setSaveStatus(ok ? "saved" : "error");
    if (ok) setTimeout(() => setSaveStatus("idle"), 2000);
  }, 800);
  return () => clearTimeout(t);
}, [localSettings]);
```

---

## 5 — Types à mettre à jour (`apps/web/src/lib/api.ts`)

```ts
settings: {
  // Existants
  theme?: "dark" | "light" | "auto";
  pinnedRepos?: string[];
  customLinks?: Array<{ label: string; url: string; icon?: string }>;
  hideSections?: string[];
  showEmail?: boolean;

  // Nouveaux
  accentColor?: "red" | "cyan" | "emerald" | "amber" | "rose" | "sky";
  fontStyle?: "mono" | "display" | "mixed";
  layoutVariant?: "brutalist" | "terminal" | "minimal";
  heroStyle?: "name-full" | "name-initials" | "name-split";
  showAvatar?: boolean;
  sectionOrder?: string[];
  repoDisplayStyle?: "table" | "cards" | "compact";
  maxRepos?: 4 | 6 | 8 | 12;
  repoSortBy?: "stars" | "forks" | "updated" | "pinned-first";
  showTopics?: boolean;
  aboutText?: string;
  techStack?: Array<{ name: string; category?: string }>;
  availability?: "open" | "busy" | "closed" | null;
  featuredRepo?: string | null;
};
```

---

## 6 — Contraintes Implémentation

- **ESM strict** : tous les imports internes dans `apps/api` doivent se terminer par `.js`
- **Prisma JSON** : pour le PUT settings, continuer à faire `JSON.parse(JSON.stringify(body))` avant de passer à Prisma (obligatoire avec `exactOptionalPropertyTypes`)
- **ISR** : le portfolio a `export const revalidate = 3600`. Les nouvelles sections doivent être **Server Components statiques** (pas de `useEffect`)
- **Client isolation** : le panel de personnalisation dans le dashboard est `'use client'`. Extraire les sous-parties interactives (drag, tags) en composants feuilles séparés si besoin
- **No framer-motion** dans ce PR sauf si déjà dans `package.json`
- Le feedback de save et les toggles d'options peuvent utiliser `useState` local — c'est un Client Component donc OK
- **Anti-emoji** : aucun emoji nulle part dans le code ou les textes
- **Pas de `h-screen`** : toujours `min-h-[100dvh]`

---

## 7 — Ordre de livraison suggéré

1. Mettre à jour le type `settings` dans `apps/web/src/lib/api.ts`
2. Étendre `settingsSchema` dans `apps/api/src/routes/users.ts`
3. Ajouter le panel de customisation dans `apps/web/src/app/dashboard/page.tsx`
4. Implémenter `accentColor` + `heroStyle` + `availability` dans `apps/web/src/app/[username]/page.tsx`
5. Ajouter les sections About + TechStack dans le portfolio
6. Implémenter `repoDisplayStyle` + `maxRepos` + `repoSortBy` + `showTopics`
7. Implémenter `sectionOrder` (rendre la liste de sections dynamique)
8. (Optionnel) `featuredRepo`

---

## 8 — Ce qui NE doit PAS changer

- Le système d'auth (JWT, `authMiddleware`) — ne pas toucher
- Le cron (`apps/api/src/cron/index.ts`) — ne pas toucher
- Le schéma Prisma (`packages/db/prisma/schema.prisma`) — `settings` est déjà `Json`, pas besoin de migration
- La structure de `githubData` — lecture seule
- Le style global (CSS vars dans `globals.css`) — l'accentColor est injecté inline dans le portfolio uniquement, pas modifié globalement
- Le layout variant `terminal` et `minimal` peuvent être scaffoldés en placeholder (section commentée `// TODO: layout terminal`) si le scope est trop large — la priorité est `brutalist` (actuel) + le panel de settings côté dashboard
