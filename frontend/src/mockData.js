export const mockReports = [
  { id: "FG-1042", type: "Choked Drain", location: "Anna Nagar West", severity: "HIGH", status: "Assigned", time: "2h ago", aiTag: "Plastic Blockage", assignee: "Unit A-1" },
  { id: "FG-1041", type: "Road Damage", location: "Velachery Main Rd", severity: "MEDIUM", status: "Reported", time: "3h ago", aiTag: "Structural", assignee: "Unassigned" },
  { id: "FG-1039", type: "Waste Dump", location: "Besant Nagar Beach", severity: "LOW", status: "Resolved", time: "6h ago", aiTag: "Mixed Waste", assignee: "Unit B-4" },
  { id: "FG-1038", type: "Choked Drain", location: "Kodambakkam", severity: "HIGH", status: "Reported", time: "1h ago", aiTag: "Vegetation", assignee: "Unassigned" },
  { id: "FG-1037", type: "Streetlight Out", location: "T Nagar", severity: "LOW", status: "Resolved", time: "12h ago", aiTag: "Electrical", assignee: "Unit C-2" },
  { id: "FG-1036", type: "Water Logging", location: "OMR Toll Plaza", severity: "HIGH", status: "Assigned", time: "1d ago", aiTag: "Drainage", assignee: "Unit A-3" },
];

export const weatherData = { windSpeed: "34 km/h", waveHeight: "1.8m", tide: "High at 06:42", alertLevel: "Orange", forecast: "Heavy Rain Expected" };

export const kpiData = { openReports: 143, codeRedZones: 3, resolvedToday: 67, activeSOS: 2, resolutionRate: "84%" };

export const chartData = [
  { day: "Mon", resolved: 40, new: 35 },
  { day: "Tue", resolved: 45, new: 50 },
  { day: "Wed", resolved: 60, new: 40 },
  { day: "Thu", resolved: 55, new: 65 },
  { day: "Fri", resolved: 80, new: 75 },
  { day: "Sat", resolved: 67, new: 45 },
  { day: "Sun", resolved: 50, new: 50 },
];

export const resources = [
  { title: "Monsoon Preparedness Guide v2.1", type: "PDF Document" },
  { title: "Emergency Shelters - Central Zone", type: "Directory" },
  { title: "Waste Segregation Guidelines", type: "Infographic" },
];

// ── Marine Fishermen Alert Data ──────────────────────────────────

export const marineAlerts = [
  {
    id: "MA-001",
    type: "Cyclone Warning",
    severity: "CRITICAL",
    title: "Cyclone DANA — Category 3",
    description: "Severe cyclonic storm DANA is expected to make landfall near Nagapattinam coast within 48 hours. All fishing vessels must return to harbor immediately.",
    issuedBy: "India Meteorological Department (IMD)",
    issuedAt: "2026-04-03 06:00 IST",
    expiresAt: "2026-04-05 18:00 IST",
    affectedZones: ["Zone A — North Chennai Coast", "Zone B — Ennore to Mahabalipuram", "Zone C — Cuddalore Belt"],
    actions: ["Return to harbor immediately", "Secure all fishing equipment", "Move to designated cyclone shelters", "Keep emergency radio on Channel 16"],
    active: true,
  },
  {
    id: "MA-002",
    type: "Storm Surge",
    severity: "HIGH",
    title: "Storm Surge Advisory — 2.5m Expected",
    description: "Storm surge of 2 to 3 meters expected along Chennai coast. Low-lying fishing villages should evacuate to higher ground.",
    issuedBy: "Indian National Centre for Ocean Information Services (INCOIS)",
    issuedAt: "2026-04-03 08:30 IST",
    expiresAt: "2026-04-04 12:00 IST",
    affectedZones: ["Zone A — North Chennai Coast", "Zone D — Kanyakumari"],
    actions: ["Evacuate low-lying areas", "Do not venture into the sea", "Keep emergency kits ready"],
    active: true,
  },
  {
    id: "MA-003",
    type: "Fishing Ban",
    severity: "HIGH",
    title: "Trawling Ban — Annual 61-Day Closure",
    description: "Annual fishing ban in effect for mechanized trawlers along the east coast to allow marine stock regeneration. Artisanal fishing with traditional boats permitted.",
    issuedBy: "Dept. of Fisheries, Govt. of Tamil Nadu",
    issuedAt: "2026-04-15 00:00 IST",
    expiresAt: "2026-06-14 23:59 IST",
    affectedZones: ["All Zones — East Coast"],
    actions: ["Mechanized trawlers must remain docked", "Report violations to local fisheries officer", "Use this period for net mending and boat repairs"],
    active: true,
  },
  {
    id: "MA-004",
    type: "High Wave",
    severity: "MEDIUM",
    title: "High Wave Alert — Swells up to 3.5m",
    description: "High ocean swells expected along the Tamil Nadu coast due to distant weather systems. Small craft advisory in effect.",
    issuedBy: "INCOIS",
    issuedAt: "2026-04-02 14:00 IST",
    expiresAt: "2026-04-03 20:00 IST",
    affectedZones: ["Zone B — Ennore to Mahabalipuram"],
    actions: ["Small boats should avoid venturing beyond 5 nautical miles", "Larger vessels exercise caution"],
    active: true,
  },
  {
    id: "MA-005",
    type: "Tsunami",
    severity: "CRITICAL",
    title: "Tsunami Watch — Andaman Region",
    description: "5.8 magnitude earthquake detected near Andaman Islands. Tsunami watch issued for Tamil Nadu coastline. Monitor updates.",
    issuedBy: "Indian Tsunami Early Warning Centre (ITEWC)",
    issuedAt: "2026-04-01 02:15 IST",
    expiresAt: "2026-04-01 14:00 IST",
    affectedZones: ["Zone A — North Chennai Coast", "Zone B — Ennore to Mahabalipuram", "Zone C — Cuddalore Belt", "Zone D — Kanyakumari"],
    actions: ["Move away from beachfront", "Listen for siren alerts", "Do NOT return until official all-clear"],
    active: false,
  },
];

