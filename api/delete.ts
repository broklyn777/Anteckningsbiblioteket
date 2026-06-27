const deletablePostPattern = /^src\/content\/posts\/[a-z0-9-]+\.(md|mdx)$/;

type ApiRequest = {
  method?: string;
  body?:
    | string
    | {
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
      password?: unknown;
      path?: unknown;
    };
  }

  return body ?? {};
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    console.warn("[api/delete] Method not allowed", req.method);
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
    console.error("[api/delete] Missing env", {
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
    console.warn("[api/delete] Invalid JSON body");
    return res.status(400).json({ code: "INVALID_JSON", error: "Ogiltig JSON." });
  }

  const password = String(body.password ?? "");
  const path = String(body.path ?? "").trim();

  if (password !== ADMIN_PASSWORD) {
    console.warn("[api/delete] Invalid password");
    return res
      .status(401)
      .json({ code: "INVALID_PASSWORD", error: "Fel adminlösenord." });
  }

  if (!deletablePostPattern.test(path)) {
    return res.status(400).json({
      code: "INVALID_PATH",
      error: "Endast artiklar i src/content/posts/ kan raderas här.",
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
    console.error("[api/delete] GitHub lookup failed", {
      status: existingResponse.status,
      statusText: existingResponse.statusText,
    });
    return res.status(502).json({
      code: "GITHUB_LOOKUP_FAILED",
      error: "Kunde inte hämta artikeln från GitHub.",
    });
  }

  const existingFile = (await existingResponse.json()) as { sha?: string };

  if (!existingFile.sha) {
    console.error("[api/delete] Missing sha", path);
    return res.status(502).json({
      code: "GITHUB_MISSING_SHA",
      error: "GitHub svarade utan filens sha.",
    });
  }

  const deleteResponse = await fetch(apiUrl, {
    method: "DELETE",
    headers,
    body: JSON.stringify({
      branch: GITHUB_BRANCH,
      message: `Delete article ${path.replace(/^src\/content\/posts\//, "")}`,
      sha: existingFile.sha,
    }),
  });

  if (!deleteResponse.ok) {
    const details = await deleteResponse.json().catch(() => undefined);
    console.error("[api/delete] GitHub delete failed", {
      status: deleteResponse.status,
      statusText: deleteResponse.statusText,
      message: details?.message,
    });
    return res.status(deleteResponse.status).json({
      code: "GITHUB_DELETE_FAILED",
      error:
        details?.message ??
        "GitHub kunde inte radera filen. Kontrollera token och repo.",
    });
  }

  console.info("[api/delete] Article deleted", path);
  return res.status(200).json({ ok: true, path });
}
