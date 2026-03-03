import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchNodes } from './features/nodes/nodesSlice';
import { useSocket } from './hooks/useSocket';
import NodeTable from './components/NodeTable';
import FileUploader from './components/FileUploader';
import Navbar from './components/Navbar';

function App() {
  const dispatch = useDispatch();
  
  // Initialize socket listeners
  useSocket();

  useEffect(() => {
    // Initial fetch of nodes
    dispatch(fetchNodes());
  }, [dispatch]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100 font-sans text-gray-900">
      <Navbar />

      {/* Main Content — fills remaining viewport height */}
      <main className="flex-1 overflow-hidden w-full mx-auto px-4 sm:px-6 lg:px-12 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Left Column: Node Table — scrolls internally */}
          <div className="lg:col-span-2 h-full overflow-hidden">
            <NodeTable />
          </div>

          {/* Right Column: File Uploader */}
          <div className="h-full overflow-y-auto">
            <FileUploader />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