export const fishingZones = [
  { id: "zone-a", name: "Zone A — North Chennai Coast", status: "DANGER", vessels: 12, advisory: "No fishing — Cyclone path", coordinates: "13.15°N, 80.30°E", lastUpdated: "10 min ago" },
  { id: "zone-b", name: "Zone B — Ennore to Mahabalipuram", status: "WARNING", vessels: 8, advisory: "Small craft advisory in effect", coordinates: "12.95°N, 80.25°E", lastUpdated: "15 min ago" },
  { id: "zone-c", name: "Zone C — Cuddalore Belt", status: "WARNING", vessels: 23, advisory: "Rough seas — Exercise caution", coordinates: "11.75°N, 79.80°E", lastUpdated: "5 min ago" },
  { id: "zone-d", name: "Zone D — Kanyakumari", status: "SAFE", vessels: 45, advisory: "Conditions favorable for fishing", coordinates: "8.10°N, 77.55°E", lastUpdated: "2 min ago" },
  { id: "zone-e", name: "Zone E — Rameswaram Strait", status: "SAFE", vessels: 31, advisory: "Calm seas — Normal operations", coordinates: "9.28°N, 79.30°E", lastUpdated: "8 min ago" },
];

export const vesselTracking = [
  { id: "TN-MFB-1204", name: "Meenavar Thoni", owner: "Rajan K.", zone: "Zone A", status: "Returning", lastPing: "5 min ago", crew: 6, distToShore: "12 NM", speed: "8 kn", heading: "W" },
  { id: "TN-MFB-0887", name: "Kadal Arasi", owner: "Murugan S.", zone: "Zone B", status: "Docked", lastPing: "1 min ago", crew: 4, distToShore: "0 NM", speed: "0 kn", heading: "—" },
  { id: "TN-MFB-2091", name: "Neethi Boat", owner: "Selvam P.", zone: "Zone C", status: "At Sea", lastPing: "18 min ago", crew: 8, distToShore: "28 NM", speed: "6 kn", heading: "NW" },
  { id: "TN-MFB-1555", name: "Ponni Vallam", owner: "Dhanush M.", zone: "Zone D", status: "At Sea", lastPing: "3 min ago", crew: 5, distToShore: "15 NM", speed: "5 kn", heading: "S" },
  { id: "TN-MFB-0342", name: "Tsunami Survivor", owner: "Kumar V.", zone: "Zone A", status: "DISTRESS", lastPing: "2 min ago", crew: 7, distToShore: "22 NM", speed: "0 kn", heading: "—" },
  { id: "TN-MFB-1789", name: "Vaanmathi", owner: "Arjun R.", zone: "Zone E", status: "At Sea", lastPing: "7 min ago", crew: 3, distToShore: "8 NM", speed: "4 kn", heading: "E" },
];

