# MediaVault 🛡️
### A cloud-based media management platform - COM682 Coursework 2

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Azure](https://img.shields.io/badge/Microsoft_Azure-0089D6?style=flat&logo=microsoft-azure&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

---

## Overview

MediaVault is a full-stack media storage and sharing platform built for COM682 Cloud Computing (Ulster University). Users can upload, manage, and organise photos and videos securely in the cloud. Admins have full control over the platform including user management, audit logs, and real-time platform statistics.

---

## Features

### User Features
- 📁 Upload photos and videos to Azure Blob Storage
- 🏷️ Manual tagging + **AI auto-tagging** via Azure Computer Vision
- 🔍 Search and filter media by tags, type, or name
- 📊 Personal media statistics (total uploads, storage used)
- 📧 Email notification on upload (Azure Logic App)

### Admin Features
- 👥 View and manage all users
- 🔒 Change user roles (user / admin)
- 🗑️ Delete users and their media
- 📋 View audit logs per user
- 📈 Platform-wide statistics via Azure Functions
- 📧 Email alerts for uploads, deletions, and registrations

---

## Architecture

```
Browser (HTML/CSS/JS)
        │
        ▼
Azure App Service (Node.js + Express)
        │
   ┌────┼────────────────────┐
   │    │                    │
   ▼    ▼                    ▼
Azure  Azure SQL DB     Azure Cosmos DB
Blob   (users,          (media metadata,
Store  passwords,       tags, file info)
       roles, logs)
        │
   ┌────┼──────────────────────────┐
   │    │                          │
   ▼    ▼                          ▼
Logic  Logic App            Azure Functions
App 1  2 & 3                (platform stats)
(upload (delete +
 alert)  registration
         alerts)
        │
        ▼
   Computer Vision
   (AI image tagging)
```

---

## Azure Services Used

| Service | Purpose |
|---------|---------|
| **App Service** | Hosts the Node.js backend |
| **Blob Storage** | Stores uploaded photos and videos |
| **Cosmos DB** | Stores media metadata and tags |
| **SQL Database** | Stores users, passwords, roles, audit logs |
| **Computer Vision** | AI auto-tagging for uploaded images |
| **Logic Apps (×3)** | Automated email notifications |
| **Azure Functions** | Serverless platform statistics API |
| **Application Insights** | Live monitoring and logging |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Frontend | HTML + CSS + Vanilla JS (SPA) |
| Database 1 | Azure Cosmos DB (NoSQL) |
| Database 2 | Azure SQL Database |
| File Storage | Azure Blob Storage |
| AI | Azure Computer Vision |
| Notifications | Azure Logic Apps + Nodemailer |
| Serverless | Azure Functions |
| Monitoring | Application Insights |
| CI/CD | GitHub Actions |

---

## Folder Structure

```
mediavault/
├── api/
│   ├── config/
│   │   ├── db.js                  # Azure SQL connection
│   │   ├── cosmos.js              # Cosmos DB connection
│   │   ├── storage.js             # Azure Blob Storage
│   │   └── computerVision.js      # Azure Computer Vision AI
│   ├── routes/
│   │   ├── auth.js                # Login / Register
│   │   ├── media.js               # Upload, delete, tag media
│   │   ├── users.js               # User management (admin)
│   │   ├── notify.js              # Logic App proxy
│   │   └── logicapps.js           # Logic App list for admin UI
│   ├── middleware/
│   │   └── auth.js                # Session / role middleware
│   ├── public/
│   │   └── index.html             # Full single-page frontend
│   ├── uploads/                   # Temp upload folder
│   ├── server.js                  # Express server entry point
│   └── package.json
├── .github/
│   └── workflows/
│       └── deploy.yml             # GitHub Actions CI/CD
├── .env.example
└── README.md
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- Azure account with the services listed above
- Git

> **Note:** This project was built and deployed against live Azure services. The steps below show the project's structure and configuration — running it fully requires your own Azure resources (Storage, Cosmos DB, SQL, Computer Vision, etc.) provisioned and referenced in `.env`.

### 1. Clone the repository
```bash
git clone https://github.com/ahamedfaysal372-wq/mediavault.git
cd mediavault/api
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create a `.env` file
```env
PORT=3000

# Azure SQL
SQL_SERVER=your-server.database.windows.net
SQL_DATABASE=mediavaultdb
SQL_USER=your-username
SQL_PASSWORD=your-password

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
AZURE_CONTAINER_NAME=media

# Azure Cosmos DB
COSMOS_ENDPOINT=https://your-cosmos.documents.azure.com:443/
COSMOS_KEY=your-cosmos-key
COSMOS_DATABASE=mediavault
COSMOS_CONTAINER=media

# Azure Computer Vision
COMPUTER_VISION_ENDPOINT=https://your-region.api.cognitive.microsoft.com/
COMPUTER_VISION_KEY=your-key

# Azure Logic Apps
LOGIC_APP_URL=https://prod-xx.logic.azure.com/workflows/.../triggers/...
LOGIC_APP_DELETE_URL=https://prod-xx.logic.azure.com/workflows/.../triggers/...
LOGIC_APP_REGISTER_URL=https://prod-xx.logic.azure.com/workflows/.../triggers/...

# Azure Functions
MEDIA_STATS_FUNCTION_URL=https://your-function.azurewebsites.net/api/MediaStats
```

### 4. Run locally
```bash
npm run dev
```

### 5. Open in browser
```
http://localhost:3000
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |

### Media
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/media` | Get all media |
| POST | `/api/media` | Upload media (+ AI tagging) |
| PUT | `/api/media/:id` | Update tags/caption |
| DELETE | `/api/media/:id` | Delete media |

### Users (Admin)
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/users` | Get all users |
| DELETE | `/api/users/:id` | Delete user |
| PUT | `/api/users/:id/role` | Change user role |
| GET | `/api/users/:id/logs` | Get audit logs |

### Notifications
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/api/notify` | Trigger Logic App email |

### Stats
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/stats` | Get platform stats (via Azure Functions) |

---

## Roles

| Role | Access |
|------|--------|
| `user` | Upload, view, tag, delete own media |
| `admin` | Everything above + manage users, view audit logs, platform stats |

---

## Logic Apps (Email Notifications)

| Logic App | Trigger | Who Gets the Email |
|-----------|---------|-------------------|
| Upload Alert | User uploads media | The user who uploaded |
| Delete Alert | Media is deleted | The user who deleted |
| Registration Alert | New user registers | Admin email |

---

## AI Tagging

When a user uploads an image, it is automatically analysed by **Azure Computer Vision**. Tags with confidence above 70% are saved alongside the media with the prefix `ai:` (e.g. `ai:sky`, `ai:person`, `ai:outdoor`). Images over 4MB skip AI tagging and are tagged `ai:large-image`.

---

## Deployment

This project is deployed to **Azure App Service** via **GitHub Actions CI/CD**.

Every push to the `main` branch automatically:
1. Installs dependencies
2. Runs build checks
3. Deploys to Azure App Service

---

## Author

**Faysal Ahamed**
Ulster University · COM682 - Cloud Computing

---

*Built as part of COM682 Coursework 2 - Cloud Application Development*
