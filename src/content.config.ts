import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const articles = defineCollection({
  loader: glob({
    pattern: ["content/**/*.{md,mdx}", "src/content/posts/**/*.{md,mdx}"],
    base: ".",
    generateId: ({ entry }) =>
      entry
        .replace(/^content\//, "")
        .replace(/^src\/content\/posts\//, "posts/"),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { articles };
