import React, { useState } from 'react';
import {
  Anchor, AlertTriangle, Navigation, Phone, Clock, Eye, Thermometer,
  Wind, Waves, ChevronDown, ChevronUp, Radio, Ship, MapPin, Shield,
  Compass, ArrowUpRight, Sun, Moon, Gauge, Droplets, Activity
} from 'lucide-react';
import {
  marineAlerts, fishingZones, vesselTracking, coastGuardContacts,
  seaConditions, alertHistory
} from '../mockData';

const severityConfig = {
  CRITICAL: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', badge: 'bg-red-600 text-white', icon: '🔴', pulse: true },
  HIGH: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', badge: 'bg-orange-500 text-white', icon: '🟠', pulse: false },
  MEDIUM: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', badge: 'bg-amber-500 text-white', icon: '🟡', pulse: false },
  LOW: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-500 text-white', icon: '🔵', pulse: false },
};

const zoneStatusConfig = {
  DANGER: { bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-700 border-red-200' },
  WARNING: { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  SAFE: { bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500', text: 'text-green-700', badge: 'bg-green-100 text-green-700 border-green-200' },
};

const vesselStatusConfig = {
  'At Sea': { color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  'Returning': { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  'Docked': { color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  'DISTRESS': { color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
};

export default function MarineAlerts({ t }) {
  const [expandedAlert, setExpandedAlert] = useState('MA-001');
  const [activeSection, setActiveSection] = useState('warnings');
  const [vesselSearch, setVesselSearch] = useState('');

  const activeAlerts = marineAlerts.filter(a => a.active);
  const criticalCount = activeAlerts.filter(a => a.severity === 'CRITICAL').length;

  const filteredVessels = vesselTracking.filter(v =>
    v.name.toLowerCase().includes(vesselSearch.toLowerCase()) ||
    v.id.toLowerCase().includes(vesselSearch.toLowerCase()) ||
    v.owner.toLowerCase().includes(vesselSearch.toLowerCase())
  );

  const sections = [
    { id: 'warnings', label: t.activeWarnings, icon: AlertTriangle },
    { id: 'zones', label: t.fishingZones, icon: MapPin },
    { id: 'vessels', label: t.vesselTracker, icon: Ship },
    { id: 'contacts', label: t.emergencyContacts, icon: Phone },
    { id: 'history', label: t.alertTimeline, icon: Clock },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                <Anchor size={26} />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-display">{t.marineTitle}</h2>
                <p className="text-blue-200 text-sm">{t.marineSubtitle}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20 text-center">
              <p className="text-2xl font-bold">{activeAlerts.length}</p>
              <p className="text-xs text-blue-200">Active Alerts</p>
            </div>
            {criticalCount > 0 && (
              <div className="bg-red-500/30 backdrop-blur-sm rounded-xl px-5 py-3 border border-red-400/40 text-center animate-pulse">
                <p className="text-2xl font-bold">{criticalCount}</p>
                <p className="text-xs text-red-200">Critical</p>
              </div>
            )}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20 text-center">
              <p className="text-2xl font-bold">{vesselTracking.filter(v => v.status === 'At Sea' || v.status === 'Returning').length}</p>
              <p className="text-xs text-blue-200">Vessels Out</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sea Conditions Grid */}
      <div className="modern-card p-6 bg-white">
        <h3 className="font-display text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity size={20} className="text-blue-600" /> {t.seaConditions}
          <span className="ml-auto text-xs font-normal text-gray-400">Live • Updated 2 min ago</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { icon: Wind, label: 'Wind', value: seaConditions.windSpeed, sub: seaConditions.windDir, color: 'blue' },
            { icon: Waves, label: 'Waves', value: seaConditions.waveHeight, sub: `Period ${seaConditions.wavePeriod}`, color: 'cyan' },
            { icon: Thermometer, label: 'Sea Temp', value: seaConditions.surfaceTemp, sub: 'Surface', color: 'orange' },
            { icon: Eye, label: 'Visibility', value: seaConditions.visibility, sub: 'Moderate', color: 'green' },
            { icon: Gauge, label: 'Pressure', value: seaConditions.barometric, sub: 'Falling', color: 'purple' },
            { icon: Droplets, label: 'Humidity', value: seaConditions.humidity, sub: seaConditions.moonPhase, color: 'teal' },
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center hover:shadow-md transition-shadow">
              <item.icon size={22} className={`mx-auto mb-2 text-${item.color}-500`} style={{ color: item.color === 'cyan' ? '#06b6d4' : item.color === 'teal' ? '#14b8a6' : undefined }} />
              <p className="text-lg font-bold text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 bg-blue-50 rounded-xl p-3 border border-blue-100">
          <span className="flex items-center gap-1.5"><Sun size={14} className="text-amber-500" /> Sunrise {seaConditions.sunrise}</span>
          <span className="flex items-center gap-1.5"><Moon size={14} className="text-indigo-500" /> Sunset {seaConditions.sunset}</span>
          <span className="flex items-center gap-1.5"><Waves size={14} className="text-blue-500" /> {seaConditions.tideNext}</span>
          <span className="flex items-center gap-1.5"><Compass size={14} className="text-green-500" /> Current {seaConditions.currentSpeed} {seaConditions.currentDir}</span>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 bg-white rounded-xl p-1.5 border border-gray-200 shadow-sm">
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeSection === s.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
            <s.icon size={16} /> {s.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      {activeSection === 'warnings' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {activeAlerts.map(alert => {
            const cfg = severityConfig[alert.severity];
            const expanded = expandedAlert === alert.id;
            return (
              <div key={alert.id} className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} overflow-hidden transition-all hover:shadow-lg`}>
                <button onClick={() => setExpandedAlert(expanded ? null : alert.id)}
                  className="w-full p-5 flex items-start gap-4 text-left">
                  <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-xl ${cfg.badge} flex items-center justify-center font-bold text-lg ${cfg.pulse ? 'animate-pulse' : ''}`}>
                    {alert.type === 'Cyclone Warning' ? '🌀' : alert.type === 'Storm Surge' ? '🌊' : alert.type === 'Fishing Ban' ? '🚫' : alert.type === 'High Wave' ? '〰️' : '⚠️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${cfg.badge}`}>{alert.severity}</span>
                      <span className="text-xs text-gray-500">{alert.type}</span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mt-1">{alert.title}</h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{alert.description}</p>
                  </div>
                  <div className="flex-shrink-0 mt-2">{expanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}</div>
                </button>
                {expanded && (
                  <div className="px-5 pb-5 space-y-4 border-t border-gray-200/50 pt-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <p className="text-gray-500"><span className="font-semibold text-gray-800">Issued by:</span> {alert.issuedBy}</p>
                        <p className="text-gray-500"><span className="font-semibold text-gray-800">Issued:</span> {alert.issuedAt}</p>
                        <p className="text-gray-500"><span className="font-semibold text-gray-800">Expires:</span> {alert.expiresAt}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">Affected Zones:</p>
                        <div className="flex flex-wrap gap-1.5">{alert.affectedZones.map((z, i) => (
                          <span key={i} className="text-xs bg-white px-2.5 py-1 rounded-lg border border-gray-200 font-medium">{z}</span>
                        ))}</div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <p className="font-semibold text-gray-800 mb-2 flex items-center gap-1.5"><Shield size={14} /> Required Actions:</p>
                      <ul className="space-y-1.5">{alert.actions.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">{i + 1}</span>{a}
                        </li>
                      ))}</ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeSection === 'zones' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="w-full h-64 bg-gradient-to-br from-blue-100 via-cyan-50 to-blue-50 rounded-2xl border border-blue-200 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(#60a5fa 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            {fishingZones.map((z, i) => {
              const cfg = zoneStatusConfig[z.status];
              return (
                <div key={z.id} className="absolute" style={{ top: `${20 + i * 12}%`, left: `${15 + i * 15}%` }}>
                  <div className={`w-4 h-4 rounded-full ${cfg.dot} ${z.status === 'DANGER' ? 'animate-pulse' : ''} shadow-lg`}></div>
                  <span className="absolute top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-700 whitespace-nowrap bg-white/80 px-1.5 py-0.5 rounded">{z.name.split('—')[0].trim()}</span>
                </div>
              );
            })}
            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm p-2.5 rounded-lg shadow-md border border-gray-100 flex items-center gap-3 text-xs font-medium z-10">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Danger</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Warning</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Safe</span>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fishingZones.map(zone => {
              const cfg = zoneStatusConfig[zone.status];
              return (
                <div key={zone.id} className={`modern-card p-5 ${cfg.bg} border ${cfg.border} hover:shadow-lg transition-shadow`}>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-gray-900 text-sm">{zone.name}</h4>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${cfg.badge}`}>{zone.status}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{zone.advisory}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Ship size={12} /> {zone.vessels} vessels</span>
                    <span>{zone.coordinates}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">Updated {zone.lastUpdated}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSection === 'vessels' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="modern-card p-4 bg-white">
            <input type="text" placeholder="Search vessel name, ID, or owner..." value={vesselSearch} onChange={e => setVesselSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400" />
          </div>
          <div className="grid gap-4">
            {filteredVessels.map(v => {
              const cfg = vesselStatusConfig[v.status] || vesselStatusConfig['At Sea'];
              const isDistress = v.status === 'DISTRESS';
              return (
                <div key={v.id} className={`modern-card p-5 bg-white border ${isDistress ? 'border-red-300 bg-red-50 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : 'border-gray-200'} hover:shadow-lg transition-shadow ${isDistress ? 'animate-pulse' : ''}`}>
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${cfg.bg}`}>
                        <Ship size={22} className={cfg.color} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900">{v.name}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${cfg.bg} ${cfg.color}`}>{v.status}</span>
                        </div>
                        <p className="text-xs text-gray-500">{v.id} • Owner: {v.owner} • Crew: {v.crew}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                      <span className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg"><Navigation size={12} className="inline mr-1" />{v.distToShore}</span>
                      <span className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg">Speed: {v.speed}</span>
                      <span className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg"><Compass size={12} className="inline mr-1" />{v.heading}</span>
                      <span className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg">{v.zone}</span>
                      <span className="text-gray-400">Ping: {v.lastPing}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSection === 'contacts' && (
        <div className="grid md:grid-cols-2 gap-4 animate-in fade-in duration-300">
          {coastGuardContacts.map((c, i) => (
            <div key={i} className="modern-card p-5 bg-white hover:shadow-lg transition-shadow flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${c.type === 'primary' ? 'bg-blue-100 text-blue-600' : c.type === 'disaster' ? 'bg-red-100 text-red-600' : c.type === 'helpline' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                {c.type === 'primary' ? <Radio size={22} /> : c.type === 'helpline' ? <Phone size={22} /> : <Shield size={22} />}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-sm">{c.name}</h4>
                <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="text-lg font-bold text-blue-600 hover:underline flex items-center gap-1 mt-1">{c.phone} <ArrowUpRight size={14} /></a>
                <div className="flex gap-3 mt-2 text-xs text-gray-500">
                  {c.channel !== '—' && <span className="bg-gray-100 px-2 py-0.5 rounded">{c.channel}</span>}
                  <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200">{c.available}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSection === 'history' && (
        <div className="modern-card p-6 bg-white animate-in fade-in duration-300">
          <div className="space-y-0">
            {alertHistory.map((h, i) => {
              const cfg = severityConfig[h.severity];
              return (
                <div key={i} className="flex items-start gap-4 relative pb-6 last:pb-0">
                  {i < alertHistory.length - 1 && <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-gray-200"></div>}
                  <div className={`w-10 h-10 rounded-full ${cfg.badge} flex items-center justify-center flex-shrink-0 text-sm font-bold z-10`}>{cfg.icon}</div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="font-semibold text-gray-900 text-sm">{h.type}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${cfg.badge}`}>{h.severity}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{h.date} — {h.outcome}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
