import { useNoteStore } from '../../stores/noteStore';
import { useAuthStore } from '../../stores/authStore';
import { FolderTree } from './FolderTree';
import { NoteList } from './NoteList';

export function Sidebar() {
  const { showTrash, setShowTrash, setShowCommandPalette, useLocal } = useNoteStore();
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-64 h-full flex flex-col bg-[var(--bg-secondary)] border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">LingMemo</h1>
          <button
            onClick={logout}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="退出登录"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
        {user && (
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
              {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
            </div>
            <span className="truncate">{user.name || user.email}</span>
          </div>
        )}
        {useLocal && (
          <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
            本地模式（未登录）
          </div>
        )}
      </div>

      {/* Search */}
      <div className="px-2 py-2">
        <button
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-[var(--bg-tertiary)] rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          onClick={() => setShowCommandPalette(true)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>搜索...</span>
          <span className="ml-auto text-xs text-gray-400">⌘K</span>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="px-2 py-1 flex gap-1">
        <button
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded ${
            !showTrash
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          onClick={() => setShowTrash(false)}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          笔记
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded ${
            showTrash
              ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          onClick={() => setShowTrash(true)}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          回收站
        </button>
      </div>

      {/* Content */}
      {!showTrash && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <FolderTree />
        </div>
      )}
      <NoteList />
    </aside>
  );
}
