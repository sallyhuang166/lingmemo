import { useState } from 'react';
import { useNoteStore } from '../../stores/noteStore';
import type { Note } from '../../types';

export function NoteList() {
  const {
    notes,
    currentFolderId,
    currentNoteId,
    showTrash,
    setCurrentNote,
    createNote,
    deleteNote,
    toggleFavorite,
    restoreNote,
    permanentlyDeleteNote,
  } = useNoteStore();

  const filteredNotes = showTrash
    ? notes.filter((n) => n.isDeleted)
    : notes.filter((n) => !n.isDeleted && (currentFolderId ? n.folderId === currentFolderId : !n.folderId));

  const handleCreateNote = async () => {
    await createNote(currentFolderId);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;

    return date.toLocaleDateString('zh-CN');
  };

  const getPreview = (content: string) => {
    // Remove markdown syntax for preview
    const text = content
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*|__/g, '')
      .replace(/\*|_/g, '')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n/g, ' ')
      .trim();
    return text.slice(0, 60) || '无内容';
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
          {showTrash ? '回收站' : '笔记'}
        </span>
        {!showTrash && (
          <button
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            onClick={handleCreateNote}
            title="新建笔记"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="px-3 py-4 text-sm text-gray-400 text-center">
            {showTrash ? '回收站为空' : '暂无笔记'}
          </div>
        ) : (
          filteredNotes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              isSelected={currentNoteId === note.id}
              formatDate={formatDate}
              getPreview={getPreview}
              onClick={() => setCurrentNote(note.id)}
              onDelete={() => deleteNote(note.id)}
              onFavorite={() => toggleFavorite(note.id)}
              onRestore={() => restoreNote(note.id)}
              onPermanentDelete={() => permanentlyDeleteNote(note.id)}
              showTrash={showTrash}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface NoteItemProps {
  note: Note;
  isSelected: boolean;
  formatDate: (timestamp: number) => string;
  getPreview: (content: string) => string;
  onClick: () => void;
  onDelete: () => void;
  onFavorite: () => void;
  onRestore: () => void;
  onPermanentDelete: () => void;
  showTrash: boolean;
}

function NoteItem({
  note,
  isSelected,
  formatDate,
  getPreview,
  onClick,
  onDelete,
  onFavorite,
  onRestore,
  onPermanentDelete,
  showTrash,
}: NoteItemProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`px-3 py-2 cursor-pointer border-b border-gray-100 dark:border-gray-800 group ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-900/30'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            {note.isFavorite && !showTrash && (
              <svg className="w-3 h-3 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
            <h3 className="text-sm font-medium truncate">
              {note.title || '无标题笔记'}
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {getPreview(note.content)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDate(note.updatedAt)}
          </p>
        </div>

        {showActions && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {showTrash ? (
              <>
                <button
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore();
                  }}
                  title="恢复"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPermanentDelete();
                  }}
                  title="永久删除"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <button
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFavorite();
                  }}
                  title={note.isFavorite ? '取消收藏' : '收藏'}
                >
                  <svg
                    className={`w-3.5 h-3.5 ${note.isFavorite ? 'text-yellow-500' : ''}`}
                    fill={note.isFavorite ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
                <button
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  title="删除"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
