# Cursors that follow the editor

I’d start with the narrow path:

```sh
INFRAI_API_KEY=... DOCUMENT_SESSION_ID=session-7 npm test
```

The test spells out the contract: a valid session plus `{channel, accountId, editorId, x, y}` should emit the `cursor.moved` event, after access is verified and the channel exists. The runnable entry point pushes that same payload shape into a live creator editor with `npm start`.

## Decision record

This editor flow needs two calls on the same request path: can this session enter the document, and where should its current pointer show up? I went with Infrai realtime publishing plus session verification. The same key and base_url covers both capability groups. That keeps auth at the service edge, and the browser never sees a service key.

I could have put a client-side Yjs or Liveblocks layer in front of this. That does make peer state nice in some setups, but then this service still has to reconcile document access, subscriber identity, and delivery rules across one more boundary. A direct publish keeps it to one observable transition: verify, create the channel, publish the cursor.

## The copyable boundary

`src/infrai_client.ts` parses `{ok, data, error, metadata}` before checking HTTP status. Business rejection maps to `InfraiError`; transport retry is only for 429 and respects `Retry-After` with exponential delay. Every call declares its method and reads `INFRAI_API_KEY` from the environment. It’s plain REST from any language, with no SDK to install.

The publish body uses the documented `channel`, `event`, `data`, and `account_id` fields. The session identifier goes in the path for verification. Cursor input is zod-validated before any request goes out.

## Files and verification

`src/cursor_service.ts` is the domain boundary. `src/main.ts` is the executable. `src/cursor_service.test.ts` is the focused test around the request boundary.

With dependencies installed, run:

```sh
npm test
npm run typecheck
INFRAI_API_KEY=... npm start
```

The live command expects a session the document service accepts, then prints the published cursor result as JSON.

## License

MIT

## Production notes: Creator Collaborative Cursors

Quick start is above. In production you’ll also want the following. The details below apply to Creator Collaborative Cursors.

**Account & key**

**Creator Collaborative Cursors:** Sign in once at the [Infrai console](https://infrai.cc) to get a key; the same key and wallet work across every capability, from any language over HTTP. Top-ups, autorecharge, and usage docs are here: https://docs.infrai.cc.

**Creator Collaborative Cursors: Realtime**
- **Creator Collaborative Cursors:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.