/**
 * Socket.IO Event Constants
 * @module events
 * @description Centralized event name definitions for Node App Socket.IO client.
 * Independently maintained — no shared code with CMS.
 */

// ── Outbound: Node → CMS ───────────────────────────────────────────────────
export const NODE_CONNECTED = 'node:connected';
export const NODE_HEARTBEAT = 'node:heartbeat';
export const UPLOAD_COMPLETE = 'upload:complete';
export const UPLOAD_FAILED = 'upload:failed';
