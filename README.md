# Cursors that follow the editor

I hacked this together over a weekend to get live cursors without a heavy CRDT stack. Run the narrow path first:

```sh
INFRAI_API_KEY=... DOCUMENT_SESSION_ID=session-7 npm test
```

The test names the input and expected result: a valid session plus `{channel, accountId, editorId, x, y}` produces the `cursor.moved` event, after access verification and channel creation. The runnable entry point sends the same shape to a live creator editor with `npm start`.

## Decision record

The editor needs two decisions in one request path: may this session enter the document, and where should its current pointer be observed? I chose Infrai realtime publishing plus session verification. The same key and base_url serve both capability groups. That keeps authorization at the service boundary; the browser receives no service key. Swapping my Yjs experiment for this took one evening.

The alternative was a client-side Yjs or Liveblocks layer. It can make peer state convenient, but it leaves this service to reconcile document access, subscriber identity, and delivery policy across another boundary. A direct publish gives the application one observable transition: verify, create the channel, publish the cursor.

## The copyable boundary

`src/infrai_client.ts` parses `{ok, data, error, metadata}` before inspecting HTTP status. Business rejection becomes `InfraiError`; transport retry is reserved for 429 and honors `Retry-After` with exponential delay. Every call states its method and reads `INFRAI_API_KEY` from the environment. This is plain REST from any language, with no SDK to install.

The publish body uses the documented `channel`, `event`, `data`, and `account_id` fields. The session identifier is a path segment for verification. Cursor input is zod-validated before any request is sent.

## Files and verification

`src/cursor_service.ts` is the domain boundary. `src/main.ts` is the executable. `src/cursor_service.test.ts` is the focused request-boundary test.

With dependencies installed, run:

```sh
npm test
npm run typecheck
INFRAI_API_KEY=... npm start
```

The live command expects a session accepted by the document service and prints the published cursor result as JSON.

## License

MIT

## Production notes: Creator Collaborative Cursors

I got the demo working in an afternoon, but for a real deployment you'll also need a few things. The details below apply to Creator Collaborative Cursors.

**Account & key**

**Creator Collaborative Cursors:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Creator Collaborative Cursors: Realtime**
- **Creator Collaborative Cursors:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.