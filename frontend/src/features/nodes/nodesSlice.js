import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async Thunk: Fetch Nodes
export const fetchNodes = createAsyncThunk(
  'nodes/fetchNodes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/nodes');
      return response.data || [];
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const nodesSlice = createSlice({
  name: 'nodes',
  initialState: {
    data: [],
    loading: false,
    error: null,
    updatedNodeIds: [], // nodeIds that just changed via socket — triggers row flash
  },
  reducers: {
    /**
     * nodeStatusUpdated: Updates node online/offline status.
     * payload: { nodeId, status, ip?, port?, timestamp }
     */
    nodeStatusUpdated: (state, action) => {
      const { nodeId, status, ip, port, timestamp } = action.payload;
      const existing = state.data.find((n) => n.nodeId === nodeId);

      if (existing) {
        existing.status = status;
        if (ip) existing.ip = ip;
        if (port) existing.port = port;
        if (timestamp) existing.updatedAt = timestamp;
      } else if (status === 'connected') {
        state.data.unshift({
          nodeId,
          ip: ip || '—',
          port: port || '—',
          status: 'connected',
          updatedAt: timestamp,
          lastFileUploadTime: null,
          lastUploadStatus: null,
          lastUploadFilename: null,
          lastUploadError: null,
        });
      }

      if (!state.updatedNodeIds.includes(nodeId)) {
        state.updatedNodeIds.push(nodeId);
      }
    },

    /**
     * clearUpdatedNode: Clears flash animation marker for a node.
     */
    clearUpdatedNode: (state, action) => {
      state.updatedNodeIds = state.updatedNodeIds.filter((id) => id !== action.payload);
    },

    /**
     * updateNodeUploadStatus: Sets node's last upload result.
     * payload: { nodeId, status, filename?, error? }
     */
    updateNodeUploadStatus: (state, action) => {
      const { nodeId, status, filename, error } = action.payload;
      const node = state.data.find((n) => n.nodeId === nodeId);
      if (node) {
        node.lastUploadStatus = status;
        node.lastUploadFilename = filename || node.lastUploadFilename || null;
        node.lastUploadError = error || null;
      }
    },

    nodeConnected: (state, action) => {
      nodesSlice.caseReducers.nodeStatusUpdated(state, {
        payload: { ...action.payload, status: 'connected' },
      });
    },
    nodeDisconnected: (state, action) => {
      nodesSlice.caseReducers.nodeStatusUpdated(state, {
        payload: { ...action.payload, status: 'disconnected' },
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNodes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNodes.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.updatedNodeIds = []; // REST refresh is authoritative — clear flash markers
      })
      .addCase(fetchNodes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  nodeStatusUpdated,
  clearUpdatedNode,
  updateNodeUploadStatus,
  nodeConnected,
  nodeDisconnected,
} = nodesSlice.actions;

export default nodesSlice.reducer;
