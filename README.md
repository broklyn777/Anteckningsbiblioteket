# Anteckningsbiblioteket

En enkel statisk kunskapswebb byggd med Astro, TypeScript och Markdown/MDX.
Ingen databas, inget CMS: artiklarna är vanliga filer i GitHub.

## Varför Astro?

Astro passar bra här eftersom webbplatsen är innehållsdriven, statisk och enkel
att deploya på Vercel. Content collections gör att Markdown/MDX-filer kan bli
sidor automatiskt utan manuell routing.

## Publicera en artikel

1. Skapa en ny `.mdx`-fil i `content/`.
2. Klistra in innehållet.
3. Commit och push.

Klart. Vercel bygger om sidan och artikeln får en egen URL.

## Exempel

Skapa filen:

```text
content/ai/hur-rag-fungerar.mdx
```

Den publiceras automatiskt på:

```text
/ai/hur-rag-fungerar/
```

Minsta frontmatter:

```mdx
---
title: "Hur fungerar RAG?"
tags:
  - AI
  - RAG
---

Skriv artikeln här.
```

Du kan skapa nya kategorier genom att skapa nya mappar under `content/`, till
exempel `content/programmering/`, `content/projekt/` eller `content/ekonomi/`.

## Sök och filter

Alla artiklar blir automatiskt sökbara på titel, taggar och innehåll.
Startsidan kan filtrera på kategori och taggar.

## Kommandon

```bash
npm install
npm run dev
npm run build
```

För Vercel:

- Build command: `npm run build`
- Output directory: `dist`

## Struktur

```text
content/                 Här ligger alla publicerade artiklar
  ai/
  planering/
  skrivande/
templates/ny-artikel.mdx Mall att kopiera om du vill
src/                     Webbplatsens kod
```
