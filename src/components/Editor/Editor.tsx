import { useEffect, useState, useCallback, useRef } from 'react';
import { useNoteStore } from '../../stores/noteStore';

export function NoteEditor() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(content);
  const currentNoteIdRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    notes,
    currentNoteId,
    updateNote,
    generateSummary,
  } = useNoteStore();

  const currentNote = notes.find((n) => n.id === currentNoteId);

  // Simple Markdown to HTML converter
  const parseMarkdown = (text: string): string => {
    if (!text) return '';

    let html = text
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Bold: **text** or __text__
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      // Italic: *text* or _text_
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      // Strikethrough: ~~text~~
      .replace(/~~([^~]+)~~/g, '<del>$1</del>')
      // Headers
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // Unordered list
      .replace(/^- \[ \] (.+)$/gm, '<div class="task-item"><input type="checkbox" disabled> $1</div>')
      .replace(/^- \[x\] (.+)$/gm, '<div class="task-item"><input type="checkbox" checked disabled> $1</div>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      // Ordered list
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      // Blockquote
      .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      // Code blocks
      .replace(/```[\s\S]*?```/g, (match) => {
        const code = match.replace(/```\w*\n?/g, '').trim();
        return `<pre><code>${code}</code></pre>`;
      })
      // Line breaks
      .replace(/\n/g, '<br>');

    // Wrap consecutive li items in ul
    html = html.replace(/(<li>.*<\/li>)(<br>)?/g, '$1');

    return html;
  };

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

  // Insert Markdown syntax
  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    setContent(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  // Format buttons
  const formatButtons = [
    { label: 'B', title: '加粗 (Ctrl+B)', action: () => insertMarkdown('**', '**'), className: 'font-bold' },
    { label: 'I', title: '斜体 (Ctrl+I)', action: () => insertMarkdown('*', '*'), className: 'italic' },
    { label: 'S', title: '删除线', action: () => insertMarkdown('~~', '~~'), className: 'line-through' },
    { label: 'H1', title: '标题1', action: () => insertMarkdown('# ') },
    { label: 'H2', title: '标题2', action: () => insertMarkdown('## ') },
    { label: 'H3', title: '标题3', action: () => insertMarkdown('### ') },
    { label: '•', title: '无序列表', action: () => insertMarkdown('- ') },
    { label: '1.', title: '有序列表', action: () => insertMarkdown('1. ') },
    { label: '☐', title: '待办事项', action: () => insertMarkdown('- [ ] ') },
    { label: '"', title: '引用', action: () => insertMarkdown('> ') },
    { label: '<>', title: '代码', action: () => insertMarkdown('`', '`') },
    { label: '🔗', title: '链接', action: () => insertMarkdown('[', '](url)') },
  ];

  // Keyboard shortcuts for formatting
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        if (e.key === 'b') {
          e.preventDefault();
          insertMarkdown('**', '**');
        } else if (e.key === 'i') {
          e.preventDefault();
          insertMarkdown('*', '*');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [content]);

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

          {/* Toggle Preview */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`px-3 py-1 text-xs rounded flex items-center gap-1 ${
              showPreview
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {showPreview ? '编辑' : '预览'}
          </button>

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

      {/* Format Toolbar */}
      {!showPreview && (
        <div className="flex items-center gap-1 px-4 py-1 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {formatButtons.map((btn, index) => (
            <button
              key={index}
              onClick={btn.action}
              title={btn.title}
              className={`px-2 py-1 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
                btn.className || ''
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

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

      {/* Editor / Preview */}
      <div className="flex-1 overflow-hidden">
        {showPreview ? (
          <div
            className="w-full h-full p-4 overflow-auto prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            className="w-full h-full p-4 bg-transparent border-none outline-none resize-none font-mono text-sm"
            placeholder="开始编写笔记... (支持 Markdown 语法)"
          />
        )}
      </div>
    </div>
  );
}
