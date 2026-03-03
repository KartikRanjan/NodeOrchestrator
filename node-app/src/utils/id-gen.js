import { createHash } from 'crypto';
import os from 'os';
import { pathToFileURL } from 'url';

/**
 * Generates a stable 12-character hex ID.
 * If an index is provided (local script), it uses hostname:index.
 * Otherwise (Docker), it uses the container's hostname.
 */
function getStableId(index) {
    const seed = index ? `${os.hostname()}:${index}` : os.hostname();
    return createHash('sha256')
        .update(seed)
        .digest('hex')
        .slice(0, 12);
}

// ESM equivalent of `require.main === module`
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    const index = process.argv[2];
    console.log(getStableId(index));
}

export default getStableId;
