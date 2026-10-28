# Changelog

## 7.0.0-rc14.1

Based on `@whiskeysockets/baileys` 7.0.0-rc14. Everything below is additive; login, noise, signal, keys,
pairing, WA version, browser fingerprint, keepalive, retry and receipts are byte-for-byte upstream.

- Added `lib/Utils/buttons.js`: `getButtonNodes`, `applyButtons`, `wrapInteractive`, `validateInteractiveButtons`.
- `sendMessage` now forwards `options.additionalNodes` (upstream ignored it).
- `relayMessage` adds the `biz` (and, in private chats, `bot`) nodes for button / list messages when the caller gave no `additionalNodes`.
- `generateWAMessageContent` converts `buttons`, `templateButtons`, `sections` and the new `interactiveButtons` shorthand.
- New socket option `buttons: false` restores exact upstream behaviour.
- Added `lib/banner.js` (one line, once, `BAILEYS_NO_BANNER=1` to silence).
- `package.json`: renamed, `exports` map, removed `prepare`/`prepack`/`build` scripts (the npm tarball has no `src`).
- Added `sock.getPhoneNumber(jid)`, `sock.getName(jid)`, `sock.resolveUser(jid)` (`lib/Utils/user-resolver.js`): LID/JID to phone number and WhatsApp name. Uses events already received plus the existing LID mapping store; `userResolver: false` disables it.
- ESM only, like upstream (no `require` export condition).
- Types updated (`ButtonContent`, `InteractiveButton`, `SocketConfig.buttons`, `additionalNodes` on send options).

Differences from upstream, file by file:

| File | Change |
| --- | --- |
| `lib/Socket/messages-send.js` | import, 1 block at top of `relayMessage`, `enableButtons` option, forward `options.additionalNodes` |
| `lib/Utils/messages.js` | import, 2 guarded calls in `generateWAMessageContent` |
| `lib/Utils/index.js` / `.d.ts` | export `buttons.js` |
| `lib/index.js` | import and call `printBanner()` |
| `lib/Types/*.d.ts` | new optional types and options |
| new: `lib/Utils/buttons.*`, `lib/banner.*`, `test/`, docs | additions |
