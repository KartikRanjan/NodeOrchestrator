/**
 * File Service
 * @module fileService
 * @description Business logic for file orchestration and propagation across nodes.
 * Manages multi-node uploads and tracks delivery status.
 */
import fs from 'fs';

import axios from 'axios';
import FormData from 'form-data';

import logger from '../utils/logger.js';
import config from '../config/index.js';
import AppError from '../errors/AppError.js';

/**
 *  1. Recording the upload in the database
 *  2. Fetching all connected nodes
 *  3. Propagating the file to each node in parallel
 *  4. Tracking per-node success/failure status
 */
class FileService {
  constructor(fileRepository, nodeRepository) {
    this.fileRepository = fileRepository;
    this.nodeRepository = nodeRepository;
  }

  /**
   * Process a file upload and propagate it to all connected nodes.
   *
   * @param {Object} params - Upload parameters
   * @param {string} params.filename - Original filename
   * @param {string} params.filePath - Absolute path to the saved file on disk
   * @returns {{ fileId: number, results: Array<{ nodeId: string, status: string, error?: string }> }}
   */
  async uploadAndPropagate({ filename, filePath }) {
    if (!filename || !filePath) {
      throw new AppError({
        message: 'Filename and file path are required',
        statusCode: 400,
        errorCode: 'VALIDATION_ERROR',
      });
    }

    logger.info('File upload started', { filename, filePath });

    // 1. Record the upload
    const uploadRecord = await this.fileRepository.createUploadRecord(filename);
    const fileId = uploadRecord.id;
    logger.info('File upload recorded', { fileId, filename });

    // 2. Get all connected nodes
    const connectedNodes = await this.nodeRepository.findConnected();

    if (connectedNodes.length === 0) {
      logger.warn('No connected nodes for file propagation', { fileId });
      throw new AppError({
        message: 'No connected nodes for file propagation',
        statusCode: 404,
        errorCode: 'NO_CONNECTED_NODES',
      });
    }

    // 3. Create pending status records for each node
    for (const node of connectedNodes) {
      await this.fileRepository.createNodeUploadStatus(fileId, node.nodeId);
    }

    // 4. Propagate to all nodes in parallel
    const propagationPromises = connectedNodes.map((node) =>
      this._propagateToNode({ node, filePath, filename, fileId }),
    );

    const results = await Promise.allSettled(propagationPromises);

    return {
      fileId,
      results: results.map((r) => r.value || r.reason),
    };
  }

  /**
   * Push a file to a single node via HTTP POST (multipart/form-data).
   * Updates the node_upload_status record on success or failure.
   *
   * @private
   */
  async _propagateToNode({ node, filePath, filename, fileId }) {
    const nodeId = node.nodeId;

    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath), filename);

      await axios.post(`http://${node.ip}:${node.port}/upload`, form, {
        headers: {
          ...form.getHeaders(),
          'x-api-key': config.apiKey,
        },
        timeout: 30000,
      });

      await this.fileRepository.updateNodeUploadStatus(fileId, nodeId, 'success');
      logger.info('File propagated successfully', { fileId, nodeId });

      return { nodeId, status: 'success' };
    } catch (err) {
      const errorMessage =
        err.response?.status === 401 ? 'API key rejected by node' : err.message || 'Unknown error';

      await this.fileRepository.updateNodeUploadStatus(fileId, nodeId, 'failure', errorMessage);
      logger.error('File propagation failed', { fileId, nodeId, error: errorMessage });

      return { nodeId, status: 'failure', error: errorMessage };
    }
  }

  /**
   * Retrieve all uploads with their per-node propagation statuses.
   */
  async getAllUploads() {
    return this.fileRepository.findAllWithStatus();
  }
}

export default FileService;
