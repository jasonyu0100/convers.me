'use client';

import { useState } from 'react';
import { useProcess } from '../hooks';
import { CreateDirectoryModal } from './CreateDirectoryModal';
import { DirectoryProcessMap } from './DirectoryProcessMap';

export function DirectoryMapView() {
  const { allDirectories, setSelectedDirectoryId, handleProcessesSelect, handleCreateNewList, processes, allProcesses } = useProcess();

  const [isCreatingNewDirectory, setIsCreatingNewDirectory] = useState(false);

  // Open directory creation modal
  const openCreateDirectoryModal = () => {
    setIsCreatingNewDirectory(true);
  };

  // Close directory creation modal
  const closeCreateDirectoryModal = () => {
    setIsCreatingNewDirectory(false);
  };

  // Handle successful directory creation
  const handleDirectoryCreated = (directoryId: string) => {
    if (directoryId) {
      setSelectedDirectoryId(directoryId);
    }
  };

  return (
    <div className='flex h-full w-full flex-col'>
      <div className='flex-1 overflow-hidden'>
        <DirectoryProcessMap
          directories={allDirectories}
          processes={allProcesses}
          onSelectDirectory={setSelectedDirectoryId}
          onSelectProcess={handleProcessesSelect}
          onCreateProcess={handleCreateNewList}
        />
      </div>

      {/* Create directory modal */}
      <CreateDirectoryModal
        isOpen={isCreatingNewDirectory}
        onClose={closeCreateDirectoryModal}
        onSuccess={handleDirectoryCreated}
        parentDirectoryId={undefined}
      />
    </div>
  );
}
