import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNoteStore } from '../../stores/noteStore';
import { useAuthStore } from '../../stores/authStore';

export function CommandPalette() {
  const [open, setOpen] = useState(false);

  const {
    showCommandPalette,
    setShowCommandPalette,
    notes,
    searchResults,
    searchQuery,
    setSearchQuery,
    createNote,
    setCurrentNote,
    useLocal,
  } = useNoteStore();

  const { isAuthenticated, user } = useAuthStore();

  // Toggle with Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowCommandPalette(!showCommandPalette);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [showCommandPalette, setShowCommandPalette]);

  // Sync with store
  useEffect(() => {
    setOpen(showCommandPalette);
  }, [showCommandPalette]);

  const handleSelectNote = (noteId: string) => {
    setCurrentNote(noteId);
    setShowCommandPalette(false);
  };

  const handleCreateNote = async () => {
    await createNote();
    setShowCommandPalette(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setShowCommandPalette(false)}
      />

      {/* Command Dialog */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-xl">
        <Command className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-3">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Command.Input
              value={searchQuery}
              onValueChange={(value) => setSearchQuery(value)}
              placeholder="搜索笔记或输入命令..."
              className="flex-1 px-3 py-3 bg-transparent border-none outline-none text-sm"
            />
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-gray-400">
              {searchQuery ? '没有找到相关笔记' : '开始搜索或选择命令'}
            </Command.Empty>

            {/* Create Note Command */}
            <Command.Item
              onSelect={handleCreateNote}
              className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>新建笔记</span>
            </Command.Item>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Command.Group heading="搜索结果" className="text-xs text-gray-400 px-2 py-1">
                {searchResults.map((note) => (
                  <Command.Item
                    key={note.id}
                    onSelect={() => handleSelectNote(note.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{note.title || '无标题笔记'}</span>
                    <span className="ml-auto text-xs text-gray-400 truncate max-w-[200px]">
                      {String(note.content).slice(0, 30)}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Recent Notes */}
            {notes.length > 0 && !searchQuery && (
              <Command.Group heading="最近的笔记" className="text-xs text-gray-400 px-2 py-1">
                {notes
                  .filter((n) => !n.isDeleted)
                  .sort((a, b) => b.updatedAt - a.updatedAt)
                  .slice(0, 5)
                  .map((note) => (
                    <Command.Item
                      key={note.id}
                      onSelect={() => handleSelectNote(note.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{note.title || '无标题笔记'}</span>
                    </Command.Item>
                  ))}
              </Command.Group>
            )}

            {/* Status Info */}
            <Command.Group heading="状态" className="text-xs text-gray-400 px-2 py-1">
              <div className="px-3 py-2">
                <p className="text-xs text-gray-500">
                  {isAuthenticated
                    ? `已登录: ${user?.name || user?.email}`
                    : '未登录（本地模式）'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {useLocal ? '数据存储在浏览器本地' : '数据同步到云端'}
                </p>
              </div>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
