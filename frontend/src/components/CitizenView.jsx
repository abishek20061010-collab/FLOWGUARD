import React, { useState, useEffect, useRef } from 'react';
import { Home, PlusCircle, List, PhoneCall, Bell, MapPin, Camera, CheckCircle, Crosshair, AlertTriangle, Wind, Waves, Clock, BookOpen, AlertCircle, Map, LayoutGrid, Anchor, LogOut, Loader2, Thermometer, Droplets, Shield } from 'lucide-react';
import { i18n, resources } from '../mockData';
import MarineAlerts from './MarineAlerts';
import { getMyReports, createReport } from '../api/reports';
import { triggerSOS } from '../api/sos';
import { getMarineWeather } from '../api/weather';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: icon,
  shadowUrl: iconShadow,
});

export default function CitizenView({ lang, setLang }) {
  const t = i18n[lang];
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [sosSent, setSosSent] = useState(false);
  const [reportState, setReportState] = useState('idle');
  const [viewMode, setViewMode] = useState('list'); // list or map

  const [reports, setReports] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loadingReports, setLoadingReports] = useState(true);

  const [selectedIssueType, setSelectedIssueType] = useState('Other');
  const [customIssueText, setCustomIssueText] = useState('');
  const [reportPhoto, setReportPhoto] = useState(null);
  const [reportLocation, setReportLocation] = useState(null);
  const [locationName, setLocationName] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'success', title: 'Report Resolved', message: 'Your report for "Choked Drain" in Marina Beach area has been marked as resolved by the civic team.', time: '10 mins ago', read: false },
    { id: 2, type: 'warning', title: 'Weather Alert Updated', message: 'A high wave warning has been issued for the coastal belt stretching from Ennore to Mahabalipuram.', time: '1 hour ago', read: false }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    // Only fetch weather and reports once location is acquired, or if it failed, fetch reports anyway but no specific weather
    fetchData();
  }, [reportLocation]);

  const fetchData = async () => {
    try {
      setLoadingReports(true);
      const tasks = [getMyReports(1, 10)];
      
      if (reportLocation) {
        tasks.push(getMarineWeather(reportLocation.lat, reportLocation.lng).catch(() => ({ data: null })));
      }
      
      const [reportsData, weatherData] = await Promise.all(tasks);
      setReports(reportsData?.data || []);
      
      if (weatherData && weatherData.data) {
        setWeather(weatherData.data);
      }
    } catch (e) {
      console.error('Failed to fetch data', e);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchLocationName = async (lat, lng) => {
    try {
      setLocationName("Resolving address...");
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&accept-language=en`);
      const data = await res.json();
      if (data && data.display_name) {
        // Cut the string to be more readable (first 2-3 significant parts)
        const parts = data.display_name.split(',');
        setLocationName(parts.slice(0, 3).join(',').trim());
      } else {
        setLocationName(null);
      }
    } catch (err) {
      console.error("Reverse geocoding failed", err);
      setLocationName(null);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setReportLocation({ lat, lng });
          setLocationError(false);
          fetchLocationName(lat, lng);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationError(true);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError(true);
    }
  };

  const requestLocationPrompt = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setReportLocation(loc);
          setLocationError(false);
          fetchLocationName(loc.lat, loc.lng);
          resolve(loc);
        },
        (err) => {
          setLocationError(true);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const handleSOS = async () => {
    let loc = reportLocation;
    if (!loc) {
      try {
        loc = await requestLocationPrompt();
      } catch (err) {
        alert("Please turn on your live location to send an accurate SOS signal!");
        return;
      }
    }

    setSosSent(true);
    alert(`🚨 CODE RED SOS DISPATCHED!\n\nYour live GPS coordinates (${Number(loc.lat).toFixed(4)}°N, ${Number(loc.lng).toFixed(4)}°E) have been securely transmitted to the Civil Defense Command Center.\n\nPlease stay calm and remain in your current location if it is safe to do so. Emergency Rescue Teams are currently being routed to your position.`);
    try {
      await triggerSOS(loc.lat, loc.lng);
    } catch (e) {
      console.error("SOS failed", e);
    }
  };

  const handleReportSubmit = async () => {
    if (!reportPhoto) {
      alert("A photo is required for the report.");
      return;
    }
    
    let loc = reportLocation;
    if (!loc) {
      try {
        setIsSubmitting(true);
        loc = await requestLocationPrompt();
      } catch (err) {
        setIsSubmitting(false);
        alert("Live location is required to map this issue accurately. Please allow location access in your browser settings.");
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      let dbCategory = 'other';
      if (selectedIssueType === 'Choked Drain') dbCategory = 'choked_drain';
      if (selectedIssueType === 'Road Damage') dbCategory = 'damaged_road';
      if (selectedIssueType === 'Waterlogging' || selectedIssueType === 'Waste Dump') dbCategory = 'waterlogging';

      formData.append('category', dbCategory);
      formData.append('latitude', loc.lat);
      formData.append('longitude', loc.lng);
      if (locationName) formData.append('location_name', locationName);
      if (selectedIssueType === 'Other' && customIssueText) {
        formData.append('description', customIssueText);
      }
      formData.append('photo', reportPhoto);
      
      await createReport(formData);
      setReportState('success');
      setReportPhoto(null);
      fetchData(); 
    } catch (e) {
      console.error(e);
      alert("Failed to create report: " + (e.response?.data?.error || e.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setReportPhoto(e.target.files[0]);
    }
  };

  // Safe accessor for weather
  const weatherLevel = weather?.wind_speed_kmh > 40 ? 'Orange' : 'Green';

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Weather & Alerts Hero Section */}
            <div className={`p-8 rounded-3xl border flex flex-col md:flex-row justify-between items-center relative overflow-hidden transition-all ${weatherLevel === 'Orange' ? 'border-orange-300 shadow-[0_0_40px_rgba(249,115,22,0.15)] bg-gradient-to-br from-orange-50 via-white to-amber-50' : 'border-blue-100 shadow-md bg-gradient-to-br from-blue-50 via-white to-indigo-50'}`}>
              
              <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/3 ${weatherLevel === 'Orange' ? 'bg-orange-400' : 'bg-blue-400'}`}></div>
              <div className={`absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/4 ${weatherLevel === 'Orange' ? 'bg-amber-400' : 'bg-indigo-400'}`}></div>

              <div className="mb-6 md:mb-0 space-y-3 text-center md:text-left relative z-10 w-full md:w-auto">
                <div className="flex items-center space-x-3 justify-center md:justify-start">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${weatherLevel === 'Orange' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                    {weatherLevel === 'Orange' ? <AlertCircle size={22}/> : <Shield size={22}/>}
                  </div>
                  <h3 className="font-display font-bold text-3xl text-slate-900 tracking-tight">{t.weather}</h3>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase border shadow-sm ${weatherLevel === 'Orange' ? 'bg-orange-500 text-white border-orange-600 animate-pulse' : 'bg-emerald-100 text-emerald-800 border-emerald-200'}`}>
                    {weatherLevel} CONDITION
                  </span>
                </div>
                <p className="text-slate-600 font-medium text-lg leading-relaxed max-w-lg">{weather?.description || 'Loading forecast...'} Stay alert and strictly follow local safety guidelines.</p>
              </div>
              
              <div className="flex space-x-6 relative z-10 w-full md:w-auto justify-center">
                <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/50 shadow-sm text-center flex flex-col items-center min-w-[90px] hover:-translate-y-1 transition-transform">
                  <Wind className={`h-7 w-7 mb-2 ${weatherLevel === 'Orange' ? 'text-orange-500' : 'text-blue-500'}`}/>
                  <span className="text-base font-black text-slate-800">{weather?.wind_speed_kmh || '--'} <span className="text-xs font-semibold text-slate-500">km/h</span></span>
                </div>
                <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/50 shadow-sm text-center flex flex-col items-center min-w-[90px] hover:-translate-y-1 transition-transform">
                  <Thermometer className={`h-7 w-7 mb-2 ${weatherLevel === 'Orange' ? 'text-orange-500' : 'text-blue-500'}`}/>
                  <span className="text-base font-black text-slate-800">{weather?.temperature_c || '--'}<span className="text-xs font-semibold text-slate-500">°C</span></span>
                </div>
                <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/50 shadow-sm text-center flex flex-col items-center min-w-[90px] hover:-translate-y-1 transition-transform">
                  <Droplets className={`h-7 w-7 mb-2 ${weatherLevel === 'Orange' ? 'text-orange-500' : 'text-blue-500'}`}/>
                  <span className="text-base font-black text-slate-800">{weather?.humidity || '--'}<span className="text-xs font-semibold text-slate-500">%</span></span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Feed */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-display text-2xl text-slate-900 font-bold tracking-tight">{t.recentReports}</h3>
                  <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 shadow-inner backdrop-blur-sm">
                    <button 
                      onClick={() => setViewMode('list')} 
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode==='list' ? 'bg-white text-blue-700 shadow-md ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
                    >
                      <LayoutGrid size={16}/> <span>Records</span>
                    </button>
                    <button 
                      onClick={() => setViewMode('map')} 
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode==='map' ? 'bg-white text-blue-700 shadow-md ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
                    >
                      <Map size={16}/> <span>Map View</span>
                    </button>
                  </div>
                </div>

                {viewMode === 'map' ? (
                  <div className="w-full h-[500px] bg-slate-100 rounded-xl border border-gray-200 overflow-hidden relative z-0">
                    <MapContainer 
                      center={reportLocation ? [reportLocation.lat, reportLocation.lng] : [13.0827, 80.2707]} 
                      zoom={reportLocation ? 13 : 11} 
                      className="w-full h-full"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {reports.map((r) => r.latitude && r.longitude ? (
                        <Marker key={r.id} position={[Number(r.latitude), Number(r.longitude)]}>
                          <Popup>
                            <div className="font-sans p-1">
                              <h4 className="font-bold text-gray-900 capitalize">{r.category?.replace('_', ' ')}</h4>
                              <p className="text-sm font-semibold mt-1 capitalize text-blue-600">{r.status}</p>
                              <p className="text-xs text-gray-500 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                            </div>
                          </Popup>
                        </Marker>
                      ) : null)}
                    </MapContainer>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {loadingReports ? (
                       <div className="text-center py-8 text-gray-400 font-medium">Loading reports...</div>
                    ) : reports.length === 0 ? (
                       <div className="text-center py-8 text-gray-400 font-medium">No reports yet.</div>
                    ) : (
                      reports.slice(0, 5).map((r) => (
                        <div key={r.id} className="modern-card p-5 flex items-start space-x-4 hover:shadow-md transition-shadow cursor-pointer bg-white">
                          <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-blue-100 overflow-hidden">
                            {r.photo_url ? (
                               <img src={r.photo_url} alt="Report" className="w-full h-full object-cover" />
                            ) : (
                               <Camera size={24} className="text-blue-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-lg text-slate-900 capitalize">{r.category?.replace('_', ' ')}</span>
                              <span className="text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md font-medium tracking-wide">{new Date(r.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm flex items-center text-gray-600 mt-1"><MapPin size={14} className="mr-1 text-blue-500"/>Lat {Number(r.latitude).toFixed(3)}, Lng {Number(r.longitude).toFixed(3)}</p>
                            <div className="mt-3">
                              <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${r.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' : r.status === 'assigned' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                {r.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar Action & Resources */}
              <div className="space-y-6">
                <div className="relative p-8 text-center space-y-5 rounded-3xl border border-blue-400 bg-gradient-to-b from-blue-600 to-indigo-800 text-white shadow-xl overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
                  
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center mx-auto mb-2 border border-white/30 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <AlertCircle size={32} />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-black mb-1">See Something?</h3>
                    <p className="text-sm text-blue-100 font-medium">Help secure your community. Map hazards like choked drains or damaged infrastructure instantly.</p>
                  </div>
                  <button onClick={() => setActiveTab('report')} className="w-full bg-white text-blue-700 text-lg font-black py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-[0_4px_14px_0_rgba(255,255,255,0.3)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.23)] flex items-center justify-center hover:-translate-y-0.5 active:translate-y-0">
                    <PlusCircle className="mr-2" /> Report Issue Now
                  </button>
                </div>

                <div className="modern-card p-6 bg-white space-y-4 border border-slate-200/60 shadow-sm rounded-3xl">
                  <h3 className="font-display text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center"><BookOpen size={18} className="mr-2 text-slate-400"/> Resource Library</h3>
                  <div className="space-y-2">
                    {resources.map((res, i) => (
                      <div key={i} className="flex items-start space-x-3 p-3 hover:bg-slate-50/80 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                        <div className="mt-0.5 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
                          <BookOpen size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{res.title}</p>
                          <p className="text-xs font-semibold text-slate-500">{res.type}</p>
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
                <p className="text-gray-500 mb-8 max-w-sm">Thank you for helping keep your city safe. Your ticket has been logged in the system.</p>
                <button onClick={() => {setReportState('idle'); setActiveTab('home');}} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl text-lg hover:bg-blue-700 transition-colors shadow-md">Return to Dashboard</button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h2 className="font-display text-2xl font-bold text-gray-900">{t.reportIssue}</h2>
                  <p className="text-gray-500 text-sm mt-1">Provide details about the issue to alert the authorities.</p>
                </div>
                
                <div 
                  className={`h-48 border-2 border-dashed ${reportPhoto ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'} rounded-xl flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden relative`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" />
                  
                  {reportPhoto ? (
                    <img src={URL.createObjectURL(reportPhoto)} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera size={48} className="mb-4 text-blue-500" />
                      <span className="text-base font-medium">Click or drag photo to capture incident</span>
                      <span className="text-xs text-gray-400 mt-2">Supports JPG, PNG (Max 5MB)</span>
                    </>
                  )}
                </div>
                
                <div className="bg-blue-50 p-4 rounded-xl flex items-center space-x-4 border border-blue-100">
                  <button 
                    onClick={async () => {
                      if (!navigator.geolocation) {
                        alert("Geolocation is not supported by your browser");
                        return;
                      }
                      const btn = document.getElementById('detect-icon');
                      if (btn) btn.classList.add('animate-spin');
                      try {
                        await requestLocationPrompt();
                      } catch (e) {
                        alert("Please allow location access to refresh your coordinates.");
                      } finally {
                        if (btn) btn.classList.remove('animate-spin');
                      }
                    }}
                    className="p-2 bg-white rounded-full shadow-sm hover:bg-blue-100 transition-colors cursor-pointer group"
                    title="Refresh Location"
                    type="button"
                  >
                    <Crosshair id="detect-icon" className="text-blue-600 group-hover:text-blue-700 transition-colors" size={20} />
                  </button>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-900">Detected Location</span>
                    {reportLocation ? (
                      <div>
                        {locationName ? (
                          <p className="text-base text-gray-900 font-semibold mt-0.5 leading-snug">{locationName}</p>
                        ) : null}
                        <p className="text-xs font-mono text-gray-500 mt-1">{Number(reportLocation.lat).toFixed(4)}° N, {Number(reportLocation.lng).toFixed(4)}° E <span className="ml-1">(GPS)</span></p>
                      </div>
                    ) : (
                      <p className="text-base text-red-500 font-medium mt-0.5">Live Location Required <button onClick={async () => { try { await requestLocationPrompt(); } catch(e){} }} className="text-blue-600 underline text-sm ml-2" type="button">Detect Now</button></p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-900 block">Primary Issue Type</label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {['Choked Drain', 'Road Damage', 'Waterlogging', 'Other'].map(type => (
                      <button 
                         key={type} 
                         onClick={() => setSelectedIssueType(type)}
                         className={`border rounded-xl p-3 text-center font-medium transition-all focus:outline-none ${selectedIssueType === type ? 'bg-blue-500 border-blue-600 text-white shadow-md' : 'border-gray-200 bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-300'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  {selectedIssueType === 'Other' && (
                    <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Describe the Problem</label>
                      <textarea
                        value={customIssueText}
                        onChange={(e) => setCustomIssueText(e.target.value)}
                        placeholder="Please provide details about the hazard you are reporting..."
                        className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-24"
                      ></textarea>
                    </div>
                  )}
                </div>

                <div className="pt-6">
                  <button onClick={handleReportSubmit} disabled={isSubmitting} className="w-full bg-blue-600 text-white text-lg font-bold py-4 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 flex justify-center items-center transition-all disabled:opacity-70">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2" />} 
                    {isSubmitting ? 'Submitting...' : t.submit}
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
                <span className="text-blue-600 font-display text-xl font-bold flex items-center">{user?.civic_coins || 0}</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {reports.map((r) => (
                <div key={r.id} className="modern-card p-6 bg-white space-y-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between w-full items-center border-b border-gray-100 pb-4">
                    <span className="font-bold text-lg font-mono text-gray-900">#...{r.id.substring(0,6)}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-1 capitalize">{r.category?.replace('_', ' ')}</h4>
                      <p className="text-gray-500 flex items-center text-sm">
                        <MapPin size={16} className="mr-1 flex-shrink-0"/>
                        {r.location_name || `Lat ${Number(r.latitude).toFixed(3)}, Lng ${Number(r.longitude).toFixed(3)}`}
                      </p>
                      {r.location_name && (
                        <a href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center">
                          <MapPin size={10} className="mr-0.5"/> View on Google Maps
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex justify-between text-xs font-semibold mb-3 capitalize">
                      <span className={r.status === 'reported' || r.status === 'assigned' || r.status === 'resolved' ? 'text-gray-900' : 'text-gray-400'}>Reported</span>
                      <span className={r.status === 'assigned' || r.status === 'resolved' ? 'text-gray-900' : 'text-gray-400'}>Assigned</span>
                      <span className={r.status === 'resolved' ? 'text-green-600' : 'text-gray-400'}>Resolved</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                      <div className={`h-full transition-all duration-1000 ${r.status === 'resolved' ? 'w-full bg-green-500' : r.status === 'assigned' ? 'w-2/3 bg-amber-500' : 'w-1/3 bg-blue-500'}`}></div>
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
                onClick={handleSOS}
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
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 rounded-full transition-colors border ${showNotifications ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-500 hover:bg-gray-100 border-transparent hover:border-gray-200'}`}
            >
              <Bell size={22} />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{unreadCount} New</span>}
                </div>
                <div className="p-2 space-y-1">
                  {notifications.map(n => (
                    <div key={n.id} onClick={() => setNotifications(notifications.map(x => x.id === n.id ? {...x, read: true} : x))} className={`p-3 rounded-xl cursor-pointer transition-colors flex items-start gap-3 ${n.read ? 'hover:bg-gray-50' : 'bg-blue-50/50 hover:bg-blue-50'}`}>
                      <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'success' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                         {n.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                      </div>
                      <div>
                        <p className={`text-sm mb-0.5 transition-colors ${n.read ? 'font-medium text-gray-600' : 'font-semibold text-gray-900'}`}>{n.title}</p>
                        <p className="text-xs text-gray-600 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-100 text-center">
                  <button onClick={() => setNotifications(notifications.map(n => ({...n, read: true})))} disabled={unreadCount === 0} className={`text-xs font-bold transition-colors ${unreadCount === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-700'}`}>
                    {unreadCount > 0 ? 'Mark all as read' : 'No new notifications'}
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="hidden md:flex items-center space-x-3 pl-6 border-l border-gray-200">
            <div className="text-right mr-1">
              <p className="text-sm font-semibold text-gray-900">{user?.full_name}</p>
              <div className="flex items-center justify-end space-x-1 mt-0.5">
                 <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-sm border border-yellow-200 flex items-center justify-center font-black text-[7px] text-yellow-900">C</div>
                 <p className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-yellow-600 tracking-wide">{user?.civic_coins || 0} Civic Points</p>
              </div>
            </div>
            <button onClick={logout} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10 p-8 pb-32">
        {renderContent()}
      </main>
    </div>
  );
}
