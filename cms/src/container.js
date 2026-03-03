/**
 * Dependency Injection Container
 * @module container
 * @description Centralized container for managing service and repository instances.
 * Facilitates dependency injection across the application layers.
 */

import db from './db/knex.js';

import NodeRepository from './repositories/NodeRepository.js';
import FileRepository from './repositories/FileRepository.js';

import NodeService from './services/NodeService.js';
import FileService from './services/FileService.js';

import NodeController from './controllers/NodeController.js';
import FileController from './controllers/FileController.js';

class Container {
  constructor() {
    this.nodeRepository = new NodeRepository(db);
    this.fileRepository = new FileRepository(db);

    this.nodeService = new NodeService(this.nodeRepository);
    this.fileService = new FileService(this.fileRepository, this.nodeRepository);

    this.nodeController = new NodeController(this.nodeService);
    this.fileController = new FileController(this.fileService);
  }

  /**
   * Inject io into services after the HTTP server is created.
   * Avoids a circular import between app.js and container.js.
   * @param {import('socket.io').Server} io
   */
  bootstrapIo(io) {
    this.nodeService.setIo(io);
  }
}

const container = new Container();
export default container;
