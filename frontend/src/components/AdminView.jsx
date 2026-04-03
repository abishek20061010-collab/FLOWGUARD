import React, { useState } from 'react';
import { Home, List, Map, AlertTriangle, Settings, Bell, TrendingUp, Radio, Maximize, AlertCircle, ChevronDown, Check, Download, Users, ChevronRight, BarChart, Search, Filter, MapPin } from 'lucide-react';
import { mockReports, kpiData, chartData } from '../mockData';

export default function AdminView() {
  const [alertLevel, setAlertLevel] = useState('None');
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <div className="w-full min-h-screen subtle-bg flex overflow-hidden relative">

      {/* Sidebar - Clean Light Theme */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col z-10 shadow-sm relative">
        <div className="p-6 border-b border-gray-100 flex items-center">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 text-white shadow-sm"><AlertCircle size={20}/></div>
           <h1 className="font-display font-bold text-xl tracking-tight text-gray-900">
             FlowGuard <span className="text-blue-600 text-[10px] uppercase tracking-widest align-top ml-1">Gov</span>
           </h1>
        </div>
        
        <div className="p-4 flex flex-col h-full justify-between">
          <nav className="space-y-1">
            {[
              { id: 'overview', icon: Home, label: 'Overview', active: true },
              { id: 'analytics', icon: BarChart, label: 'Analytics', active: false },
              { id: 'reports', icon: List, label: 'Ticket Queue', active: false },
              { id: 'map', icon: Map, label: 'Live Heatmap', active: false },
              { id: 'broadcasts', icon: Radio, label: 'E-Broadcasts', active: false },
              { id: 'teams', icon: Users, label: 'Field Teams', active: false },
            ].map((item, i) => (
              <button key={item.id} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${item.active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <item.icon size={18} className={item.active ? 'text-blue-600' : 'text-gray-400'}/>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-2 pt-6 border-t border-gray-100">
            <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-gray-600 hover:bg-gray-50">
              <Settings size={18} className="text-gray-400"/>
              <span>System Settings</span>
            </button>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100 mt-4">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-200">CO</div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-gray-900 truncate">Chief Officer</p>
                <p className="text-[10px] text-gray-500 font-medium truncate">Control Room Alpha</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col z-10 w-full overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex justify-between items-center px-8 shadow-sm shrink-0">
          <div className="flex items-center">
            <h2 className="font-display font-semibold text-gray-800">Command Center <span className="text-gray-400 font-normal mx-2">/</span> Overview</h2>
          </div>
          <div className="flex items-center space-x-6">
            <span className="text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">24 OCT 2024 • 14:32</span>
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 p-8 overflow-y-auto space-y-6 custom-scrollbar">
          
          <div className="flex justify-between items-end">
             <div>
                <h2 className="font-display text-2xl font-bold text-gray-900">City Overview</h2>
                <p className="text-gray-500 text-sm mt-1">Real-time metrics for Chennai Metropolitan Area.</p>
             </div>
             <button className="bg-white border border-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center shadow-sm">
               <Download size={16} className="mr-2" /> Export Report
             </button>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-5 gap-4">
            <div className="modern-card p-5 relative overflow-hidden bg-white border-l-4 border-l-blue-500">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Open Reports</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-display font-bold text-gray-900">{kpiData.openReports}</span>
                <span className="text-amber-500 flex items-center text-xs font-bold bg-amber-50 px-2 py-0.5 rounded"><TrendingUp size={14} className="mr-1"/> +12%</span>
              </div>
            </div>
            <div className="modern-card p-5 relative overflow-hidden bg-white border-l-4 border-l-red-500">
              <div className="absolute top-4 right-4"><div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_#EF4444]"></div></div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Code Red Zones</p>
              <span className="text-3xl font-display font-bold text-red-600">{kpiData.codeRedZones}</span>
            </div>
            <div className="modern-card p-5 relative overflow-hidden bg-white border-l-4 border-l-green-500">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Resolved Today</p>
              <span className="text-3xl font-display font-bold text-green-600">{kpiData.resolvedToday}</span>
            </div>
            <div className="modern-card p-5 relative overflow-hidden bg-white border-l-4 border-l-amber-500">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Active SOS</p>
              <span className="text-3xl font-display font-bold text-amber-600">{kpiData.activeSOS}</span>
            </div>
            <div className="modern-card p-5 relative overflow-hidden bg-gray-900 border-l-4 border-l-blue-400">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Resolution Rate</p>
              <div className="flex items-center space-x-2">
                 <span className="text-3xl font-display font-bold text-white">{kpiData.resolutionRate}</span>
                 <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Resolution Trends Graph Placeholder */}
            <div className="modern-card bg-white p-6 xl:col-span-2 flex flex-col min-h-[350px]">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="font-semibold text-gray-900 border-b-2 border-transparent">Volume Trends (7 Days)</h3>
                 <div className="flex items-center space-x-4 text-sm">
                   <div className="flex items-center text-gray-500"><span className="w-3 h-3 bg-blue-500 rounded-sm mr-2"></span> New Tickets</div>
                   <div className="flex items-center text-gray-500"><span className="w-3 h-3 bg-green-500 rounded-sm mr-2"></span> Resolved</div>
                 </div>
               </div>
               
               <div className="flex-1 flex items-end justify-between space-x-2 pt-4 relative">
                  {/* Mock Y-Axis */}
                  <div className="absolute left-0 top-0 bottom-8 border-r border-gray-100 pr-2 flex flex-col justify-between text-xs text-gray-400">
                    <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
                  </div>
                  <div className="pl-8 flex w-full justify-between items-end h-full">
                    {chartData.map((d, i) => (
                      <div key={i} className="flex flex-col items-center flex-1 mx-2 group">
                        <div className="w-full flex space-x-1 items-end pt-10 h-[220px]">
                           <div className="w-1/2 bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors" style={{height: `${d.new}%`}}></div>
                           <div className="w-1/2 bg-green-500 rounded-t-sm hover:bg-green-600 transition-colors" style={{height: `${d.resolved}%`}}></div>
                        </div>
                        <span className="text-xs text-gray-500 mt-3 font-medium">{d.day}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            {/* Quick Map Widget */}
            <div className="modern-card bg-white border flex flex-col relative overflow-hidden xl:col-span-1 min-h-[350px]">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                <h3 className="font-semibold text-gray-900">Live Density Map</h3>
                <button className="text-gray-400 hover:text-gray-600 bg-gray-50 p-1.5 rounded-lg border border-gray-200"><Maximize size={16}/></button>
              </div>
              <div className="flex-1 relative bg-slate-100 flex items-center justify-center -m-[1px]" style={{backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '15px 15px'}}>
                <Map size={32} className="text-gray-400 z-0" />
                <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-red-500/20 rounded-full animate-ping z-10"></div>
                <div className="absolute top-1/2 left-1/3 w-3 h-3 bg-red-600 rounded-full shadow-lg z-20 border-2 border-white"></div>
                <div className="absolute top-1/3 left-2/3 w-3 h-3 bg-amber-500 rounded-full shadow-lg z-20 border-2 border-white"></div>
                <div className="absolute bottom-1/4 left-1/2 w-3 h-3 bg-green-500 rounded-full shadow-lg z-20 border-2 border-white"></div>
              </div>
            </div>
          </div>

          {/* Alert Broadcast Banner - Upgraded to a clean panel */}
          <div className="modern-card border border-blue-200 bg-blue-50 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
             <div>
               <h3 className="font-display font-bold text-blue-900 text-lg flex items-center"><Radio size={20} className="mr-2 text-blue-600"/> Emergency Broadcast System</h3>
               <p className="text-blue-700 text-sm mt-1">Issue mass SMS and app push notifications to targeted geofences.</p>
             </div>
             
             <div className="flex items-center space-x-4 w-full md:w-auto">
               <div className="flex-1 md:flex-none">
                  <select className="w-full bg-white border border-blue-200 text-gray-700 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option>Target: All Coastal Zones</option>
                    <option>Target: Marina & Santhome</option>
                    <option>Target: Ennore Industrial</option>
                  </select>
               </div>
               <button className="bg-red-600 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-red-700 transition shadow-sm whitespace-nowrap">
                 Broadcast Red Alert
               </button>
             </div>
          </div>

          {/* AI Triage Queue - Upgraded to Data Table */}
          <div className="modern-card bg-white flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-white">
              <h3 className="font-display font-bold text-gray-900 flex items-center"><AlertCircle size={18} className="mr-2 text-blue-600"/> Ticket Queue</h3>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                  <input type="text" placeholder="Search ID or Keyword..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-64 bg-gray-50"/>
                </div>
                <button className="flex items-center text-sm font-medium text-gray-600 bg-white border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50">
                  <Filter size={16} className="mr-2"/> Filter
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Ticket ID</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Issue & Location</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase">AI Tag</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Severity</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Assignment</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockReports.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-4 font-mono text-sm text-gray-900 font-medium">{r.id}</td>
                      <td className="p-4">
                        <div className="text-sm font-bold text-gray-900">{r.type}</div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center"><MapPin size={12} className="mr-1 text-gray-400"/> {r.location} <span className="text-gray-300 mx-2">•</span> {r.time}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {r.aiTag}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${r.severity === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' : r.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                          {r.severity}
                        </span>
                      </td>
                      <td className="p-4">
                        {r.assignee === 'Unassigned' ? (
                          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">Needs Assignment</span>
                        ) : (
                          <div className="flex items-center">
                            <div className="w-5 h-5 rounded bg-gray-200 text-[10px] flex items-center justify-center font-bold text-gray-600 mr-2 border border-gray-300">U</div>
                            <span className="text-sm font-medium text-gray-700">{r.assignee}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">View Detail <ChevronRight size={14} className="inline align-middle"/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500 bg-gray-50">
              <span>Showing 1 to 6 of 143 entries</span>
              <div className="flex space-x-1">
                <button className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-300 cursor-not-allowed">Prev</button>
                <button className="px-3 py-1 border border-blue-500 rounded bg-blue-50 text-blue-700 font-medium">1</button>
                <button className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-100 text-gray-700">2</button>
                <button className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-100 text-gray-700">3</button>
                <button className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-100 text-gray-700">Next</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
