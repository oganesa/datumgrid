'use client';
import React, { useState } from 'react';
import NewProjectModal from './NewProjectModal';

type HeaderProps = {
  userLabel?: string;
};

const Header = ({ userLabel }: HeaderProps) => {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-[#D5D5D5]">
        <div className="flex items-center gap-4 text-[#808080]">
          {userLabel ? (
            <span className="text-sm text-[#000000]">{userLabel}</span>
          ) : null}
          <a
            href="/auth/logout"
            className="text-sm text-[#0099FF] hover:underline"
          >
            Log out
          </a>
        </div>

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