<h1 align="center" id="title">The Unified Platform for Urban Maintenance and Disaster Resilience</h1>

<p align="center"><img src="https://socialify.git.ci/abishek20061010-collab/FLOWGUARD/image?custom_description=Solving+urban+flooding+caused+by+clogged+drains+and+delayed+response+through+AI-powered+detection%2C+real-time+reporting%2C+and+smart+alerts.&amp;custom_language=HTML&amp;description=1&amp;font=Inter&amp;language=1&amp;name=1&amp;owner=1&amp;pattern=Plus&amp;theme=Dark" alt="project-image"></p>

<p id="description">FlowGuard is a smart civic platform that connects citizens and authorities to improve urban infrastructure and disaster response. It enables users to report issues like clogged drains with geo-tagged images and track their resolution in real time. The system provides an AI-powered admin dashboard to prioritize and manage incidents efficiently. It also delivers localized weather alerts and SOS support for coastal communities and fishermen. By combining civic participation with intelligent monitoring FlowGuard enhances city resilience and public safety.</p>

<p align="center"><img src="https://img.shields.io/badge/Frontend-React-blue?style=flat-square&amp;logo=react&amp;logoColor=white" alt="shields"><img src="https://img.shields.io/badge/Backend-Node.js-green?style=flat-square&amp;logo=node.js&amp;logoColor=white" alt="shields"><img src="https://img.shields.io/badge/AI-Python-yellow?style=flat-square&amp;logo=python&amp;logoColor=white" alt="shields"><img src="https://img.shields.io/badge/Database-Supabase-3ECF8E?style=flat-square&amp;logo=supabase&amp;logoColor=white" alt="shields"><img src="https://img.shields.io/badge/Notifications-Firebase-orange?style=flat-square&amp;logo=firebase&amp;logoColor=white" alt="shields"><img src="https://img.shields.io/badge/SMS-Twilio-red?style=flat-square&amp;logo=twilio&amp;logoColor=white" alt="shields"><img src="https://img.shields.io/badge/Maps-Leaflet-brightgreen?style=flat-square&amp;logo=leaflet&amp;logoColor=white" alt="shields"><img src="https://img.shields.io/badge/Status-Active-success?style=flat-square" alt="shields"><img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="shields"><img src="https://img.shields.io/badge/API-OpenWeather-blueviolet?style=flat-square" alt="shields"></p>

<h2>🚀 Demo</h2>

https://flowguard-rho.vercel.app/

<h2>Project Screenshots:</h2>

**Admin dashboard**
<img width="1895" height="873" alt="admin dashboard" src="https://github.com/user-attachments/assets/d3ad5639-a7ee-45b5-a890-f0e3df371b98" />

**Citizen dashboard**
<img width="1895" height="879" alt="citizen-dashboard" src="https://github.com/user-attachments/assets/94a8ee2e-7d24-47f1-ae71-c83b8f76750f" />

**Dashboard live location map**
<img width="1895" height="877" alt="dashboard-live location map" src="https://github.com/user-attachments/assets/28725b03-cb75-433b-8ed0-c513f9a11fa8" />

**Marine dashboard**
<img width="1895" height="862" alt="marine dashboard" src="https://github.com/user-attachments/assets/ae40ffbf-9797-40b4-9173-16198167d441" />

**Report issue**
<img width="1903" height="872" alt="Report issue" src="https://github.com/user-attachments/assets/58e36277-ebe0-4137-bfe7-c30482fd1a9d" />

**Reports**
<img width="1904" height="864" alt="Reports" src="https://github.com/user-attachments/assets/a5ee81d8-0ad1-4ed0-bd39-8a001415aac8" />

**Field Teams**
<img width="1905" height="867" alt="Teams" src="https://github.com/user-attachments/assets/624f65e4-c814-4e50-b0df-0409e4b31e28" />

**Ticket history**
<img width="1898" height="867" alt="ticket history" src="https://github.com/user-attachments/assets/87ab942b-41fa-4a34-9ac8-12a83d00c958" />

**Ticket queue**
<img width="1572" height="682" alt="Ticket queue" src="https://github.com/user-attachments/assets/211303d7-66fd-443d-ad04-318091299621" />


<h2>🧐 Features</h2>

Here're some of the project's best features:

