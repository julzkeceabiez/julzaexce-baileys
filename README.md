# baileys-interactive

`@whiskeysockets/baileys` **7.0.0-rc14** plus working button / interactive messages. Same API, same exports, same connection code as upstream. Credit and license: Baileys / WhiskeySockets, MIT (see `LICENSE`).

> Unofficial WhatsApp clients can get accounts restricted or banned, whatever library you use. Nothing here guarantees otherwise. Test on a spare number first and send buttons at a human pace.

## Install

Node 20+ (upstream requirement).

```bash
npm i github:<user>/<repo>
# or as a drop-in replacement, no code changes in an existing bot:
```
```json
{ "dependencies": { "@whiskeysockets/baileys": "npm:baileys-interactive@7.0.0-rc14.1" } }
```
Or with a git source: `"@whiskeysockets/baileys": "github:<user>/<repo>"`. The built `lib/` is committed, nothing is built at install time.

## Use

ESM / TypeScript:
```js
import makeWASocket, { Browsers, DisconnectReason, proto } from 'baileys-interactive'
```
ESM only, like upstream rc14. From CommonJS use `const { default: makeWASocket } = await import('baileys-interactive')`.

### Buttons

```js
// native flow (recommended)
await sock.sendMessage(jid, {
  text: 'Pick one',
  footer: 'footer',
  interactiveButtons: [
    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Yes', id: 'yes' }) },
    { name: 'cta_url', buttonParamsJson: { display_text: 'Open', url: 'https://example.com' } }
  ]
})
// legacy
await sock.sendMessage(jid, { text: 'Pick', footer: 'f', buttons: [{ buttonId: 'a', buttonText: { displayText: 'A' }, type: 1 }] })
// list
await sock.sendMessage(jid, { text: 'Menu', title: 'Title', buttonText: 'Open', sections: [{ title: 'S', rows: [{ title: 'Row', rowId: 'r1' }] }] })
```
Supported `interactiveButtons` names: `quick_reply`, `cta_url`, `cta_copy`, `cta_call`, `single_select`, `send_location`. Bad input throws a `Boom` 400 with a clear message; any unexpected failure while building falls back to a plain message.

Images, videos and documents work too (`image` + `caption` + buttons). Replies arrive in `messages.upsert` as `buttonsResponseMessage`, `listResponseMessage` or `interactiveResponseMessage`.

Turn it off: `makeWASocket({ buttons: false })` gives exact upstream behaviour. Silence the banner: `BAILEYS_NO_BANNER=1`; owners change it in `lib/banner.js`.

Caveat: WhatsApp decides what renders. Native flow is the most reliable format today; legacy `buttons` / lists may not show on every account type or client.

### LID / JID to number and name

```js
await sock.getPhoneNumber('123456789012345@lid')   // '62812...' or undefined
await sock.getName(msg.key.participant)            // saved name, else the name the user set on WhatsApp
await sock.resolveUser(jid)                        // { pn, lid, phoneNumber, name, isPn, isLid }
```
Names come from messages (`pushName`), `contacts.*` and group participants seen by the socket, so a name is only known after WhatsApp has sent it. LID to number uses the LID mapping store of upstream (which may ask WhatsApp, as upstream already does when sending). Disable with `makeWASocket({ userResolver: false })`.

## Tests

`npm test` runs the unit tests for the node builder (private, group, ephemeral, viewOnce, plain = empty).
