import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchNodes } from '../features/nodes/nodesSlice';
import { Server, Activity, HardDrive, CheckCircle2, XCircle, Clock, Filter } from 'lucide-react';

const NodeTable = () => {
  const dispatch = useDispatch();
  const { data: nodes, loading, error } = useSelector((state) => state.nodes);
  const [filter, setFilter] = useState('all'); // all, active, inactive

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    dispatch(fetchNodes());
  };

  if (loading && nodes.length === 0) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && nodes.length === 0) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error.message || 'Failed to load nodes.'}</span>
      </div>
    );
  }

  const filteredNodes = nodes.filter(node => {
    if (filter === 'active') return node.status === 'connected';
    if (filter === 'inactive') return node.status !== 'connected';
    return true;
  });

  const activeCount = nodes.filter(n => n.status === 'connected').length;
  const inactiveCount = nodes.length - activeCount;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 h-full flex flex-col relative">
      {/* Loading Overlay for background refreshes */}
      {loading && nodes.length > 0 && (
        <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-500" />
          Nodes ({filteredNodes.length})
        </h2>
        
        <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              filter === 'all' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All ({nodes.length})
          </button>
          <button
            onClick={() => handleFilterChange('active')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              filter === 'active' 
                ? 'bg-white text-green-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => handleFilterChange('inactive')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              filter === 'inactive' 
                ? 'bg-white text-red-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Inactive ({inactiveCount})
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Node Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Network
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Last Upload
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredNodes.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No {filter !== 'all' ? filter : ''} nodes found.</p>
                  {filter === 'all' && <p className="text-sm text-gray-400">Start a worker node to see it appear here.</p>}
                </td>
              </tr>
            ) : (
              filteredNodes.map((node) => (
                <tr key={node.nodeId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <HardDrive className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 font-mono">
                          {node.nodeId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{node.ip}</div>
                    <div className="text-sm text-gray-500">Port: {node.port}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        node.status === 'connected'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${node.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {node.status === 'connected' ? 'Connected' : 'Disconnected'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {node.lastFileUploadTime ? (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span>{new Date(node.lastFileUploadTime).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Never</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NodeTable;
