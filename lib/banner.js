// Banner shown once on import. Repo owners: change BANNER_LINES (or paste your own text) here.
// Disable with the environment variable BAILEYS_NO_BANNER=1.
export const PACKAGE_NAME = 'baileys-interactive';
export const PACKAGE_VERSION = '7.0.0-rc14.1';
export const BANNER_LINES = [`${PACKAGE_NAME} v${PACKAGE_VERSION} (based on @whiskeysockets/baileys 7.0.0-rc14)`];
const FLAG = Symbol.for('baileys.banner.printed');
export const printBanner = () => {
    try {
        if (process.env.BAILEYS_NO_BANNER || globalThis[FLAG]) {
            return;
        }
        globalThis[FLAG] = true;
        console.log(BANNER_LINES.join('\n'));
    }
    catch {
        // no stdout available, nothing to do
    }
};
