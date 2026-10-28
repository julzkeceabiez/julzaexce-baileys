import { DEFAULT_CONNECTION_CONFIG } from '../Defaults/index.js';
import { makeUserResolver } from '../Utils/user-resolver.js';
import { makeCommunitiesSocket } from './communities.js';
// export the last socket layer
const makeWASocket = (config) => {
    const newConfig = {
        ...DEFAULT_CONNECTION_CONFIG,
        ...config
    };
    const sock = makeCommunitiesSocket(newConfig);
    if (newConfig.userResolver !== false) {
        const resolver = makeUserResolver({
            ev: sock.ev,
            signalRepository: sock.signalRepository,
            authState: sock.authState,
            logger: newConfig.logger
        });
        Object.assign(sock, {
            resolveUser: resolver.resolve,
            getPhoneNumber: resolver.getPhoneNumber,
            getName: resolver.getName
        });
    }
    return sock;
};
export default makeWASocket;
//# sourceMappingURL=index.js.map