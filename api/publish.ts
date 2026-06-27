const slugPattern = /^[a-z0-9-]+$/;

type ApiRequest = {
  method?: string;
  body?: {
    password?: unknown;
    slug?: unknown;
    markdown?: unknown;
  };
};

type ApiResponse = {
  setHeader(name: string, value: string): void;
  status(code: number): {
    json(data: unknown): void;
  };
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Endast POST stöds." });
  }

  const {
    GITHUB_TOKEN,
    ADMIN_PASSWORD,
    GITHUB_REPO = "broklyn777/Anteckningsbiblioteket",
    GITHUB_BRANCH = "main",
  } = process.env;

  if (!GITHUB_TOKEN || !ADMIN_PASSWORD) {
    return res
      .status(500)
      .json({ error: "Servern saknar GITHUB_TOKEN eller ADMIN_PASSWORD." });
  }

  const password = String(req.body?.password ?? "");
  const slug = String(req.body?.slug ?? "").trim();
  const markdown = String(req.body?.markdown ?? "").trim();

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Fel adminlösenord." });
  }

  if (!slug) {
    return res.status(400).json({ error: "Slug får inte vara tom." });
  }

  if (!slugPattern.test(slug)) {
    return res.status(400).json({
      error: "Slug får bara innehålla små bokstäver, siffror och bindestreck.",
    });
  }

  if (!markdown) {
    return res.status(400).json({ error: "Markdown får inte vara tom." });
  }

  const path = `src/content/posts/${slug}.md`;
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
    return res.status(409).json({ error: `Filen finns redan: ${path}` });
  }

  if (existingResponse.status !== 404) {
    return res.status(502).json({
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
    return res.status(createResponse.status).json({
      error:
        details?.message ??
        "GitHub kunde inte skapa filen. Kontrollera token och repo.",
    });
  }

  return res.status(200).json({ ok: true, path });
}
