import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { nodeConnected, nodeDisconnected, updateNodeUploadStatus } from '../features/nodes/nodesSlice';

const SOCKET_URL = import.meta.env.VITE_CMS_SOCKET_URL || 'http://localhost:3000';

export const useSocket = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const socket = io(SOCKET_URL, {
            transports: ['websocket'],
            reconnectionAttempts: 5,
        });

        socket.on('connect', () => {
            console.log('Connected to CMS Socket');
        });

        socket.on('nodeConnected', (data) => {
            dispatch(nodeConnected(data));
        });

        socket.on('nodeDisconnected', (data) => {
            dispatch(nodeDisconnected(data));
        });

        socket.on('uploadStatusUpdate', (data) => {
            dispatch(updateNodeUploadStatus(data));
        });

        return () => {
            socket.disconnect();
        };
    }, [dispatch]);
};
