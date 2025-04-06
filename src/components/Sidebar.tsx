import React from 'react';
import { Wrench, Users, Calendar, Download, LogOut, ChevronLeft } from 'lucide-react';

interface SidebarProps {
  isSidebarOpen: boolean;
  isHoveringNav: boolean;
  activeTab: 'maintenance' | 'equipments' | 'customers';
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  setIsSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: 'maintenance' | 'equipments' | 'customers') => void;
  handleExport: () => void;
  handleLogout: () => void;
}

export function Sidebar({
  isSidebarOpen,
  isHoveringNav,
  activeTab,
  handleMouseEnter,
  handleMouseLeave,
  setIsSidebarOpen,
  setActiveTab,
  handleExport,
  handleLogout
}: SidebarProps) {
  return (
    <div 
      className={`
        fixed inset-y-0 left-0 z-40 bg-gray-900 text-white transform transition-all duration-300 ease-in-out
        ${isSidebarOpen || isHoveringNav ? 'w-64' : 'w-16'}
        ${isHoveringNav ? 'translate-x-0' : ''}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-between h-16 px-4 bg-gray-800">
        <div className="flex items-center space-x-2">
          <Wrench className="h-8 w-8 text-blue-400" />
          {(isSidebarOpen || isHoveringNav) && (
            <span className="text-lg font-semibold">Equipment Manager</span>
          )}
        </div>
        {(isSidebarOpen || isHoveringNav) && (
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-md hover:bg-gray-700"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
      </div>

      <nav className="flex flex-col h-[calc(100vh-4rem)] px-2 no-scrollbar">
        <div className="flex-1 space-y-2 py-4">
          <button
            onClick={() => setActiveTab('customers')}
            className={`w-full flex items-center space-x-2 px-4 py-2 rounded-md transition-colors duration-200
              ${activeTab === 'customers' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}`}
          >
            <Users className="h-5 w-5" />
            {(isSidebarOpen || isHoveringNav) && <span>Customers</span>}
          </button>

          <button
            onClick={() => setActiveTab('equipments')}
            className={`w-full flex items-center space-x-2 px-4 py-2 rounded-md transition-colors duration-200
              ${activeTab === 'equipments' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}`}
          >
            <Wrench className="h-5 w-5" />
            {(isSidebarOpen || isHoveringNav) && <span>Equipments</span>}
          </button>
          
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`w-full flex items-center space-x-2 px-4 py-2 rounded-md transition-colors duration-200
              ${activeTab === 'maintenance' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}`}
          >
            <Calendar className="h-5 w-5" />
            {(isSidebarOpen || isHoveringNav) && <span>Maintenance</span>}
          </button>

          <button
            onClick={handleExport}
            className="w-full flex items-center space-x-2 px-4 py-2 rounded-md transition-colors duration-200 hover:bg-gray-800"
          >
            <Download className="h-5 w-5" />
            {(isSidebarOpen || isHoveringNav) && <span>Export Data</span>}
          </button>
        </div>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
          >
            <LogOut className="h-5 w-5" />
            {(isSidebarOpen || isHoveringNav) && <span>Logout</span>}
          </button>
        </div>
      </nav>
    </div>
  );
}