*   **Geotagged Issue Reporting** – Report clogged drains or infrastructure issues with images and automatic location detection
*   **AI-Based Detection & Triage** – Classifies blockage type and assigns severity (Low, Medium, High) using ML
*   **Live Issue Tracking** – Track report status in real time (Reported → Assigned → Resolved)
*   **Smart Admin Dashboard** – Clusters reports, identifies high-risk zones, and enables faster decision-making
*   **Real-Time Weather Alerts** – Detects risky conditions and triggers Yellow, Orange, and Red alerts
*   **Marine Safety Dashboard** – Provides fishermen with wind speed, wave height, and tide information
*   **SOS Emergency System** – One-click emergency alert with live location sharing to authorities
*   **Offline SMS Fallback** – Sends SOS via SMS when internet connectivity is unavailable
*   **Push Notifications** – Instant alerts using Firebase for weather risks and updates
*   **Multi-Input Architecture** – Combines citizen reports, AI analysis, and IoT-ready data integration
*   **Civic Coins System** – Rewards users for valid reports that lead to issue resolution
*   **Multi-Language Support** – Supports English and Tamil for accessibility

<h2>🛠️ Installation Steps:</h2>

<p>1. Clone Repository</p>

```bash
git clone https://github.com/abishek20061010-collab/FLOWGUARD.git
cd FLOWGUARD
```

<p>2. Install Backend Dependencies</p>

```bash
cd flowguard-backend
npm install
```

<p>3. Run Backend Server</p>

```bash
npm run dev
```

<p>4. Install Frontend Dependencies</p>

```bash
cd ../frontend
npm install
```

<p>5. Run Frontend Application</p>

```bash
npm run dev
```

## 🌐 Deployment

### 1. Backend & ML (Render)
This project uses a **Render Blueprint** for a one-click deployment of the backend and ML services.

1.  Create a **New Blueprints Instance** on Render.
2.  Connect your GitHub repository.
3.  Render will detect the `render.yaml` file and automatically configure:
    - `flowguard-ml` (Python Web Service)
    - `flowguard-backend` (Node.js Web Service)
4.  **Fill in Environment Variables**: You will be prompted for Supabase, Firebase, and Twilio keys during the setup in the Render Dashboard.
5.  **Connect Services**: Once deployed, the Backend will automatically receive the ML service URL, but you should manually set the `FRONTEND_URL` to your Vercel URL.

### 2. Frontend (Vercel)
1.  Connect your GitHub repository to Vercel.
2.  **Set Root Directory**: Select the `frontend` folder.
3.  **Environment Variables**:
    - `VITE_API_BASE_URL`: Set this to your Render Backend URL (e.g., `https://flowguard-backend.onrender.com`).
    - `VITE_SUPABASE_URL`: Your Supabase Project URL.
    - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
4.  Vercel will detect the `vercel.json` for routing.

---

## 👥 Team FlowGuard

FlowGuard was designed and developed as part of a collaborative effort to build a real-world smart city solution focused on urban resilience and disaster prevention.

### 🚀 Core Contributors

| Name | Role | Contributions |
|------|------|--------------|
| **Harishwer** | Full Stack Developer | Led end-to-end development including frontend (React), backend (Node.js), API integration, system architecture, and deployment |
| **Saran** | AI/ML Engineer | Designed and implemented image classification models for blockage detection and severity analysis |
| **Abishek** | UI/UX Designer | Crafted user interface, user experience flows, and ensured accessibility across devices |
| **Naveen** | Backend Developer | Developed APIs, handled database design (Supabase), and implemented authentication & real-time features |

---

### 💻 Built with

Technologies used in the project:

*   **Frontend:** React (Vite, TypeScript), Tailwind CSS
*   **Backend:** Node.js, Express.js
*   **Database & Realtime:** Supabase (PostgreSQL, Realtime)
*   **AI/ML Integration:** Python (FastAPI, TensorFlow Lite / HuggingFace)
*   **External Integrations:** OpenWeatherMap API, Firebase FCM, Twilio SMS
*   **System Design:** Multi-input architecture (Citizen + AI + IoT-ready)

---

### 🏁 Acknowledgment

We thank the hackathon organizers and mentors for providing the opportunity to build FlowGuard and address real-world urban challenges through technology.
