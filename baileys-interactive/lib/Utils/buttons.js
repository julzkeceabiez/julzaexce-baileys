import { Boom } from '@hapi/boom';
import { isJidBroadcast, isJidGroup, isJidMetaAI, isJidNewsletter, isJidBot, isLidUser, isPnUser, jidDecode } from '../WABinary/jid-utils.js';
// Button and interactive message support, added on top of upstream Baileys.
// Self contained on purpose: nothing here touches login, keys, or receipts.
const HEADER_EMPTY = 1;
const HEADER_TEXT = 2;
const HEADER_DOCUMENT = 3;
const HEADER_IMAGE = 4;
const HEADER_VIDEO = 5;
const WRAPPERS = [
    'ephemeralMessage',
    'viewOnceMessage',
    'viewOnceMessageV2',
    'viewOnceMessageV2Extension',
    'documentWithCaptionMessage',
    'editedMessage'
];
const NATIVE_FLOW_BUTTONS = ['quick_reply', 'cta_url', 'cta_copy', 'cta_call', 'single_select', 'send_location'];
// Fields each native flow button needs inside buttonParamsJson
const NATIVE_FLOW_REQUIRED = {
    quick_reply: ['display_text', 'id'],
    cta_url: ['display_text', 'url'],
    cta_copy: ['display_text', 'copy_code'],
    cta_call: ['display_text', 'phone_number'],
    single_select: ['title', 'sections'],
    send_location: []
};
const unwrap = (message) => {
    // bounded loop, same limit as normalizeMessageContent
    for (let i = 0; i < 5 && message; i++) {
        const key = WRAPPERS.find(k => message[k]?.message);
        if (!key) {
            break;
        }
        message = message[key].message;
    }
    return message;
};
/**
 * Where a message can carry button nodes: 'user' (PN or LID, with or without device suffix),
 * 'group', or undefined for everything else (newsletter, status/broadcast, bots, hosted, malformed).
 */
export const getButtonChatType = (jid) => {
    if (typeof jid !== 'string' || !jid) {
        return undefined;
    }
    jid = jid.trim();
    if (isJidNewsletter(jid) || isJidBroadcast(jid) || isJidMetaAI(jid) || isJidBot(jid)) {
        return undefined;
    }
    const decoded = jidDecode(jid);
    if (!decoded?.user) {
        return undefined;
    }
    if (isJidGroup(jid)) {
        return 'group';
    }
    return isPnUser(jid) || isLidUser(jid) ? 'user' : undefined;
};
/**
 * Returns the binary nodes WhatsApp expects next to a button / list message.
 * Any other message type returns an empty array, so nothing changes for it.
 */
export const getButtonNodes = (jid, message) => {
    const inner = unwrap(message);
    const chatType = getButtonChatType(jid);
    if (!inner || !chatType) {
        return [];
    }
    const isGroup = chatType === 'group';
    let biz;
    if (inner.buttonsMessage || inner.interactiveMessage?.nativeFlowMessage) {
        biz = {
            tag: 'biz',
            attrs: {},
            content: [
                {
                    tag: 'interactive',
                    attrs: { type: 'native_flow', v: '1' },
                    content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
                }
            ]
        };
    }
    else if (inner.listMessage) {
        biz = {
            tag: 'biz',
            attrs: {},
            content: [{ tag: 'list', attrs: { type: 'product_list', v: '2' } }]
        };
    }
    if (!biz) {
        return [];
    }
    return isGroup ? [biz] : [biz, { tag: 'bot', attrs: { biz_bot: '1' } }];
};
/** Validates the interactiveButtons shorthand and returns native flow buttons */
export const validateInteractiveButtons = (buttons) => {
    if (!Array.isArray(buttons) || buttons.length === 0) {
        throw new Boom('interactiveButtons must be a non empty array', { statusCode: 400 });
    }
    return buttons.map((button, i) => {
        const name = button?.name;
        if (!NATIVE_FLOW_BUTTONS.includes(name)) {
            throw new Boom(`interactiveButtons[${i}].name must be one of: ${NATIVE_FLOW_BUTTONS.join(', ')}`, {
                statusCode: 400
            });
        }
        let params = button.buttonParamsJson;
        if (params && typeof params === 'object') {
            params = JSON.stringify(params);
        }
        if (typeof params !== 'string') {
            throw new Boom(`interactiveButtons[${i}].buttonParamsJson must be a JSON string or an object`, {
                statusCode: 400
            });
        }
        let parsed;
        try {
            parsed = JSON.parse(params);
        }
        catch {
            throw new Boom(`interactiveButtons[${i}].buttonParamsJson is not valid JSON`, { statusCode: 400 });
        }
        const missing = NATIVE_FLOW_REQUIRED[name].filter(field => parsed?.[field] === undefined || parsed[field] === '');
        if (missing.length) {
            throw new Boom(`interactiveButtons[${i}] (${name}) is missing: ${missing.join(', ')}`, { statusCode: 400 });
        }
        return { name, buttonParamsJson: params };
    });
};
const MEDIA_KEYS = [
    ['imageMessage', 'imageMessage', HEADER_IMAGE],
    ['videoMessage', 'videoMessage', HEADER_VIDEO],
    ['documentMessage', 'documentMessage', HEADER_DOCUMENT]
];
const findMedia = (m) => {
    for (const [key, field, headerType] of MEDIA_KEYS) {
        if (m[key]) {
            return { field, headerType, media: m[key] };
        }
    }
    return undefined;
};
const hasButtonInput = (message) => !!(message &&
    typeof message === 'object' &&
    (message.interactiveButtons || message.buttons || message.templateButtons || message.sections));
