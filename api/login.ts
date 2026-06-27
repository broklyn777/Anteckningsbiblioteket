import { setSessionCookie } from "./_session";

type ApiRequest = {
  method?: string;
  body?: string | { password?: unknown };
};

type ApiResponse = {
  setHeader(name: string, value: string | string[]): void;
  status(code: number): {
    json(data: unknown): void;
  };
};

function parseBody(body: ApiRequest["body"]) {
  if (typeof body === "string") {
    return JSON.parse(body) as { password?: unknown };
  }

  return body ?? {};
}

export default function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Endast POST stöds." });
  }

  const { ADMIN_PASSWORD } = process.env;

  if (!ADMIN_PASSWORD) {
    return res.status(500).json({ error: "Servern saknar ADMIN_PASSWORD." });
  }

  let body: ReturnType<typeof parseBody>;

  try {
    body = parseBody(req.body);
  } catch {
    return res.status(400).json({ error: "Ogiltig JSON." });
  }

  if (String(body.password ?? "") !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Fel adminlösenord." });
  }

  setSessionCookie(res);
  return res.status(200).json({ ok: true });
}
