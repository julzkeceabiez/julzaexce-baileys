import type { BinaryNode } from '../WABinary/index.js';
import type { proto } from '../../WAProto/index.js';
import type { InteractiveButton } from '../Types/index.js';
/** binary nodes that make WhatsApp render a button / list message; empty for any other message */
export declare const getButtonNodes: (jid: string, message: proto.IMessage) => BinaryNode[];
/** validates the interactiveButtons shorthand, throws a Boom 400 with a clear message */
export declare const validateInteractiveButtons: (buttons: InteractiveButton[]) => {
    name: string;
    buttonParamsJson: string;
}[];
export declare const applyButtons: (message: any, m: any, logger?: any) => any;
export declare const wrapInteractive: (m: any) => any;
/** 'user' | 'group' when button nodes apply to this jid, undefined otherwise */
export declare const getButtonChatType: (jid: string) => 'user' | 'group' | undefined;
