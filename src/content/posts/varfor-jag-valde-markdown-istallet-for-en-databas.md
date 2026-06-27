---
title: "Varför jag valde Markdown istället för en databas"
description: "Varför jag valde Markdown istället för en databas"
date: "2026-06-27"
tags: []
---

# Varför jag valde Markdown istället för en databas

När jag började bygga Anteckningsbiblioteket funderade jag på om allt innehåll skulle sparas i en databas eller som vanliga Markdown-filer.

Efter att ha vägt för- och nackdelar valde jag Markdown.

## Fördelar

- Inga databaser att underhålla.
- Allt innehåll är vanliga textfiler.
- GitHub fungerar som versionshantering och backup.
- Vercel bygger automatiskt om webbplatsen när en ny artikel publiceras.
- Innehållet kan flyttas till andra system i framtiden.

## Nackdelar

Den största nackdelen är att publiceringen behöver vara enkel. Därför byggs ett adminläge där artiklar kan publiceras direkt från webbläsaren utan att använda Git manuellt.

## Nästa steg

Målet är att arbetsflödet ska vara:

1. Skriva eller klistra in en artikel.
2. Klicka på **Publicera**.
3. Artikeln sparas som en Markdown-fil i GitHub.
4. Webbplatsen uppdateras automatiskt.

På så sätt får jag enkelheten hos ett CMS men behåller alla fördelar med ett filbaserat system.