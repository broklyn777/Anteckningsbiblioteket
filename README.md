# Kunskapswebb

En enkel personlig kunskapsbank byggd med Astro, TypeScript och Markdown/MDX.

## Varför Astro?

Astro är valt eftersom projektet främst är en statisk innehållswebb. Det ger en
enkel struktur för Markdown/MDX via content collections, snabb statisk
generering och kräver ingen backend för sök eller filtrering.

## Kom igång

```bash
npm install
npm run dev
```

Öppna sedan adressen som visas i terminalen, normalt `http://localhost:4321`.

Bygg en statisk version:

```bash
npm run build
```

Förhandsgranska bygget:

```bash
npm run preview
```

## Lägg till nytt innehåll

Skapa en ny `.md`- eller `.mdx`-fil i:

```text
src/content/posts/
```

Filnamnet blir sidans URL. Exempel:

```text
src/content/posts/min-nya-ide.md
```

blir:

```text
/posts/min-nya-ide/
```

Varje fil ska börja med frontmatter:

```md
---
title: "Exempel"
description: "Kort sammanfattning"
date: "2026-06-27"
tags: ["ai", "idéer", "skrivande"]
---

Skriv innehållet här.
```

När filen finns i `src/content/posts/` dyker den upp automatiskt på startsidan
och får en egen detaljsida. Sökningen letar i titel, beskrivning, taggar och
brödtext. Taggfilter och sökfält kan kombineras.

## Projektstruktur

```text
src/
  content/
    posts/          Här skriver du nya .md- och .mdx-poster
  layouts/
    BaseLayout.astro
  lib/
    posts.ts        Hjälpfunktioner för sortering, datum och sluggar
  pages/
    index.astro     Startsida med sök och filter
    posts/[slug].astro
  styles/
    global.css
```

## Exempelposter

Projektet innehåller tre exempel:

- `ai-som-tankepartner.md`
- `skrivprocess-for-svara-ideer.md`
- `veckans-fragor.mdx`

Du kan ta bort eller skriva om dem när du vill.
