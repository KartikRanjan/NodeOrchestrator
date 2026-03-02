/**
 * Dependency Injection Container
 * @module container
 * @description Centralized container for managing service and repository instances.
 * Facilitates dependency injection across the application layers.
 */
import db from './db/knex.js';

// Repositories
import NodeRepository from './repositories/NodeRepository.js';

// Services
import NodeService from './services/NodeService.js';

// Controllers
import NodeController from './controllers/NodeController.js';

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

    // Services
    this.nodeService = new NodeService(this.nodeRepository);

    // Controllers
    this.nodeController = new NodeController(this.nodeService);
  }
}

// Export a single instance to be used across the app
const container = new Container();

export default container;
