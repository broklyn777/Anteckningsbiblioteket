import { getCollection } from "astro:content";

export async function getSortedPosts() {
  const posts = await getCollection("posts");

  return posts.sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
}

export function getPostSlug(id: string) {
  return id.replace(/\.(md|mdx)$/i, "");
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
