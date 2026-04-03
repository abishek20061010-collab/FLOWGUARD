import React, { useState } from 'react';
import CitizenView from './components/CitizenView';
import AdminView from './components/AdminView';

export default function App() {
  const [view, setView] = useState('citizen'); // 'citizen' | 'admin'
  const [lang, setLang] = useState('en');      // 'en' | 'ta'

  return (
    <div className="min-h-screen relative">
      {/* Floating Toggle Switch for Reviewer - Moved to Bottom Right */}
      <div className="fixed bottom-6 right-6 bg-white shadow-xl border border-gray-200 p-2 rounded-full flex z-50">
        <button 
          onClick={() => setView('citizen')}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${view === 'citizen' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
        >
          Citizen Portal
        </button>
        <button 
          onClick={() => setView('admin')}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${view === 'admin' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
        >
          Admin Dashboard
        </button>
      </div>

      {view === 'citizen' ? (
        <CitizenView lang={lang} setLang={setLang} />
      ) : (
        <div className="w-full flex justify-center animate-in fade-in duration-300">
          <AdminView />
        </div>
      )}
    </div>
  );
}
