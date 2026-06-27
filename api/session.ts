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
  const authenticated = isValidSession(req);
  return res.status(200).json({ authenticated });
}
