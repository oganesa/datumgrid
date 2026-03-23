'use client';
import React, { useState } from 'react';
import NewProjectModal from './NewProjectModal';

const Header = () => {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-end px-8 py-4 bg-white border-b border-[#D5D5D5]">
        <button 
          onClick={() => setModalOpen(true)}
          className="bg-[#0099FF] hover:bg-[#2AAAFF] text-white px-5 py-2 rounded-md font-bold text-sm transition-all shadow-sm"
        >
          + NEW PROJECT
        </button>
      </header>

      {/* Pop up the modal when button is clicked */}
      <NewProjectModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
export default Header;