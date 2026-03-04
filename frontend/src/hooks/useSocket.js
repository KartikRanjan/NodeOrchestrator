import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { nodeStatusUpdated, updateNodeUploadStatus } from '../features/nodes/nodesSlice';
import { NODE_STATUS_UPDATED, UPLOAD_COMPLETE, UPLOAD_FAILED } from '../constants/events';

const SOCKET_URL = import.meta.env.VITE_CMS_SOCKET_URL || 'http://localhost:3000';
const API_KEY = import.meta.env.VITE_API_KEY;

/**
 * useSocket — Dashboard Real-time Sync
 * Connects to CMS as 'dashboard' to receive node status and file propagation events.
 */
export const useSocket = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const socket = io(SOCKET_URL, {
            query: { type: 'dashboard' },
            auth: { apiKey: API_KEY },
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
        socket.on(NODE_STATUS_UPDATED, (payload) => {
            dispatch(nodeStatusUpdated(payload));
        });



        // Results initiated via node's own socket
        socket.on(UPLOAD_COMPLETE, (payload) => {
            dispatch(updateNodeUploadStatus({
                nodeId: payload.nodeId,
                filename: payload.fileName,
                status: 'success',
            }));
        });

        socket.on(UPLOAD_FAILED, (payload) => {
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
