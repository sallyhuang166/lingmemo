import { useEffect, useState, useCallback, useRef } from 'react';
import { useNoteStore } from '../../stores/noteStore';

export function NoteEditor() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(content);
  const currentNoteIdRef = useRef<string | null>(null);

  const {
    notes,
    currentNoteId,
    updateNote,
    generateSummary,
  } = useNoteStore();

  const currentNote = notes.find((n) => n.id === currentNoteId);

  // Keep refs in sync
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    currentNoteIdRef.current = currentNoteId ?? null;
  }, [currentNoteId]);

  // Manual save function
  const handleSave = useCallback(async () => {
    const noteId = currentNoteIdRef.current;
    if (!noteId) return;

    setIsSaving(true);
    await updateNote(noteId, { content: contentRef.current });
    setLastSaved(new Date());
    setIsSaving(false);
  }, [updateNote]);

  // Keyboard shortcut for save (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Update state when note changes
  useEffect(() => {
    if (!currentNote) return;

    setTitle(currentNote.title);
    setContent(currentNote.content);
    setLastSaved(new Date(currentNote.updatedAt));
  }, [currentNoteId, currentNote?.id]);

  // Auto-save content (debounced)
  useEffect(() => {
    if (!currentNoteId || !currentNote) return;

    // Only save if content actually changed
    if (content !== currentNote.content) {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(async () => {
        setIsSaving(true);
        await updateNote(currentNoteId, { content });
        setLastSaved(new Date());
        setIsSaving(false);
      }, 1000);

      return () => {
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
        }
      };
    }
  }, [content, currentNoteId, currentNote, updateNote]);

  // Save title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (currentNoteId) {
      updateNote(currentNoteId, { title: newTitle });
      setLastSaved(new Date());
    }
  };

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  // Generate AI Summary
  const handleGenerateSummary = useCallback(async () => {
    if (!currentNoteId || !content || isGeneratingSummary) return;

    setIsGeneratingSummary(true);
    try {
      await generateSummary(currentNoteId);
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [currentNoteId, content, isGeneratingSummary, generateSummary]);

  // Format last saved time
  const formatLastSaved = () => {
    if (!lastSaved) return '';
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();

    if (diff < 60000) return '刚刚保存';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前保存`;
    return lastSaved.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  if (!currentNote) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-400 dark:text-gray-500">选择或创建一篇笔记</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-primary)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="无标题笔记"
          className="flex-1 text-xl font-semibold bg-transparent border-none outline-none"
        />
        <div className="flex items-center gap-2">
          {/* Save Status */}
          <span className="text-xs text-gray-400 mr-2">
            {isSaving ? (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                保存中...
              </span>
            ) : lastSaved ? (
              formatLastSaved()
            ) : null}
          </span>

          {/* Save Button */}
          <button
            className={`px-3 py-1 text-xs rounded flex items-center gap-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 ${
              isSaving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={handleSave}
            disabled={isSaving}
            title="保存笔记 (Ctrl+S)"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            保存
          </button>

          {/* AI Summary Button */}
          <button
            className={`px-3 py-1 text-xs rounded flex items-center gap-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 ${
              isGeneratingSummary ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={handleGenerateSummary}
            disabled={isGeneratingSummary}
          >
            {isGeneratingSummary ? (
              <>
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                生成中...
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI 摘要
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Summary */}
      {currentNote.aiSummary && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-700 dark:text-blue-300">{currentNote.aiSummary}</p>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <textarea
          value={content}
          onChange={handleContentChange}
          className="w-full h-full p-4 bg-transparent border-none outline-none resize-none font-mono text-sm"
          placeholder="开始编写笔记... (支持 Markdown 语法)"
        />
      </div>
    </div>
  );
}
