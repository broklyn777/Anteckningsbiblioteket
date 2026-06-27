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
    console.warn("[api/login] Method not allowed", req.method);
    res.setHeader("Allow", "POST");
    return res
      .status(405)
      .json({ code: "METHOD_NOT_ALLOWED", error: "Endast POST stöds." });
  }

  const { ADMIN_PASSWORD } = process.env;

  if (!ADMIN_PASSWORD) {
    console.error("[api/login] Missing ADMIN_PASSWORD");
    return res.status(500).json({
      code: "MISSING_ADMIN_PASSWORD",
      error: "Servern saknar ADMIN_PASSWORD.",
    });
  }

  let body: ReturnType<typeof parseBody>;

  try {
    body = parseBody(req.body);
  } catch {
    console.warn("[api/login] Invalid JSON body");
    return res.status(400).json({ code: "INVALID_JSON", error: "Ogiltig JSON." });
  }

  if (String(body.password ?? "") !== ADMIN_PASSWORD) {
    console.warn("[api/login] Invalid password");
    return res
      .status(401)
      .json({ code: "INVALID_PASSWORD", error: "Fel adminlösenord." });
  }

  console.info("[api/login] Login successful");
  setSessionCookie(res);
  return res.status(200).json({ ok: true });
}
