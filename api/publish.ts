import { isValidSession } from "./_session";

const slugPattern = /^[a-z0-9-]+$/;
const frontmatterPattern = /^---\s*[\s\S]*?\s*---/;

type ApiRequest = {
  method?: string;
  headers?: {
    cookie?: string;
  };
  body?:
    | string
    | {
        title?: unknown;
        markdown?: unknown;
      };
};

type ApiResponse = {
  setHeader(name: string, value: string): void;
  status(code: number): {
    json(data: unknown): void;
  };
};

function slugify(title: string) {
  return title
    .toLocaleLowerCase("sv-SE")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function stripFrontmatter(markdown: string) {
  return markdown.replace(frontmatterPattern, "").trim();
}

function getFirstParagraph(markdown: string) {
  return stripFrontmatter(markdown)
    .split(/\n{2,}/)
    .map((paragraph) =>
      paragraph
        .replace(/^#+\s+/gm, "")
        .replace(/[*_`[\]()>#-]/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .find(Boolean);
}

function truncateDescription(text: string) {
  if (text.length <= 150) return text;
  return `${text.slice(0, 147).trimEnd()}...`;
}

function hasFrontmatterField(markdown: string, field: string) {
  const match = markdown.match(frontmatterPattern);
  if (!match) return false;
  return new RegExp(`^${field}\\s*:`, "m").test(match[0]);
}

function ensureMetadata(markdown: string, title: string) {
  const today = new Date().toISOString().slice(0, 10);
  const description = truncateDescription(getFirstParagraph(markdown) ?? "");

  if (!frontmatterPattern.test(markdown)) {
    return `---\ntitle: "${title.replace(/"/g, '\\"')}"\ndescription: "${description.replace(/"/g, '\\"')}"\ndate: "${today}"\ntags: []\n---\n\n${markdown}`;
  }

  const frontmatter = markdown.match(frontmatterPattern)?.[0] ?? "---\n---";
  const body = stripFrontmatter(markdown);
  const additions: string[] = [];

  if (!hasFrontmatterField(markdown, "description")) {
    additions.push(`description: "${description.replace(/"/g, '\\"')}"`);
  }

  if (!hasFrontmatterField(markdown, "date")) {
    additions.push(`date: "${today}"`);
  }

  if (additions.length === 0) return markdown;

  const updatedFrontmatter = frontmatter.replace(
    /\s*---\s*$/,
    `\n${additions.join("\n")}\n---`,
  );
  return `${updatedFrontmatter}\n\n${body}`;
}

function parseBody(body: ApiRequest["body"]) {
  if (typeof body === "string") {
    return JSON.parse(body) as {
      title?: unknown;
      markdown?: unknown;
    };
  }

  return body ?? {};
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    console.warn("[api/publish] Method not allowed", req.method);
    res.setHeader("Allow", "POST");
    return res
      .status(405)
      .json({ code: "METHOD_NOT_ALLOWED", error: "Endast POST stöds." });
  }

  const {
    GITHUB_TOKEN,
    ADMIN_PASSWORD,
    GITHUB_REPO = "broklyn777/Anteckningsbiblioteket",
    GITHUB_BRANCH = "main",
  } = process.env;

  if (!GITHUB_TOKEN || !ADMIN_PASSWORD) {
    console.error("[api/publish] Missing env", {
      hasGithubToken: Boolean(GITHUB_TOKEN),
      hasAdminPassword: Boolean(ADMIN_PASSWORD),
    });
    return res
      .status(500)
      .json({
        code: "MISSING_ENV",
        error: "Servern saknar GITHUB_TOKEN eller ADMIN_PASSWORD.",
      });
  }

  if (!isValidSession(req)) {
    console.warn("[api/publish] Missing or invalid session");
    return res
      .status(401)
      .json({ code: "NOT_AUTHENTICATED", error: "Du är inte inloggad." });
  }

  let body: ReturnType<typeof parseBody>;

  try {
    body = parseBody(req.body);
  } catch {
    console.warn("[api/publish] Invalid JSON body");
    return res.status(400).json({ code: "INVALID_JSON", error: "Ogiltig JSON." });
  }

  const title = String(body.title ?? "").trim();
  const rawMarkdown = String(body.markdown ?? "").trim();
  const slug = slugify(title);

  if (!title) {
    return res
      .status(400)
      .json({ code: "MISSING_TITLE", error: "Titel får inte vara tom." });
  }

  if (!rawMarkdown) {
    return res
      .status(400)
      .json({ code: "MISSING_MARKDOWN", error: "Markdown får inte vara tom." });
  }

  if (!slug || !slugPattern.test(slug)) {
    return res.status(400).json({
      code: "INVALID_SLUG",
      error: "Titeln kunde inte göras om till en giltig slug.",
    });
  }

  const markdown = ensureMetadata(rawMarkdown, title);
  const path = `src/content/posts/${slug}.md`;
  const articleUrl = `/posts/${slug}/`;
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;
  const existingUrl = `${apiUrl}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const existingResponse = await fetch(existingUrl, { headers });

  if (existingResponse.ok) {
    console.warn("[api/publish] File already exists", path);
    return res.status(409).json({
      code: "FILE_EXISTS",
      error: `Det finns redan en artikel med sluggen "${slug}". Ändra titeln och försök igen.`,
    });
  }

  if (existingResponse.status !== 404) {
    console.error("[api/publish] GitHub existence check failed", {
      status: existingResponse.status,
      statusText: existingResponse.statusText,
    });
    return res.status(502).json({
      code: "GITHUB_CHECK_FAILED",
      error: "Kunde inte kontrollera om filen redan finns i GitHub.",
    });
  }

  const createResponse = await fetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      branch: GITHUB_BRANCH,
      message: `Add article ${slug}`,
      content: Buffer.from(markdown, "utf8").toString("base64"),
    }),
  });

  if (!createResponse.ok) {
    const details = await createResponse.json().catch(() => undefined);
    console.error("[api/publish] GitHub create failed", {
      status: createResponse.status,
      statusText: createResponse.statusText,
      message: details?.message,
    });
    return res.status(createResponse.status).json({
      code: "GITHUB_CREATE_FAILED",
      error:
        details?.message ??
        "GitHub kunde inte skapa filen. Kontrollera token och repo.",
    });
  }

  console.info("[api/publish] Article created", path);
  return res.status(200).json({ ok: true, path, slug, articleUrl });
}
