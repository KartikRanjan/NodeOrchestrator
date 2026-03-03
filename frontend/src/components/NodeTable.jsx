import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchNodes, clearUpdatedNode } from '../features/nodes/nodesSlice';
import {
  Server,
  Activity,
  HardDrive,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

// --- Components ---

const UploadStatusBadge = ({ status, filename, error }) => {
  if (!status) return <span className="text-sm text-gray-400">—</span>;

  const cfg = {
    success: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: 'bg-green-100 text-green-700', label: 'Success' },
    failure: { icon: <XCircle     className="w-3.5 h-3.5" />, cls: 'bg-red-100   text-red-700',   label: 'Failed'  },
  }[status] ?? { icon: <XCircle className="w-3.5 h-3.5" />, cls: 'bg-gray-100 text-gray-600', label: status };

  return (
    <div className="flex flex-col gap-0.5">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
        {cfg.icon}
        {cfg.label}
      </span>
      {filename && (
        <span className="text-xs text-gray-400 truncate max-w-[140px]" title={filename}>
          {filename}
        </span>
      )}
      {error && (
        <span className="text-xs text-red-400 truncate max-w-[140px]" title={error}>
          {error}
        </span>
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const isConnected = status === 'connected';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-300 ${
        isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`}
      />
      {isConnected ? 'Connected' : 'Disconnected'}
    </span>
  );
};

/**
 * NodeRow - Renders single node with flash animation on update.
 */
const NodeRow = ({ node, index, isUpdated, onFlashDone }) => {
  const [flashing, setFlashing] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isUpdated) return;

    // Use requestAnimationFrame to defer state update and avoid cascading renders
    const frame = requestAnimationFrame(() => setFlashing(true));

    timerRef.current = setTimeout(() => {
      setFlashing(false);
      onFlashDone(node.nodeId);
    }, 1500);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timerRef.current);
    };
  }, [isUpdated, node.nodeId, onFlashDone]);

  return (
    <tr
      key={node.nodeId}
      className={`transition-colors duration-500 ${
        flashing ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
      }`}
    >
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400 font-medium">
        {index + 1}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <HardDrive className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-sm font-mono font-medium text-gray-900">
            {node.nodeId}
          </span>
          {flashing && (
            <span className="text-xs text-blue-500 font-medium animate-pulse">
              updated
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-sm text-gray-900">{node.ip}</div>
        <div className="text-sm text-gray-500">Port: {node.port}</div>
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        <StatusBadge status={node.status} />
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        {node.lastFileUploadTime ? (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>
              {new Date(node.lastFileUploadTime).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">Never</span>
        )}
      </td>

      <td className="px-4 py-3">
        <UploadStatusBadge
          status={node.lastUploadStatus}
          filename={node.lastUploadFilename}
          error={node.lastUploadError}
        />
      </td>
    </tr>
  );
};

// --- Main NodeTable ---

const NodeTable = () => {
  const dispatch = useDispatch();
  const { data: nodes, loading, error, updatedNodeIds } = useSelector((state) => state.nodes);
  const [filter, setFilter] = useState('all');

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    if (newFilter === 'all') dispatch(fetchNodes());
  };

  const handleFlashDone = (nodeId) => {
    dispatch(clearUpdatedNode(nodeId));
  };

  if (loading && nodes.length === 0) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
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

  const filteredNodes = nodes.filter((node) => {
    if (filter === 'active')   return node.status === 'connected';
    if (filter === 'inactive') return node.status !== 'connected';
    return true;
  });

  const activeCount   = nodes.filter((n) => n.status === 'connected').length;
  const inactiveCount = nodes.length - activeCount;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 h-full flex flex-col relative">
      {/* Background refresh overlay */}
      {loading && nodes.length > 0 && (
        <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}

      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-500" />
          Nodes ({filteredNodes.length})
          {updatedNodeIds.length > 0 && (
            <span className="text-xs font-normal text-blue-500 animate-pulse">
              • live
            </span>
          )}
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
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                #
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Node ID
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Network
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Last Upload Time
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Upload Result
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredNodes.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No {filter !== 'all' ? filter : ''} nodes found.</p>
                  {filter === 'all' && (
                    <p className="text-sm text-gray-400">
                      Start a worker node to see it appear here.
                    </p>
                  )}
                </td>
              </tr>
            ) : (
              filteredNodes.map((node, index) => (
                <NodeRow
                  key={node.nodeId}
                  node={node}
                  index={index}
                  isUpdated={updatedNodeIds.includes(node.nodeId)}
                  onFlashDone={handleFlashDone}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NodeTable;
