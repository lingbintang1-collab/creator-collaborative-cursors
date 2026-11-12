import assert from "node:assert/strict";
import { InfraiClient } from "./infrai_client.ts";
import { publishCursor } from "./cursor_service.ts";

const calls: Array<{ path: string; method: string; body?: Record<string, unknown> }> = [];
const client = new InfraiClient("test-key");
client.request = async (path, method, body) => {
  calls.push({ path, method, body });
  return { accepted: true };
};

const result = await publishCursor(client, {
  sessionId: "session-7", channel: "doc-7", accountId: "acct-7", editorId: "editor-7", x: 12, y: 34
});
assert.equal(result.event, "cursor.moved");
assert.deepEqual(calls.map((call) => [call.method, call.path]), [
  ["GET", "/v1/auth/session/verify/session-7"],
  ["POST", "/v1/realtime/channel/create"],
  ["POST", "/v1/realtime/publish"]
]);
assert.equal(calls[2].body?.account_id, "acct-7");
console.log("cursor decision test passed");
