import { useState, useCallback } from 'react';
import type { Folder } from '../../types';
import { useNoteStore } from '../../stores/noteStore';

interface FolderItemProps {
  folder: Folder;
  level: number;
  childFolders: Folder[];
}

export function FolderItem({ folder, level, childFolders }: FolderItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showContextMenu, setShowContextMenu] = useState(false);

  const {
    currentFolderId,
    setCurrentFolder,
    updateFolder,
    deleteFolder,
    createFolder,
  } = useNoteStore();

  const isSelected = currentFolderId === folder.id;
  const hasChildren = childFolders.length > 0;

  const handleClick = () => {
    setCurrentFolder(folder.id);
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditName(folder.name);
  };

  const handleSave = async () => {
    if (editName.trim() && editName !== folder.name) {
      await updateFolder(folder.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(folder.name);
    }
  };

  const handleNewFolder = useCallback(async () => {
    await createFolder('新建文件夹', folder.id);
    setIsExpanded(true);
    setShowContextMenu(false);
  }, [folder.id, createFolder]);

  const handleDelete = async () => {
    await deleteFolder(folder.id);
    setShowContextMenu(false);
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer group ${
          isSelected
            ? 'bg-blue-100 dark:bg-blue-900'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {hasChildren && (
          <button
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            <svg
              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
        {!hasChildren && <span className="w-4" />}

        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>

        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="flex-1 px-1 py-0.5 text-sm bg-white dark:bg-gray-800 border border-blue-500 rounded outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-sm truncate">{folder.name}</span>
        )}

        <button
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          onClick={(e) => {
            e.stopPropagation();
            setShowContextMenu(!showContextMenu);
          }}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {showContextMenu && (
          <div className="absolute right-2 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg py-1 z-50 min-w-[120px]">
            <button
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={handleNewFolder}
            >
              新建子文件夹
            </button>
            <button
              className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={handleDelete}
            >
              删除
            </button>
          </div>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div>
          {childFolders.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              level={level + 1}
              childFolders={childFolders.filter((f) => f.parentId === child.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree() {
  const { folders, createFolder } = useNoteStore();
  const rootFolders = folders.filter((f) => !f.parentId);

  const handleNewFolder = async () => {
    await createFolder('新建文件夹');
  };

  return (
    <div className="py-1">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
          文件夹
        </span>
        <button
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          onClick={handleNewFolder}
          title="新建文件夹"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      <div>
        {rootFolders.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            level={0}
            childFolders={folders.filter((f) => f.parentId === folder.id)}
          />
        ))}
        {rootFolders.length === 0 && (
          <div className="px-3 py-2 text-sm text-gray-400">暂无文件夹</div>
        )}
      </div>
    </div>
  );
}
