'use client';
import React from 'react';
import { createProject } from "@/actions/projectActions";

const NewProjectModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  // This helper function handles the submission and then closes the modal
  async function handleSubmit(formData: FormData) {
    const result = await createProject(formData);
    if (result.success) {
      onClose(); // Close the pop-up only if the save worked
    } else {
      alert(result.error);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[600px] rounded-lg shadow-xl overflow-hidden font-arial">
        <div className="bg-[#0099FF] p-4 text-white flex justify-between items-center">
          <h2 className="font-bold uppercase tracking-tight">Create New Project</h2>
          <button onClick={onClose} className="hover:text-gray-200">✕</button>
        </div>

        {/* 1. Added the 'action' attribute here */}
        <form action={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-xs text-[#808080] mb-1">Project Name*</label>
              {/* 2. Added name="name" */}
              <input name="name" required type="text" className="border border-[#D5D5D5] p-2 rounded focus:border-[#0099FF] outline-none" placeholder="e.g. World Youth Festival" />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-[#808080] mb-1">Project Number*</label>
              {/* 2. Added name="number" */}
              <input name="number" required type="text" className="border border-[#D5D5D5] p-2 rounded focus:border-[#0099FF] outline-none" placeholder="SE-1" />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-[#808080] mb-1">Description</label>
            {/* 2. Added name="description" */}
            <textarea name="description" className="border border-[#D5D5D5] p-2 rounded h-24 focus:border-[#0099FF] outline-none" placeholder="Project details..."></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-xs text-[#808080] mb-1">Start Date</label>
              {/* 2. Added name="startDate" */}
              <input name="startDate" type="date" className="border border-[#D5D5D5] p-2 rounded" />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-[#808080] mb-1">End Date</label>
              {/* 2. Added name="endDate" */}
              <input name="endDate" type="date" className="border border-[#D5D5D5] p-2 rounded" />
            </div>
          </div>

          <div className="pt-4 border-t border-[#D5D5D5] flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[#808080] hover:bg-gray-100 rounded">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-[#0099FF] text-white font-bold rounded shadow-md hover:bg-[#2AAAFF]">SAVE PROJECT</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectModal;