import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async Thunk: Fetch Nodes
export const fetchNodes = createAsyncThunk(
  'nodes/fetchNodes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/nodes');
      // response is already the data because of the interceptor
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
  },
  reducers: {
    // Reducers for optional real-time updates (Socket.io)
    nodeConnected: (state, action) => {
      const { nodeId } = action.payload;
      const existingNode = state.data.find((n) => n.nodeId === nodeId);
      if (existingNode) {
        existingNode.status = 'connected';
      } else {
        // If it's a completely new node
        state.data.push({ ...action.payload, status: 'connected' });
      }
    },
    nodeDisconnected: (state, action) => {
      const { nodeId } = action.payload;
      const existingNode = state.data.find((n) => n.nodeId === nodeId);
      if (existingNode) {
        existingNode.status = 'disconnected';
      }
    },
    updateNodeUploadStatus: (state, action) => {
      // payload: { nodeId, fileId, status, filename }
      const { nodeId, status } = action.payload;
      const node = state.data.find((n) => n.nodeId === nodeId);
      if (node) {
        node.lastUploadStatus = status;
      }
    }
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
      })
      .addCase(fetchNodes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { nodeConnected, nodeDisconnected, updateNodeUploadStatus } = nodesSlice.actions;
export default nodesSlice.reducer;
