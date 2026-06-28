const editablePostPattern = /^src\/content\/posts\/[a-z0-9-]+\.(md|mdx)$/;
const maxMarkdownCharacters = 750_000;

type ApiRequest = {
  method?: string;
  body?:
    | string
    | {
        action?: unknown;
        markdown?: unknown;
        password?: unknown;
        path?: unknown;
      };
};

type ApiResponse = {
  setHeader(name: string, value: string): void;
  status(code: number): {
    json(data: unknown): void;
  };
};

function parseBody(body: ApiRequest["body"]) {
  if (typeof body === "string") {
    return JSON.parse(body) as {
      action?: unknown;
      markdown?: unknown;
      password?: unknown;
      path?: unknown;
    };
  }

  return body ?? {};
}

function splitTagValue(value: string) {
  const cleanedValue = value.replace(/^[\s"'[]+|[\s"'\]]+$/g, "").trim();
  if (!cleanedValue) return [];

  return cleanedValue
    .split(/\s+[-–—]\s+|,/)
    .map((tag) => tag.replace(/^[\s"'[]+|[\s"'\]]+$/g, "").trim())
    .filter(Boolean);
}

function formatYamlTag(tag: string) {
  return tag.includes(":") || tag.includes("#")
    ? `"${tag.replace(/"/g, '\\"')}"`
    : tag;
}

function normalizeFrontmatterTags(markdown: string) {
  const match = markdown.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/);
  if (!match) return markdown;

  const frontmatter = match[0];
  const body = markdown.slice(frontmatter.length).trimStart();
  const lines = frontmatter.split(/\r?\n/);
  const normalizedLines: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const tagsMatch = line.match(/^tags:\s*(.*?)\s*$/);

    if (!tagsMatch) {
      normalizedLines.push(line);
      continue;
    }

    const inlineValue = tagsMatch[1];

    if (inlineValue && !inlineValue.startsWith("[")) {
      const tags = splitTagValue(inlineValue);
      normalizedLines.push("tags:");
      normalizedLines.push(...tags.map((tag) => `  - ${formatYamlTag(tag)}`));
      continue;
    }

    if (inlineValue) {
      normalizedLines.push(line);
      continue;
    }

    const blockLines: string[] = [];
    let nextIndex = index + 1;

    while (nextIndex < lines.length) {
      const nextLine = lines[nextIndex];
      if (/^---\s*$/.test(nextLine) || /^[A-Za-z][\w-]*:\s*/.test(nextLine)) {
        break;
      }

      blockLines.push(nextLine);
      nextIndex += 1;
    }

    const tags = blockLines.flatMap((blockLine) => {
      const bullet = blockLine.match(/^\s*[-*]\s+(.+?)\s*$/);
      return bullet ? splitTagValue(bullet[1]) : [];
    });

    if (tags.length === 0) {
      normalizedLines.push(line, ...blockLines);
    } else {
      normalizedLines.push("tags:");
      normalizedLines.push(...tags.map((tag) => `  - ${formatYamlTag(tag)}`));
    }

    index = nextIndex - 1;
  }

  return `${normalizedLines.join("\n").trimEnd()}\n${body}`;
}

function decodeGitHubContent(content: string) {
  return Buffer.from(content.replace(/\n/g, ""), "base64").toString("utf8");
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    console.warn("[api/edit] Method not allowed", req.method);
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
    console.error("[api/edit] Missing env", {
      hasGithubToken: Boolean(GITHUB_TOKEN),
      hasAdminPassword: Boolean(ADMIN_PASSWORD),
    });
    return res.status(500).json({
      code: "MISSING_ENV",
      error: "Servern saknar GITHUB_TOKEN eller ADMIN_PASSWORD.",
    });
  }

  let body: ReturnType<typeof parseBody>;

  try {
    body = parseBody(req.body);
  } catch {
    console.warn("[api/edit] Invalid JSON body");
    return res.status(400).json({ code: "INVALID_JSON", error: "Ogiltig JSON." });
  }

  const action = String(body.action ?? "");
  const password = String(body.password ?? "");
  const path = String(body.path ?? "").trim();

  if (password !== ADMIN_PASSWORD) {
    console.warn("[api/edit] Invalid password");
    return res
      .status(401)
      .json({ code: "INVALID_PASSWORD", error: "Fel adminlösenord." });
  }

  if (!editablePostPattern.test(path)) {
    return res.status(400).json({
      code: "INVALID_PATH",
      error: "Endast artiklar i src/content/posts/ kan redigeras här.",
    });
  }

  if (action !== "load" && action !== "save") {
    return res.status(400).json({
      code: "INVALID_ACTION",
      error: "Välj antingen load eller save.",
    });
  }

  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const existingUrl = `${apiUrl}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;
  const existingResponse = await fetch(existingUrl, { headers });

  if (existingResponse.status === 404) {
    return res.status(404).json({
      code: "FILE_NOT_FOUND",
      error: "Artikeln finns inte längre i GitHub.",
    });
  }

  if (!existingResponse.ok) {
    console.error("[api/edit] GitHub lookup failed", {
      status: existingResponse.status,
      statusText: existingResponse.statusText,
    });
    return res.status(502).json({
      code: "GITHUB_LOOKUP_FAILED",
      error: "Kunde inte hämta artikeln från GitHub.",
    });
  }

  const existingFile = (await existingResponse.json()) as {
    content?: string;
    sha?: string;
  };

  if (!existingFile.sha || !existingFile.content) {
    console.error("[api/edit] Missing content or sha", path);
    return res.status(502).json({
      code: "GITHUB_MISSING_FILE_DATA",
      error: "GitHub svarade utan filens innehåll eller sha.",
    });
  }

  if (action === "load") {
    return res.status(200).json({
      ok: true,
      markdown: decodeGitHubContent(existingFile.content),
      path,
      sha: existingFile.sha,
    });
  }

  const markdown = normalizeFrontmatterTags(String(body.markdown ?? "").trim());

  if (!markdown) {
    return res
      .status(400)
      .json({ code: "MISSING_MARKDOWN", error: "Markdown får inte vara tom." });
  }

  if (markdown.length > maxMarkdownCharacters) {
    return res.status(413).json({
      code: "MARKDOWN_TOO_LARGE",
      error:
        "Artikeln är för stor för enkel admin-redigering. Dela upp den eller publicera via Git.",
    });
  }

  const updateResponse = await fetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      branch: GITHUB_BRANCH,
      message: `Update article ${path.replace(/^src\/content\/posts\//, "")}`,
      content: Buffer.from(`${markdown}\n`, "utf8").toString("base64"),
      sha: existingFile.sha,
    }),
  });

  if (!updateResponse.ok) {
    const details = await updateResponse.json().catch(() => undefined);
    console.error("[api/edit] GitHub update failed", {
      status: updateResponse.status,
      statusText: updateResponse.statusText,
      message: details?.message,
    });
    return res.status(updateResponse.status).json({
      code: "GITHUB_UPDATE_FAILED",
      error:
        details?.message ??
        "GitHub kunde inte spara filen. Kontrollera token och repo.",
    });
  }

  console.info("[api/edit] Article updated", path);
  return res.status(200).json({ ok: true, path });
}
