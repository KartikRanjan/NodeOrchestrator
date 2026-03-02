/**
 * Node Controller
 * @module NodeController
 * @description HTTP controller for node management operations, including registration
 * and health monitoring.
 */
import { success } from '../utils/response.js';

class NodeController {
  constructor(nodeService) {
    this.nodeService = nodeService;
  }

  /**
   * POST /api/nodes/register
   * Register or re-register a node.
   */
  register = async (req, res, next) => {
    try {
      const { nodeId, ip, port } = req.body || {};
      const node = await this.nodeService.registerNode({ nodeId, ip, port: Number(port) });
      return success({
        res,
        data: node,
        message: 'Node registered successfully',
        statusCode: 201,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/nodes/disconnect
   * Mark a node as disconnected.
   */
  disconnect = async (req, res, next) => {
    try {
      const { nodeId } = req.body || {};
      await this.nodeService.disconnectNode(nodeId);
      return success({
        res,
        data: { nodeId },
        message: 'Node disconnected successfully',
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/nodes
   * List all registered nodes.
   */
  listAll = async (req, res, next) => {
    try {
      const nodes = await this.nodeService.getAllNodes();
      return success({
        res,
        data: nodes,
        message: 'Nodes retrieved successfully',
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/nodes/:nodeId
   * Get details of a single node.
   */
  getNodeById = async (req, res, next) => {
    try {
      const { nodeId } = req.params;
      const node = await this.nodeService.getNodeById(nodeId);
      return success({
        res,
        data: node,
        message: 'Node retrieved successfully',
      });
    } catch (err) {
      next(err);
    }
  };
}

export default NodeController;
