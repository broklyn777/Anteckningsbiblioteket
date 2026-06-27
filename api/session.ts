import { isValidSession } from "./_session";

type ApiRequest = {
  headers?: {
    cookie?: string;
  };
};

type ApiResponse = {
  status(code: number): {
    json(data: unknown): void;
  };
};

export default function handler(req: ApiRequest, res: ApiResponse) {
  return res.status(200).json({ authenticated: isValidSession(req) });
}
