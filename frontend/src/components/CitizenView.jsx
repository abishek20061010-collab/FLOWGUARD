import React, { useState } from 'react';
import { Home, PlusCircle, List, PhoneCall, Bell, MapPin, Camera, CheckCircle, Crosshair, AlertTriangle, Wind, Waves, Clock, BookOpen, AlertCircle, Map, LayoutGrid, Anchor } from 'lucide-react';
import { mockReports, weatherData, i18n, resources } from '../mockData';
import MarineAlerts from './MarineAlerts';

export default function CitizenView({ lang, setLang }) {
  const t = i18n[lang];
  const [activeTab, setActiveTab] = useState('home');
  const [sosSent, setSosSent] = useState(false);
  const [reportState, setReportState] = useState('idle');
  const [viewMode, setViewMode] = useState('list'); // list or map

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Weather & Alerts Hero Section */}
            <div className={`p-8 rounded-2xl border flex flex-col md:flex-row justify-between items-center bg-white ${weatherData.alertLevel === 'Orange' ? 'border-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'border-gray-200 shadow-sm'}`}>
              <div className="mb-4 md:mb-0 space-y-2 text-center md:text-left">
                <div className="flex items-center space-x-3 justify-center md:justify-start">
                  <h3 className="font-display font-semibold text-2xl text-gray-900">{t.weather}</h3>
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-bold border border-amber-200">
                    {weatherData.alertLevel} ALERT IN EFFECT
                  </span>
                </div>
                <p className="text-gray-500 font-medium">{weatherData.forecast}. Stay safe and monitor local guidance.</p>
              </div>
              <div className="flex space-x-8">
                <div className="text-center flex flex-col items-center"><Wind className="h-6 w-6 mb-2 text-blue-600"/><span className="text-sm font-bold text-gray-900">{weatherData.windSpeed}</span><span className="text-xs text-gray-500">Wind</span></div>
                <div className="text-center flex flex-col items-center"><Waves className="h-6 w-6 mb-2 text-blue-600"/><span className="text-sm font-bold text-gray-900">{weatherData.waveHeight}</span><span className="text-xs text-gray-500">Wave</span></div>
                <div className="text-center flex flex-col items-center"><Clock className="h-6 w-6 mb-2 text-blue-600"/><span className="text-sm font-bold text-gray-900">{weatherData.tide}</span><span className="text-xs text-gray-500">Tide</span></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Feed */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-display text-xl text-gray-900 font-semibold">{t.recentReports}</h3>
                  <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode==='list' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}><LayoutGrid size={18}/></button>
                    <button onClick={() => setViewMode('map')} className={`p-1.5 rounded-md ${viewMode==='map' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}><Map size={18}/></button>
                  </div>
                </div>

                {viewMode === 'map' ? (
                  <div className="w-full h-[500px] bg-slate-100 rounded-xl border border-gray-200 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                    <MapPin size={48} className="text-blue-500 drop-shadow-md z-10" />
                    <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-md border border-gray-100 flex items-center space-x-3 text-sm font-medium z-10">
                      <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span> High</span>
                      <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span> Med</span>
                      <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span> Low</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mockReports.map((r, idx) => (
                      <div key={r.id} className="modern-card p-5 flex items-start space-x-4 hover:shadow-md transition-shadow cursor-pointer bg-white">
                        <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-blue-100">
                          <Camera size={24} className="text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-lg text-gray-900">{r.type}</span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-medium">{r.time}</span>
                          </div>
                          <p className="text-sm flex items-center text-gray-600 mt-1"><MapPin size={14} className="mr-1 text-blue-500"/>{r.location}</p>
                          <div className="mt-3">
                            <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${r.status === 'Resolved' ? 'bg-green-50 text-green-700 border-green-200' : r.status === 'Assigned' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                              {r.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar Action & Resources */}
              <div className="space-y-6">
                <div className="modern-card p-6 text-center space-y-4 bg-white">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <AlertCircle size={24} />
                  </div>
                  <h3 className="font-display text-xl font-bold text-gray-900">See something?</h3>
                  <p className="text-sm text-gray-600">Help your community by mapping hazards like choked drains or damaged infrastructure.</p>
                  <button onClick={() => setActiveTab('report')} className="w-full bg-blue-600 text-white text-lg font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center">
                    <PlusCircle className="mr-2" /> {t.reportIssue}
                  </button>
                </div>

                <div className="modern-card p-6 bg-white space-y-4">
                  <h3 className="font-display text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Resource Library</h3>
                  <div className="space-y-3">
                    {resources.map((res, i) => (
                      <div key={i} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                        <BookOpen size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{res.title}</p>
                          <p className="text-xs text-gray-500">{res.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'report':
        return (
          <div className="max-w-3xl mx-auto modern-card p-8 animate-in slide-in-from-bottom-4 duration-500 bg-white">
            {reportState === 'success' ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle size={40} />
                </div>
                <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">Report Submitted Successfully</h2>
                <p className="text-gray-500 mb-8 max-w-sm">Thank you for helping keep your city safe. Your ticket ID is <span className="font-mono text-gray-900 font-bold bg-gray-100 px-2 py-1 rounded">FG-1045</span>.</p>
                <button onClick={() => {setReportState('idle'); setActiveTab('home');}} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl text-lg hover:bg-blue-700 transition-colors shadow-md">Return to Dashboard</button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h2 className="font-display text-2xl font-bold text-gray-900">{t.reportIssue}</h2>
                  <p className="text-gray-500 text-sm mt-1">Provide details about the issue to alert the authorities.</p>
                </div>
                
                <div className="h-48 border-2 border-dashed border-gray-300 bg-gray-50 rounded-xl flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors hover:border-blue-400">
                  <Camera size={48} className="mb-4 text-blue-500" />
                  <span className="text-base font-medium">Click or drag photo to capture incident</span>
                  <span className="text-xs text-gray-400 mt-2">Supports JPG, PNG (Max 5MB)</span>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-xl flex items-center space-x-4 border border-blue-100">
                  <div className="p-2 bg-white rounded-full shadow-sm">
                    <Crosshair className="text-blue-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-900">Detected Location</span>
                    <p className="text-base font-mono text-gray-600 mt-0.5">13.0827° N, 80.2707° E <span className="text-sm text-gray-500 ml-2">(Marina Beach Area)</span></p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-900 block">Primary Issue Type</label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {['Choked Drain', 'Road Damage', 'Waste Dump', 'Other'].map(type => (
                      <button key={type} className="border border-gray-200 bg-white rounded-xl p-3 text-center text-gray-700 font-medium hover:bg-blue-50 hover:border-blue-300 transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none">{type}</button>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <button onClick={() => setReportState('success')} className="w-full bg-blue-600 text-white text-lg font-bold py-4 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 flex justify-center items-center transition-all">
                    <CheckCircle className="mr-2" /> {t.submit}
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'tracker':
        return (
          <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="modern-card p-6 flex justify-between items-center sticky top-24 z-10 bg-white/90 backdrop-blur-md">
              <h2 className="text-2xl font-display font-bold text-gray-900">{t.myReports}</h2>
              <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                <span className="text-blue-800 text-sm font-medium">Civic Reward Points:</span>
                <span className="text-blue-600 font-display text-xl font-bold flex items-center">120</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {mockReports.slice(0,4).map(r => (
                <div key={r.id} className="modern-card p-6 bg-white space-y-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between w-full items-center border-b border-gray-100 pb-4">
                    <span className="font-bold text-lg font-mono text-gray-900">{r.id}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">{r.time}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-1">{r.type}</h4>
                      <p className="text-gray-500 flex items-center text-sm"><MapPin size={16} className="mr-1"/> {r.location}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex justify-between text-xs font-semibold mb-3">
                      <span className={r.status === 'Reported' || r.status === 'Assigned' || r.status === 'Resolved' ? 'text-gray-900' : 'text-gray-400'}>Reported</span>
                      <span className={r.status === 'Assigned' || r.status === 'Resolved' ? 'text-gray-900' : 'text-gray-400'}>Assigned</span>
                      <span className={r.status === 'Resolved' ? 'text-green-600' : 'text-gray-400'}>Resolved</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                      <div className={`h-full transition-all duration-1000 ${r.status === 'Resolved' ? 'w-full bg-green-500' : r.status === 'Assigned' ? 'w-2/3 bg-amber-500' : 'w-1/3 bg-blue-500'}`}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'marine':
        return <MarineAlerts t={t} />;

      case 'sos':
        return (
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[70vh] animate-in zoom-in-95 duration-500">
            <div className="absolute inset-0 bg-red-50 opacity-50 pointer-events-none rounded-3xl border border-red-100"></div>
            
            <div className="text-center mb-12 z-10">
              <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">Emergency Assistance</h2>
              <p className="text-gray-600 text-lg max-w-xl mx-auto">Press the button below to immediately broadcast your GPS location to the coast guard and local emergency services.</p>
            </div>

            <div className="relative mb-16 z-10">
              <button 
                onClick={() => setSosSent(true)}
                className="relative z-10 w-64 h-64 bg-red-600 text-white rounded-full flex flex-col items-center justify-center font-bold text-3xl shadow-[0_20px_50px_rgba(239,68,68,0.4)] hover:bg-red-700 active:scale-95 transition-all outline-none focus:ring-8 focus:ring-red-200 border-8 border-white"
              >
                <AlertTriangle size={80} className="mb-4" />
                {t.sendSos}
              </button>
            </div>

            {sosSent ? (
              <div className="animate-in slide-in-from-bottom p-6 modern-card text-center max-w-lg w-full bg-white border-l-4 border-l-red-500 z-10">
                <p className="font-bold text-red-600 text-2xl mb-2">SOS Deployed</p>
                <p className="text-gray-600">Help is on the way. Keep your device on and stay in a safe location if possible.</p>
                <div className="mt-6 p-3 bg-red-50 rounded-lg flex items-center justify-center space-x-2 text-sm text-red-800 font-medium border border-red-100">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <span>Transmitting continuous secure location updates</span>
                </div>
              </div>
            ) : (
              <div className="modern-card bg-white p-4 rounded-full text-sm text-gray-600 flex items-center space-x-3 z-10 border border-gray-200 shadow-sm">
                <span className="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
                <span className="font-medium">System Armed • GPS & SMS Fallbacks Active</span>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="w-full min-h-screen subtle-bg relative flex flex-col">
      {/* Web Header */}
      <header className="relative z-20 px-8 py-4 flex justify-between items-center bg-white border-b border-gray-200 shadow-sm sticky top-0">
        <div className="flex items-center space-x-12">
          <h1 className="font-display font-bold text-2xl tracking-tight flex items-center text-gray-900">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-2 text-white"><Waves size={20}/></div>
            FlowGuard
          </h1>
          
          <nav className="hidden md:flex space-x-1">
            {[
              { id: 'home', icon: Home, label: t.home },
              { id: 'report', icon: PlusCircle, label: t.report },
              { id: 'tracker', icon: List, label: t.tracker },
              { id: 'marine', icon: Anchor, label: t.marine },
              { id: 'sos', icon: PhoneCall, label: t.sos }
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)} 
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg transition-all font-semibold text-sm ${activeTab === item.id ? (item.id === 'sos' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600') : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
            <button 
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${lang === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              EN
            </button>
            <button 
              onClick={() => setLang('ta')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${lang === 'ta' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              TA
            </button>
          </div>
          <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors border border-transparent hover:border-gray-200">
            <Bell size={22} />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="hidden md:flex items-center space-x-3 pl-6 border-l border-gray-200">
            <div className="w-9 h-9 rounded-full bg-gray-200 border border-gray-300 overflow-hidden">
               <img src="https://ui-avatars.com/api/?name=Citizen&background=2563EB&color=fff" alt="User" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Citizen Profile</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 p-8 pb-32">
        {renderContent()}
      </main>
    </div>
  );
}
