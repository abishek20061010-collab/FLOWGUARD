import React, { useState } from 'react';
import CitizenView from './components/CitizenView';
import AdminView from './components/AdminView';
import AuthPage from './components/AuthPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [lang, setLang] = useState('en');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 subtle-bg">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen relative">
      {user.role === 'admin' ? (
        <div className="w-full flex justify-center animate-in fade-in duration-300">
          <AdminView />
        </div>
      ) : (
        <CitizenView lang={lang} setLang={setLang} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
