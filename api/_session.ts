import { createHmac, timingSafeEqual } from "node:crypto";

export const sessionCookieName = "anteckningsbiblioteket_admin";
const maxAgeSeconds = 60 * 60 * 24 * 30;

type RequestLike = {
  headers?: {
    cookie?: string;
  };
};

type ResponseLike = {
  setHeader(name: string, value: string | string[]): void;
};

function getSecret() {
  return process.env.ADMIN_PASSWORD ?? "";
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const [name, ...value] = cookie.split("=");
        return [name, decodeURIComponent(value.join("="))];
      }),
  );
}

export function createSessionValue() {
  const payload = JSON.stringify({
    createdAt: Date.now(),
    role: "admin",
  });
  const encodedPayload = Buffer.from(payload, "utf8").toString("base64url");

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function isValidSession(req: RequestLike) {
  const secret = getSecret();
  if (!secret) return false;

  const cookie = parseCookies(req.headers?.cookie)[sessionCookieName];
  if (!cookie) return false;

  const [payload, signature] = cookie.split(".");
  if (!payload || !signature) return false;

  const expectedSignature = sign(payload);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function setSessionCookie(res: ResponseLike) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  res.setHeader(
    "Set-Cookie",
    `${sessionCookieName}=${encodeURIComponent(createSessionValue())}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${maxAgeSeconds}`,
  );
}

export function clearSessionCookie(res: ResponseLike) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  res.setHeader(
    "Set-Cookie",
    `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=0`,
  );
}
