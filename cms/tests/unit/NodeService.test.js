import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import NodeService from '../../src/services/NodeService.js';
import AppError from '../../src/errors/AppError.js';

// --- Mock repository ---
const makeRepo = (overrides = {}) => ({
  upsert: jest.fn(),
  disconnect: jest.fn(),
  findAll: jest.fn(),
  findByNodeId: jest.fn(),
  findConnected: jest.fn(),
  updateLastSeen: jest.fn(),
  cleanupStaleNodes: jest.fn(),
  ...overrides,
});

describe('NodeService', () => {
  let service;
  let repo;

  beforeEach(() => {
    repo = makeRepo();
    service = new NodeService(repo);
  });

  // ── registerNode ──────────────────────────────────────────────────────────
  describe('registerNode', () => {
    it('calls repository upsert with correct args and returns node', async () => {
      const node = {
        nodeId: 'n1',
        ip: '127.0.0.1',
        port: 4001,
        status: 'connected',
      };
      repo.upsert.mockResolvedValue(node);

      const result = await service.registerNode({ nodeId: 'n1', ip: '127.0.0.1', port: 4001 });

      expect(repo.upsert).toHaveBeenCalledWith({ nodeId: 'n1', ip: '127.0.0.1', port: 4001 });
      expect(result).toEqual(node);
    });

    it('throws validation error when nodeId is missing', async () => {
      await expect(service.registerNode({ ip: '127.0.0.1', port: 4001 })).rejects.toMatchObject({
        statusCode: 400,
        errorCode: 'VALIDATION_ERROR',
      });
    });

    it('throws validation error when ip is missing', async () => {
      await expect(service.registerNode({ nodeId: 'n1', port: 4001 })).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('throws validation error when port is missing', async () => {
      await expect(service.registerNode({ nodeId: 'n1', ip: '127.0.0.1' })).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  // ── disconnectNode ────────────────────────────────────────────────────────
  describe('disconnectNode', () => {
    it('calls repo.disconnect and returns result', async () => {
      repo.disconnect.mockResolvedValue(true);

      const result = await service.disconnectNode('n1');

      expect(repo.disconnect).toHaveBeenCalledWith('n1');
      expect(result).toBe(true);
    });

    it('throws 404 when node is not found', async () => {
      repo.disconnect.mockResolvedValue(false);

      await expect(service.disconnectNode('unknown')).rejects.toMatchObject({
        statusCode: 404,
        errorCode: 'NODE_NOT_FOUND',
      });
    });

    it('throws validation error when nodeId is empty', async () => {
      await expect(service.disconnectNode('')).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ── getAllNodes ───────────────────────────────────────────────────────────
  describe('getAllNodes', () => {
    it('returns whatever the repository returns', async () => {
      const nodes = [{ nodeId: 'n1' }, { nodeId: 'n2' }];
      repo.findAll.mockResolvedValue(nodes);

      const result = await service.getAllNodes();
      expect(result).toEqual(nodes);
    });
  });

  // ── getNodeById ───────────────────────────────────────────────────────────
  describe('getNodeById', () => {
    it('returns a node when found', async () => {
      const node = { nodeId: 'n1', status: 'connected' };
      repo.findByNodeId.mockResolvedValue(node);

      const result = await service.getNodeById('n1');
      expect(result).toEqual(node);
    });

    it('throws 404 when node does not exist', async () => {
      repo.findByNodeId.mockResolvedValue(null);

      await expect(service.getNodeById('ghost')).rejects.toMatchObject({
        statusCode: 404,
        errorCode: 'NODE_NOT_FOUND',
      });
    });
  });

  // ── updateLastSeen ────────────────────────────────────────────────────────
  describe('updateLastSeen', () => {
    it('returns null when nodeId is empty', async () => {
      const result = await service.updateLastSeen('');
      expect(result).toBeNull();
    });

    it('returns null when node is not found in repo', async () => {
      repo.findByNodeId.mockResolvedValue(null);
      const result = await service.updateLastSeen('n1');
      expect(result).toBeNull();
    });

    it('returns statusChanged: false when node was already connected', async () => {
      repo.findByNodeId.mockResolvedValue({ status: 'connected' });
      repo.updateLastSeen.mockResolvedValue();

      const result = await service.updateLastSeen('n1');
      expect(result).toEqual({ statusChanged: false });
      expect(repo.updateLastSeen).toHaveBeenCalledWith('n1', false);
    });

    it('returns statusChanged: true when node was disconnected (reconnect)', async () => {
      repo.findByNodeId.mockResolvedValue({ status: 'disconnected' });
      repo.updateLastSeen.mockResolvedValue();

      const result = await service.updateLastSeen('n1');
      expect(result).toEqual({ statusChanged: true });
      expect(repo.updateLastSeen).toHaveBeenCalledWith('n1', true);
    });
  });

  // ── getConnectedNodes ─────────────────────────────────────────────────────
  describe('getConnectedNodes', () => {
    it('returns only connected nodes from the repository', async () => {
      const connected = [{ nodeId: 'n1', status: 'connected' }];
      repo.findConnected.mockResolvedValue(connected);

      const result = await service.getConnectedNodes();
      expect(result).toEqual(connected);
      expect(repo.findConnected).toHaveBeenCalledTimes(1);
    });
  });

  // ── cleanupStaleNodes ─────────────────────────────────────────────────────
  describe('cleanupStaleNodes', () => {
    it('calls repository and emits status update to dashboard', async () => {
      const disconnectedIds = ['n1', 'n2'];
      repo.cleanupStaleNodes.mockResolvedValue(disconnectedIds);

      // Mock Socket.IO server
      const mockIo = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };
      service.setIo(mockIo);

      await service.cleanupStaleNodes(60);

      expect(repo.cleanupStaleNodes).toHaveBeenCalledWith(60);
      expect(mockIo.to).toHaveBeenCalledWith('dashboard');
      expect(mockIo.emit).toHaveBeenCalledTimes(2);
      expect(mockIo.emit).toHaveBeenCalledWith('node:status-updated', expect.objectContaining({
        nodeId: 'n1',
        status: 'disconnected',
      }));
    });

    it('does not emit events if no nodes were disconnected', async () => {
      repo.cleanupStaleNodes.mockResolvedValue([]);
      const mockIo = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };
      service.setIo(mockIo);

      await service.cleanupStaleNodes(60);

      expect(mockIo.emit).not.toHaveBeenCalled();
    });

    it('works without Socket.IO server', async () => {
      repo.cleanupStaleNodes.mockResolvedValue(['n1']);
      await expect(service.cleanupStaleNodes(60)).resolves.not.toThrow();
    });
  });
});
