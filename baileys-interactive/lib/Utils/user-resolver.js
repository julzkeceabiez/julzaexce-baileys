import { isLidUser, isPnUser, jidDecode } from '../WABinary/jid-utils.js';
// Turns a LID or JID into the user's phone number and WhatsApp name.
// Only reads what the socket already receives (events) and the existing LID mapping store.
const keyOf = (jid) => {
    const decoded = typeof jid === 'string' ? jidDecode(jid.trim()) : undefined;
    if (!decoded?.user) {
        return undefined;
    }
    const server = decoded.server === 'c.us' ? 's.whatsapp.net' : decoded.server;
    return { key: `${decoded.user}@${server}`, user: decoded.user, server };
};
const pnKey = (jid) => {
    const k = keyOf(jid);
    return k && k.server === 's.whatsapp.net' ? k.key : undefined;
};
const lidKey = (jid) => {
    const k = keyOf(jid);
    return k && k.server === 'lid' ? k.key : undefined;
};
export const makeUserResolver = ({ ev, signalRepository, authState, logger, maxEntries = 5000 }) => {
    const names = new Map(); // key -> { notify, name, verifiedName, username }
    const pnByLid = new Map();
    const lidByPn = new Map();
    const touch = (map, key, value) => {
        map.delete(key);
        map.set(key, value);
        if (map.size > maxEntries) {
            map.delete(map.keys().next().value);
        }
    };
    const learnPair = (a, b) => {
        const pn = pnKey(a) || pnKey(b);
        const lid = lidKey(a) || lidKey(b);
        if (pn && lid) {
            touch(pnByLid, lid, pn);
            touch(lidByPn, pn, lid);
        }
    };
    const learnName = (jid, info) => {
        const k = keyOf(jid)?.key;
        if (!k) {
            return;
        }
        const next = { ...(names.get(k) || {}) };
        for (const field of ['notify', 'name', 'verifiedName', 'username']) {
            if (info[field]) {
                next[field] = info[field];
            }
        }
        touch(names, k, next);
    };
    const learnContact = (c) => {
        if (!c) {
            return;
        }
        learnPair(c.id, c.lid);
        learnPair(c.id, c.phoneNumber);
        for (const id of [c.id, c.lid, c.phoneNumber]) {
            if (id) {
                learnName(id, c);
            }
        }
    };
    const safe = (fn) => (...args) => {
        try {
            fn(...args);
        }
        catch (err) {
            logger?.debug?.({ err: err?.message }, 'user resolver failed to read an event');
        }
    };
    ev.on('contacts.upsert', safe(list => list.forEach(learnContact)));
    ev.on('contacts.update', safe(list => list.forEach(learnContact)));
    ev.on('lid-mapping.update', safe(m => learnPair(m?.lid, m?.pn)));
    ev.on('groups.upsert', safe(list => list.forEach(g => g.participants?.forEach(learnContact))));
    ev.on('messages.upsert', safe(({ messages }) => {
        for (const msg of messages) {
            const sender = msg.key.participant || msg.key.remoteJid;
            const alt = msg.key.participantAlt || msg.key.remoteJidAlt;
            if (sender && alt) {
                learnPair(sender, alt);
            }
            if (msg.pushName && !msg.key.fromMe && sender) {
                learnName(sender, { notify: msg.pushName });
                if (alt) {
                    learnName(alt, { notify: msg.pushName });
                }
            }
        }
    }));
    const getPnJid = async (jid) => {
        const k = keyOf(jid);
        if (!k) {
            return undefined;
        }
        if (k.server === 's.whatsapp.net') {
            return k.key;
        }
        if (k.server !== 'lid') {
            return undefined;
        }
        const cached = pnByLid.get(k.key);
        if (cached) {
            return cached;
        }
        try {
            const pn = await signalRepository.lidMapping.getPNForLID(k.key);
            const found = pnKey(pn);
            if (found) {
                learnPair(found, k.key);
            }
            return found;
        }
        catch (err) {
            logger?.debug?.({ err: err?.message }, 'LID to PN lookup failed');
            return undefined;
        }
    };
    const getLidJid = async (jid) => {
        const k = keyOf(jid);
        if (!k) {
            return undefined;
        }
        if (k.server === 'lid') {
            return k.key;
        }
        if (k.server !== 's.whatsapp.net') {
            return undefined;
        }
        const cached = lidByPn.get(k.key);
        if (cached) {
            return cached;
        }
        try {
            const lid = await signalRepository.lidMapping.getLIDForPN(k.key);
            const found = lidKey(lid);
            if (found) {
                learnPair(k.key, found);
            }
            return found;
        }
        catch (err) {
            logger?.debug?.({ err: err?.message }, 'PN to LID lookup failed');
            return undefined;
        }
    };
    const own = () => {
        const me = authState?.creds?.me;
        if (me) {
            learnPair(me.id, me.lid);
            if (me.name) {
                for (const id of [me.id, me.lid]) {
                    if (id) {
                        learnName(id, { notify: me.name });
                    }
                }
            }
        }
    };
    /** phone number as digits only (e.g. "62812..."), or undefined when not known */
    const getPhoneNumber = async (jid) => {
        own();
        const pn = await getPnJid(jid);
        return pn ? pn.split('@')[0] : undefined;
    };
    /** best known display name: saved contact name, then the name the user set on WhatsApp */
    const getName = async (jid) => {
        own();
        const ids = [keyOf(jid)?.key, await getPnJid(jid), await getLidJid(jid)];
        for (const field of ['name', 'verifiedName', 'notify']) {
            for (const id of ids) {
                const value = id && names.get(id)?.[field];
                if (value) {
                    return value;
                }
            }
        }
        return undefined;
    };
    /** everything known about a user in one object */
    const resolve = async (jid) => {
        own();
        const pn = await getPnJid(jid);
        const lid = await getLidJid(jid);
        return {
            input: jid,
            pn,
            lid,
            phoneNumber: pn ? pn.split('@')[0] : undefined,
            name: await getName(jid),
            isPn: isPnUser(jid),
            isLid: isLidUser(jid)
        };
    };
    return { resolve, getPhoneNumber, getName, getPnJid, getLidJid };
};
