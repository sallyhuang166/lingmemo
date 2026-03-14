import { useEffect } from 'react';
import { useNoteStore } from './stores/noteStore';
import { useAuthStore } from './stores/authStore';
import { Sidebar } from './components/Sidebar/Sidebar';
import { NoteEditor } from './components/Editor/Editor';
import { CommandPalette } from './components/CommandPalette/CommandPalette';
import { AuthScreen } from './components/Auth/AuthScreen';

function App() {
  const { initialize, isLoading: noteLoading } = useNoteStore();
  const { initialize: initAuth, isAuthenticated, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      initialize();
    }
  }, [isAuthenticated, initialize]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <svg className="w-8 h-8 mx-auto animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-2 text-sm text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Show loading while initializing notes
  if (noteLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <svg className="w-8 h-8 mx-auto animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-2 text-sm text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      <NoteEditor />
      <CommandPalette />
    </>
  );
}

export default App;
