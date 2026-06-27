import { clearSessionCookie } from "./_session";

type ApiRequest = {
  method?: string;
};

type ApiResponse = {
  setHeader(name: string, value: string | string[]): void;
  status(code: number): {
    json(data: unknown): void;
  };
};

export default function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Endast POST stöds." });
  }

  clearSessionCookie(res);
  return res.status(200).json({ ok: true });
}
