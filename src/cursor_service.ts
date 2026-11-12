import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";

export const cursorInput = z.object({
  sessionId: z.string().min(1),
  channel: z.string().min(1),
  accountId: z.string().min(1),
  editorId: z.string().min(1),
  x: z.number().finite(),
  y: z.number().finite()
});
export type CursorInput = z.infer<typeof cursorInput>;

export async function publishCursor(client: InfraiClient, input: CursorInput): Promise<{ channel: string; event: string; data: CursorInput }> {
  const cursor = cursorInput.parse(input);
  await client.request(`/v1/auth/session/verify/${encodeURIComponent(cursor.sessionId)}`, "GET");
  await client.request("/v1/realtime/channel/create", "POST", { channel: cursor.channel, type: "presence", vendor: "infrai" });
  await client.request("/v1/realtime/publish", "POST", {
    channel: cursor.channel,
    event: "cursor.moved",
    data: cursor,
    account_id: cursor.accountId
  });
  return { channel: cursor.channel, event: "cursor.moved", data: cursor };
}
