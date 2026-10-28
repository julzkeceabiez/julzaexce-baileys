import type { UserFacingSocketConfig } from '../Types/index.js';
import type { UserResolver } from '../Utils/user-resolver.js';
import type { makeCommunitiesSocket } from './communities.js';
export type BaseSocket = ReturnType<typeof makeCommunitiesSocket>;
declare const makeWASocket: (config: UserFacingSocketConfig) => BaseSocket & {
    /** LID or JID -> { pn, lid, phoneNumber, name }; absent when userResolver: false */
    resolveUser: UserResolver['resolve'];
    /** LID or JID -> phone number digits */
    getPhoneNumber: UserResolver['getPhoneNumber'];
    /** LID or JID -> saved name or WhatsApp name */
    getName: UserResolver['getName'];
};
export default makeWASocket;
//# sourceMappingURL=index.d.ts.map