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

När en publicering lyckas sparas lösenordet lokalt i webbläsaren, så nästa
artikel kan publiceras utan att skriva lösenordet igen. På `/admin` finns också
en knapp för att glömma det sparade lösenordet.

Längre ner på `/admin` kan du också radera artiklar som ligger i
`src/content/posts/`. Raderingen tar bort Markdown-filen från GitHub och Vercel
bygger om sidan automatiskt.

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

### Rekommenderat dokumentformat

För att taggar och beskrivning ska fungera bäst: klistra in artikeln med
YAML-frontmatter överst.

```md
---
title: "Hur fungerar RAG?"
description: "Kort sammanfattning som visas på artikelkortet."
date: "2026-06-27"
tags:
  - AI
  - RAG
  - kunskap
---

Ingress eller första stycke här.

## Rubrik

Brödtext här.
```

Viktigt:

- Frontmatter måste börja på första raden med `---`.
- Klistra helst inte in yttre kodstaket, alltså raden med tre backticks och `md`.
- `tags` ska vara en YAML-lista, en tagg per rad.
- Skriv inte en extra `# Titel` direkt efter frontmatter om den är samma som `title`.
- Om du saknar frontmatter skapas `title`, `description`, `date` och tomma `tags` automatiskt.
- Väldigt långa texter bör delas upp i flera artiklar eller publiceras via Git.

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
