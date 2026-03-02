/**
 * Main Router Index
 * @module routes
 * @description Root router that aggregates and mounts all sub-routers (nodes)
 * for the CMS application.
 */
import { Router } from 'express';

import createNodeRoutes from './nodeRoutes.js';

function createRoutes(container) {
  const router = Router();

  router.use('/nodes', createNodeRoutes(container.nodeController));

  return router;
}

export default createRoutes;
