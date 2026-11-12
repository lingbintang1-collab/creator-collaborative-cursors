import { InfraiClient } from "./infrai_client.ts";
import { publishCursor } from "./cursor_service.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("INFRAI_API_KEY is required");
const sessionId = process.env.DOCUMENT_SESSION_ID;
if (!sessionId) throw new Error("DOCUMENT_SESSION_ID is required");

const result = await publishCursor(new InfraiClient(key), {
  sessionId,
  channel: process.env.DOCUMENT_CHANNEL ?? "creator-document",
  accountId: process.env.ACCOUNT_ID ?? "creator-account",
  editorId: process.env.EDITOR_ID ?? "editor-1",
  x: Number(process.env.CURSOR_X ?? "320"),
  y: Number(process.env.CURSOR_Y ?? "180")
});
console.log(JSON.stringify(result));
