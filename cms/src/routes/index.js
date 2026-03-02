/**
 * Main Router Index
 * @module routes
 * @description Root router that aggregates and mounts all sub-routers (nodes, files)
 * for the CMS application.
 */
import { Router } from 'express';

import createNodeRoutes from './nodeRoutes.js';
import createFileRoutes from './fileRoutes.js';

function createRoutes(container) {
  const router = Router();

  router.use('/nodes', createNodeRoutes(container.nodeController));
  router.use('/files', createFileRoutes(container.fileController));

  return router;
}

export default createRoutes;
