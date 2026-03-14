import React from 'react';

const Sidebar = () => {
  return (
    <aside className="w-64 bg-[#FFFFFF] h-screen flex flex-col text-[#000000] fixed left-0 top-0 border-r border-[#D5D5D5]">
      {/* Brand Logo Area - Using Vibrant Blue for the logo text */}
      <div className="p-6 border-b border-[#D5D5D5] font-bold text-2xl tracking-tighter text-[#0099FF]">
        AXIS
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <div className="text-xs font-semibold text-[#808080] uppercase tracking-wider px-4 mb-4">
          Main Modules
        </div>
        
        {/* Active Item: Blue text with a subtle light blue background */}
        <a href="#" className="flex items-center px-4 py-3 text-[#0099FF] bg-[#D5EEFF] rounded-lg font-medium">
          <svg className="w-5 h-5 mr-3 stroke-[#808080] fill-none" viewBox="0 0 24 24" strokeWidth="2">
             <rect x="3" y="3" width="18" height="18" rx="2" />
             <path d="M3 9h18" />
          </svg>
          Projects
        </a>

        {/* Inactive Items: Black text with grayish icons */}
        <a href="#" className="flex items-center px-4 py-3 text-[#000000] hover:bg-[#F5F5F5] rounded-lg transition-all">
          <svg className="w-5 h-5 mr-3 stroke-[#808080] fill-none" viewBox="0 0 24 24" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
          Collaboration
        </a>
      </nav>

      <div className="p-4 border-t border-[#D5D5D5] text-[#808080] text-xs">
        Axis Programm 2026
      </div>
    </aside>
  );
};

export default Sidebar;