export const coastGuardContacts = [
  { name: "Indian Coast Guard — MRCC Chennai", phone: "044-2346 0405", channel: "VHF Ch. 16", available: "24/7", type: "primary" },
  { name: "District Fisheries Office — Chennai", phone: "044-2536 1212", channel: "—", available: "9 AM – 6 PM", type: "fisheries" },
  { name: "TNSDMA — Disaster Mgmt.", phone: "1070", channel: "—", available: "24/7", type: "disaster" },
  { name: "Coast Guard District HQ — Tuticorin", phone: "0461-232 0300", channel: "VHF Ch. 16", available: "24/7", type: "primary" },
  { name: "Fishermen Helpline", phone: "1093", channel: "—", available: "24/7", type: "helpline" },
];

export const seaConditions = {
  surfaceTemp: "28.4°C",
  visibility: "8 km",
  currentSpeed: "1.2 kn",
  currentDir: "SW",
  windSpeed: "42 km/h",
  windDir: "NE",
  waveHeight: "2.8m",
  wavePeriod: "8s",
  swellDir: "ESE",
  barometric: "1004 hPa",
  humidity: "87%",
  sunrise: "06:02",
  sunset: "18:24",
  moonPhase: "Waxing Gibbous",
  tideNext: "High Tide at 14:32",
  tideAfter: "Low Tide at 20:45",
};

export const alertHistory = [
  { date: "2026-04-03", type: "Cyclone Warning", severity: "CRITICAL", outcome: "Active" },
  { date: "2026-04-02", type: "High Wave Alert", severity: "MEDIUM", outcome: "Expired" },
  { date: "2026-04-01", type: "Tsunami Watch", severity: "CRITICAL", outcome: "Cancelled — No threat" },
  { date: "2026-03-28", type: "Fishing Ban Reminder", severity: "LOW", outcome: "Information" },
  { date: "2026-03-25", type: "Strong Current Advisory", severity: "MEDIUM", outcome: "Expired" },
  { date: "2026-03-20", type: "Oil Spill Warning", severity: "HIGH", outcome: "Resolved" },
  { date: "2026-03-15", type: "Fog Advisory", severity: "LOW", outcome: "Expired" },
];

// ── i18n ─────────────────────────────────────────────────────────

export const i18n = {
  en: {
    home: "Dashboard",
    report: "New Report",
    tracker: "My Tickets",
    sos: "Emergency SOS",
    marine: "Marine Alerts",
    weather: "Weather Advisory",
    reportIssue: "Create Report",
    recentReports: "Recent Activity",
    sendSos: "BROADCAST SOS",
    myReports: "Ticket History",
    fetchLoc: "Locating...",
    submit: "Submit Ticket",
    marineTitle: "Marine Fishermen Alerts",
    marineSubtitle: "Real-time safety advisories for coastal fishermen",
    seaConditions: "Sea Conditions",
    activeWarnings: "Active Warnings",
    fishingZones: "Fishing Zone Status",
    vesselTracker: "Vessel Tracker",
    emergencyContacts: "Emergency Contacts",
    alertTimeline: "Alert History",
    allClear: "All clear — Safe to sail",
    dangerZone: "Danger Zone",
    warningZone: "Warning",
    safeZone: "Safe",
  },
  ta: {
    home: "முகப்பு",
    report: "புதிய புகார்",
    tracker: "எனது புகார்கள்",
    sos: "அவசரம்",
    marine: "கடல் எச்சரிக்கைகள்",
    weather: "வானிலை",
    reportIssue: "புகார் செய்",
    recentReports: "சமீபத்திய புகார்கள்",
    sendSos: "அவசர உதவி",
    myReports: "எனது புகார்கள்",
    fetchLoc: "இடத்தை தேடுகிறது...",
    submit: "சமர்ப்பி",
    marineTitle: "கடல் மீனவர் எச்சரிக்கைகள்",
    marineSubtitle: "கடலோர மீனவர்களுக்கான நிகழ்நேர பாதுகாப்பு ஆலோசனைகள்",
    seaConditions: "கடல் நிலைமைகள்",
    activeWarnings: "செயலில் உள்ள எச்சரிக்கைகள்",
    fishingZones: "மீன்பிடி மண்டல நிலை",
    vesselTracker: "படகு கண்காணிப்பு",
    emergencyContacts: "அவசர தொடர்புகள்",
    alertTimeline: "எச்சரிக்கை வரலாறு",
    allClear: "பாதுகாப்பானது — பயணிக்கலாம்",
    dangerZone: "ஆபத்து மண்டலம்",
    warningZone: "எச்சரிக்கை",
    safeZone: "பாதுகாப்பு",
  }
};
