/**
 * Socket.IO Event Constants
 * @module events
 * @description Centralized event name definitions for CMS Socket.IO handlers.
 * Prevents typos and makes event names greppable across the codebase.
 */

// ── Inbound: Node Worker → CMS ─────────────────────────────────────────────
export const NODE_CONNECTED = 'node:connected';
export const NODE_HEARTBEAT = 'node:heartbeat';
export const UPLOAD_COMPLETE = 'upload:complete';
export const UPLOAD_FAILED = 'upload:failed';

// ── Outbound: CMS → Dashboard ──────────────────────────────────────────────
export const NODE_STATUS_UPDATED = 'node:status-updated';
