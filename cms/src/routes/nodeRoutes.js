/**
 * Node Routes
 * @module nodeRoutes
 * @description Defines API endpoints for node registration, health tracking,
 * and lifecycle management.
 */
import { Router } from 'express';

import authMiddleware from '../middleware/authMiddleware.js';

function createNodeRoutes(nodeController) {
  const router = Router();

  // Protected — called by Node Apps
  router.post('/register', authMiddleware,  nodeController.register);
  router.post('/disconnect', authMiddleware, nodeController.disconnect);

  // Open — consumed by React frontend
  router.get('/', nodeController.listAll);
  router.get('/:nodeId', nodeController.getNodeById);

  return router;
}

export default createNodeRoutes;
