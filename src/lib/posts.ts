import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";

type Article = CollectionEntry<"articles">;

export async function getSortedArticles() {
  const articles = await getCollection("articles");

  return articles.sort((a, b) => {
    const dateA = a.data.date?.getTime() ?? 0;
    const dateB = b.data.date?.getTime() ?? 0;

    if (dateA !== dateB) return dateB - dateA;
    return getArticleTitle(a).localeCompare(getArticleTitle(b), "sv");
  });
}

export function getArticlePath(id: string) {
  return id.replace(/\.(md|mdx)$/i, "");
}

export function getArticleCategory(article: Article) {
  if (article.data.category) return article.data.category;

  const id = article.id;
  const [category = "ovrigt"] = getArticlePath(id).split("/");
  return category;
}

export function getCategoryLabel(category: string) {
  if (category.length <= 3) return category.toLocaleUpperCase("sv-SE");

  return category
    .replace(/-/g, " ")
    .replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase("sv-SE"));
}

export function getArticleTitle(article: Article) {
  if (article.data.title) return article.data.title;

  const heading = article.body?.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) return heading;

  const filename = getArticlePath(article.id).split("/").at(-1) ?? "artikel";
  return getCategoryLabel(filename);
}

export function getArticleDescription(article: Article) {
  if (article.data.description) return article.data.description;

  const firstText = article.body
    ?.replace(/^---[\s\S]*?---/, "")
    .replace(/[#>*_`[\]()]/g, "")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  return firstText ?? getArticleTitle(article);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