/**
 * Turns the plain content generated by upstream (text or media) into a button
 * message. `message` is what the caller passed to sendMessage, `m` is the
 * upstream result. Returns `m` untouched when the input has no button fields.
 */
export const applyButtons = (message, m, logger) => {
    if (!hasButtonInput(message)) {
        return m;
    }
    // invalid input from the caller is reported; anything unexpected falls back to upstream
    if (message.interactiveButtons) {
        validateInteractiveButtons(message.interactiveButtons);
    }
    try {
        const text = m.extendedTextMessage?.text ?? m.conversation;
        const media = findMedia(m);
        const body = text ?? media?.media.caption ?? '';
        const contextInfo = m.extendedTextMessage?.contextInfo;
        const footer = message.footer;
        if (message.interactiveButtons) {
            const header = { title: message.title ?? '', subtitle: message.subtitle ?? '', hasMediaAttachment: false };
            if (media) {
                header.hasMediaAttachment = true;
                header[media.field] = { ...media.media, caption: undefined };
            }
            return {
                interactiveMessage: {
                    header,
                    body: { text: body },
                    footer: footer ? { text: footer } : undefined,
                    nativeFlowMessage: {
                        buttons: validateInteractiveButtons(message.interactiveButtons),
                        messageParamsJson: message.messageParamsJson ?? ''
                    },
                    contextInfo
                }
            };
        }
        if (message.buttons) {
            const buttonsMessage = {
                contentText: body,
                footerText: footer,
                buttons: message.buttons,
                headerType: message.headerType ?? HEADER_EMPTY
            };
            if (media) {
                buttonsMessage[media.field] = { ...media.media, caption: undefined };
                buttonsMessage.headerType = message.headerType ?? media.headerType;
            }
            else if (message.title) {
                buttonsMessage.text = message.title;
                buttonsMessage.headerType = message.headerType ?? HEADER_TEXT;
            }
            if (contextInfo) {
                buttonsMessage.contextInfo = contextInfo;
            }
            return { buttonsMessage };
        }
        if (message.templateButtons) {
            const hydratedTemplate = {
                hydratedButtons: message.templateButtons,
                hydratedContentText: body,
                hydratedFooterText: footer,
                hydratedTitleText: message.title
            };
            if (media) {
                hydratedTemplate[media.field] = { ...media.media, caption: undefined };
            }
            return { templateMessage: { hydratedTemplate, hydratedFourRowTemplate: hydratedTemplate, contextInfo } };
        }
        if (message.sections) {
            return {
                listMessage: {
                    title: message.title,
                    description: body,
                    buttonText: message.buttonText,
                    footerText: footer,
                    listType: 1,
                    sections: message.sections,
                    contextInfo
                }
            };
        }
    }
    catch (err) {
        logger?.warn?.({ err: err?.message }, 'failed to build button message, sending as plain message');
    }
    return m;
};
/**
 * Native flow messages are wrapped the way WhatsApp clients expect.
 * Called after mentions / contextInfo were applied to the top level message.
 */
export const wrapInteractive = (m) => {
    if (!m?.interactiveMessage || m.viewOnceMessage) {
        return m;
    }
    return {
        viewOnceMessage: {
            message: {
                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                ...m
            }
        }
    };
};
