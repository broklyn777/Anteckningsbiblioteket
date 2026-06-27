import { getCollection } from "astro:content";

export async function getSortedArticles() {
  const articles = await getCollection("articles");

  return articles.sort((a, b) => {
    const dateA = a.data.date?.getTime() ?? 0;
    const dateB = b.data.date?.getTime() ?? 0;

    if (dateA !== dateB) return dateB - dateA;
    return a.data.title.localeCompare(b.data.title, "sv");
  });
}

export function getArticlePath(id: string) {
  return id.replace(/\.(md|mdx)$/i, "");
}

export function getArticleCategory(id: string) {
  const [category = "ovrigt"] = getArticlePath(id).split("/");
  return category;
}

export function getCategoryLabel(category: string) {
  if (category.length <= 3) return category.toLocaleUpperCase("sv-SE");

  return category
    .replace(/-/g, " ")
    .replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase("sv-SE"));
}

export function getArticleDescription(article: {
  data: { description?: string; title: string };
  body?: string;
}) {
  if (article.data.description) return article.data.description;

  const firstText = article.body
    ?.replace(/^---[\s\S]*?---/, "")
    .replace(/[#>*_`[\]()]/g, "")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  return firstText ?? article.data.title;
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
