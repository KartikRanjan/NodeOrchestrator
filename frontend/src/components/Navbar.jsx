import React from 'react';
import { LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="flex-shrink-0 bg-white shadow-sm border-b border-gray-200">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">
              Node<span className="text-blue-600"> Orchestrator</span>
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
