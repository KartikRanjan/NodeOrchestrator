import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { nodeStatusUpdated, updateNodeUploadStatus } from '../features/nodes/nodesSlice';

const SOCKET_URL = import.meta.env.VITE_CMS_SOCKET_URL || 'http://localhost:3000';

/**
 * useSocket — Dashboard Real-time Sync
 * Connects to CMS as 'dashboard' to receive node status and file propagation events.
 */
export const useSocket = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const socket = io(SOCKET_URL, {
            query: { type: 'dashboard' },
            reconnectionAttempts: 10,
            reconnectionDelay: 1500,
        });

        socket.on('connect', () => {
            console.log('[Dashboard] Connected to CMS socket:', socket.id);
        });

        socket.on('disconnect', (reason) => {
            console.log('[Dashboard] Disconnected from CMS socket:', reason);
        });

        // Update node status (online/offline)
        socket.on('node:status-updated', (payload) => {
            dispatch(nodeStatusUpdated(payload));
        });

        // Informational: CMS started propagation
        socket.on('file:upload:start', (payload) => {
            console.log('[Dashboard] file:upload:start', payload);
        });

        // Final result from CMS HTTP push
        socket.on('file:status', (payload) => {
            dispatch(updateNodeUploadStatus({
                nodeId: payload.nodeId,
                status: payload.status,
                filename: payload.filename,
                error: payload.error,
            }));
        });

        // Results initiated via node's own socket
        socket.on('upload:complete', (payload) => {
            dispatch(updateNodeUploadStatus({
                nodeId: payload.nodeId,
                filename: payload.fileName,
                status: 'success',
            }));
        });

        socket.on('upload:failed', (payload) => {
            dispatch(updateNodeUploadStatus({
                nodeId: payload.nodeId,
                filename: payload.fileName,
                status: 'failure',
                error: payload.error,
            }));
        });

        return () => socket.disconnect();
    }, [dispatch]);
};
