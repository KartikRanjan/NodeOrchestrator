/**
 * Dependency Injection Container
 * @module container
 * @description Centralized container for managing service and repository instances.
 * Facilitates dependency injection across the application layers.
 */
import db from './db/knex.js';

// Repositories
import NodeRepository from './repositories/NodeRepository.js';
import FileRepository from './repositories/FileRepository.js';

// Services
import NodeService from './services/NodeService.js';
import FileService from './services/FileService.js';

// Controllers
import NodeController from './controllers/NodeController.js';
import FileController from './controllers/FileController.js';

/**
 * Dependency Injection Container
 *
 * This is the composition root. It instantiates and wires together
 * all classes in the application.
 */
class Container {
  constructor() {
    // Repositories
    this.nodeRepository = new NodeRepository(db);
    this.fileRepository = new FileRepository(db);

    // Services
    this.nodeService = new NodeService(this.nodeRepository);
    this.fileService = new FileService(this.fileRepository, this.nodeRepository);

    // Controllers
    this.nodeController = new NodeController(this.nodeService);
    this.fileController = new FileController(this.fileService);
  }
}

// Export a single instance to be used across the app
const container = new Container();

export default container;
