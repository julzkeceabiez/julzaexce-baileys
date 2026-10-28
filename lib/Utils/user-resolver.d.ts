export type ResolvedUser = {
    input: string;
    /** phone number JID (@s.whatsapp.net) when known */
    pn?: string;
    /** LID (@lid) when known */
    lid?: string;
    /** digits only, e.g. "62812..." */
    phoneNumber?: string;
    /** saved contact name, otherwise the name the user set on WhatsApp */
    name?: string;
    isPn: boolean;
    isLid: boolean;
};
export type UserResolver = {
    resolve: (jid: string) => Promise<ResolvedUser>;
    getPhoneNumber: (jid: string) => Promise<string | undefined>;
    getName: (jid: string) => Promise<string | undefined>;
    getPnJid: (jid: string) => Promise<string | undefined>;
    getLidJid: (jid: string) => Promise<string | undefined>;
};
export declare const makeUserResolver: (opts: {
    ev: any;
    signalRepository: any;
    authState?: any;
    logger?: any;
    maxEntries?: number;
}) => UserResolver;
