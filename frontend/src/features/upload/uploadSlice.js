import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { updateNodeUploadStatus } from '../nodes/nodesSlice';

// Upload file and update nodes slice with results
export const uploadFile = createAsyncThunk(
  'upload/uploadFile',
  async (file, { dispatch, rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Response: { fileId, results: [{ nodeId, status, error? }, ...] }
      const response = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { results } = response.data;

      // Update node upload status immediately from response
      if (Array.isArray(results)) {
        results.forEach(({ nodeId, status, error }) => {
          dispatch(updateNodeUploadStatus({ nodeId, status, error }));
        });
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const uploadSlice = createSlice({
  name: 'upload',
  initialState: {
    uploading: false,
    success: false,
    error: null,
    lastResult: null, // { fileId, results: [{ nodeId, status, error? }] }
  },
  reducers: {
    resetUploadState: (state) => {
      state.uploading = false;
      state.success = false;
      state.error = null;
      state.lastResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadFile.pending, (state) => {
        state.uploading = true;
        state.success = false;
        state.error = null;
        state.lastResult = null;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.uploading = false;
        state.success = true;
        state.lastResult = action.payload;
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.uploading = false;
        state.success = false;
        state.error = action.payload;
      });
  },
});

export const { resetUploadState } = uploadSlice.actions;
export default uploadSlice.reducer;
