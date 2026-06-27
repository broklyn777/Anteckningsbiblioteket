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

## Admin-import

Det finns också ett enkelt adminläge på:

```text
/admin
```

Där kan du klistra in färdig Markdown och klicka `Publicera`. Du behöver bara
fylla i:

- Adminlösenord
- Titel
- Markdown

Slug skapas automatiskt från titeln. Om Markdown saknar frontmatter läggs detta
till automatiskt:

```md
---
title: "<Titel>"
description: "<första stycket>"
date: "<dagens datum>"
tags: []
---
```

Serverfunktionen skapar sedan filen i GitHub:

```text
src/content/posts/<slug>.md
```

De filerna visas automatiskt på:

```text
/posts/<slug>/
```

Admin-importen använder ingen databas. Den skriver bara en ny Markdown-fil till
GitHub med GitHub Contents API.

### Environment variables

Sätt dessa i Vercel:

```text
GITHUB_TOKEN=...
ADMIN_PASSWORD=...
GITHUB_REPO=broklyn777/Anteckningsbiblioteket
GITHUB_BRANCH=main
```

`GITHUB_TOKEN` behöver rättighet att skapa filer i repot. `ADMIN_PASSWORD` är
lösenordet du skriver in på `/admin`.

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
