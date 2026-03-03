import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async Thunk: Upload File
export const uploadFile = createAsyncThunk(
  'upload/uploadFile',
  async (file, { dispatch, rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          dispatch(setUploadProgress(percentCompleted));
        },
      });
      // response is already the data because of the interceptor
      return response.data; // { fileId, results: [] }
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const uploadSlice = createSlice({
  name: 'upload',
  initialState: {
    uploading: false,
    progress: 0,
    success: false,
    error: null,
    lastResult: null, // Stores the last upload response { fileId, results: [] }
  },
  reducers: {
    setUploadProgress: (state, action) => {
      state.progress = action.payload;
    },
    resetUploadState: (state) => {
      state.uploading = false;
      state.progress = 0;
      state.success = false;
      state.error = null;
      state.lastResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadFile.pending, (state) => {
        state.uploading = true;
        state.progress = 0;
        state.success = false;
        state.error = null;
        state.lastResult = null;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.uploading = false;
        state.progress = 100;
        state.success = true;
        state.lastResult = action.payload;
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.uploading = false;
        state.progress = 0;
        state.success = false;
        state.error = action.payload;
      });
  },
});

export const { setUploadProgress, resetUploadState } = uploadSlice.actions;
export default uploadSlice.reducer;
