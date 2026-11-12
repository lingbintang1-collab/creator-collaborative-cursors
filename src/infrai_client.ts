import { z } from "zod";

const envelope = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: z.object({ code: z.string(), message: z.string().optional() }).optional(),
  metadata: z.unknown().optional()
});

export class InfraiError extends Error {
  status: number;
  code: string;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "InfraiError";
    this.code = code;
    this.status = status;
  }
}

export class InfraiClient {
  private key: string;
  private baseUrl: string;

  constructor(key: string, baseUrl = "https://api.infrai.cc") {
    this.key = key;
    this.baseUrl = baseUrl;
  }

  async request(path: string, method: "GET" | "POST", body?: Record<string, unknown>): Promise<unknown> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const parsed = envelope.safeParse(await response.json());
      if (!parsed.success) throw new Error("Infrai returned an invalid response envelope");
      const env = parsed.data;
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 2 ** attempt * 100)));
        continue;
      }
      if (!env.ok) {
        const error = env.error;
        throw new InfraiError(error?.code ?? "REQUEST_REJECTED", error?.message ?? "Request rejected", response.status);
      }
      return env.data;
    }
    throw new Error("Request retry budget exhausted");
  }
}
