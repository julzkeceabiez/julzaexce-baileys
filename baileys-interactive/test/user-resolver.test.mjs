import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { makeUserResolver } from '../lib/Utils/user-resolver.js';
const ev = new EventEmitter();
let lookups = 0;
const signalRepository = { lidMapping: {
  getPNForLID: async lid => { lookups++; return lid === '111@lid' ? '6281@s.whatsapp.net' : null; },
  getLIDForPN: async pn => (pn === '6281@s.whatsapp.net' ? '111@lid' : null) } };
const authState = { creds: { me: { id: '6200:3@s.whatsapp.net', lid: '999:3@lid', name: 'Me' } } };
const r = makeUserResolver({ ev, signalRepository, authState });
assert.equal(await r.getPhoneNumber('6281:12@s.whatsapp.net'), '6281');          // PN with device
assert.equal(await r.getPhoneNumber('111@lid'), '6281');                          // via mapping
assert.equal(await r.getPhoneNumber('111:4@lid'), '6281'); assert.equal(lookups, 1); // cached, device ignored
assert.equal(await r.getPhoneNumber('222@lid'), undefined);                       // unknown
assert.equal(await r.getPhoneNumber('1@newsletter'), undefined);
assert.equal(await r.getPhoneNumber(''), undefined);
ev.emit('messages.upsert', { messages: [{ key: { remoteJid: '111@lid', remoteJidAlt: '6281@s.whatsapp.net' }, pushName: 'Budi' }] });
assert.equal(await r.getName('111@lid'), 'Budi'); assert.equal(await r.getName('6281@s.whatsapp.net'), 'Budi');
ev.emit('contacts.update', [{ id: '6281@s.whatsapp.net', name: 'Budi Kontak' }]);
assert.equal(await r.getName('111@lid'), 'Budi Kontak');                           // saved name wins
ev.emit('groups.upsert', [{ participants: [{ id: '333@lid', phoneNumber: '6282@s.whatsapp.net', notify: 'Sari' }] }]);
assert.equal(await r.getPhoneNumber('333@lid'), '6282'); assert.equal(await r.getName('6282@s.whatsapp.net'), 'Sari');
assert.equal(await r.getName('999@lid'), 'Me'); assert.equal(await r.getPhoneNumber('999@lid'), '6200');
const u = await r.resolve('111@lid'); assert.deepEqual([u.pn, u.lid, u.phoneNumber, u.isLid], ['6281@s.whatsapp.net', '111@lid', '6281', true]);
console.log('user resolver tests OK');
