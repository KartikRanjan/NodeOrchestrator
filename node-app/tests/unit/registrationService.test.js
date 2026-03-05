import { jest } from '@jest/globals';

// Mock dependencies before importing the service
const mockSocket = {
    on: jest.fn(),
    emit: jest.fn(),
    connected: true,
    disconnect: jest.fn(),
    id: 'test-socket-id',
};

jest.unstable_mockModule('socket.io-client', () => ({
    io: jest.fn(() => mockSocket),
}));

jest.unstable_mockModule('axios', () => ({
    default: {
        post: jest.fn(() => Promise.resolve({ data: { message: 'Success' } })),
    },
}));

// Use dynamic import to ensure mocks are applied
const { connectSocket, disconnectSocket } = await import('../../src/services/registrationService.js');
const { default: config } = await import('../../src/config/index.js');
const { NODE_HEARTBEAT } = await import('../../src/constants/events.js');

describe('RegistrationService - Heartbeat', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        mockSocket.connected = true;
    });

    afterEach(() => {
        disconnectSocket();
        jest.useRealTimers();
    });

    it('should start sending heartbeats after socket connects', () => {
        connectSocket();

        // Simulate 'connect' event
        const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
        connectHandler();

        // Move time forward by 1 interval
        jest.advanceTimersByTime(config.nodeHeartbeatInterval * 1000);

        expect(mockSocket.emit).toHaveBeenCalledWith(NODE_HEARTBEAT, expect.objectContaining({
            nodeId: config.nodeId,
            timestamp: expect.any(String),
        }));
    });

    it('should send heartbeats periodically', () => {
        connectSocket();

        const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
        connectHandler();

        // Move time forward by 3 intervals
        jest.advanceTimersByTime(config.nodeHeartbeatInterval * 1000 * 3);

        // 1 for node:connected (during connectHandler) + 3 for heartbeats
        const heartbeatCalls = mockSocket.emit.mock.calls.filter(call => call[0] === NODE_HEARTBEAT);
        expect(heartbeatCalls).toHaveLength(3);
    });

    it('should stop sending heartbeats when socket disconnects', () => {
        connectSocket();

        const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
        connectHandler();

        // Simulate 'disconnect' event
        const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
        disconnectHandler('io client disconnect');

        // Move time forward
        jest.advanceTimersByTime(config.nodeHeartbeatInterval * 1000);

        const heartbeatCalls = mockSocket.emit.mock.calls.filter(call => call[0] === NODE_HEARTBEAT);
        expect(heartbeatCalls).toHaveLength(0);
    });
});
