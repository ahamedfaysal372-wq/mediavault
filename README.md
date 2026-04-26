# 🎬 MediaVault – Cloud-Native Multimedia Platform

**COM682 – Cloud Native Development | Student: Faysal Ahamed | B00918889**

---

## Project Structure

```
mediavault/
├── api/                         # Node.js Express REST API
│   ├── config/
│   │   ├── appInsights.js       # Azure Application Insights (advanced feature)
│   │   ├── blobStorage.js       # Azure Blob Storage client
│   │   ├── cosmos.js            # Azure Cosmos DB client
│   │   └── sql.js               # Azure SQL Database client + schema init
│   ├── routes/
│   │   ├── media.js             # CRUD endpoints for media
│   │   └── users.js             # User + audit log endpoints
│   ├── server.js                # Main Express server entry point
│   ├── package.json
│   └── .env.example             # Environment variable template
├── frontend/
│   └── index.html               # Static HTML/JS frontend
└── .github/
    └── workflows/
        └── deploy.yml           # GitHub Actions CI/CD pipeline
```

---

## Azure Services Used

| Service | Purpose |
|---|---|
| Azure App Service | Hosts the Node.js REST API |
| Azure Blob Storage | Stores uploaded multimedia files |
| Azure Cosmos DB | Stores media metadata (NoSQL) |
| Azure SQL Database | Stores users and audit logs (relational) |
| Application Insights | Monitoring & telemetry (advanced feature) |
| GitHub Actions | CI/CD – auto-deploys on push to main |

---

## REST API Endpoints

**Base URL:** `https://<your-app>.azurewebsites.net/api`

### Media
| Method | Endpoint | Description |
|---|---|---|
| POST | /media | Upload a media file + metadata |
| GET | /media | List all media |
| GET | /media/:id | Get a specific media item |
| PUT | /media/:id | Update media metadata |
| DELETE | /media/:id | Delete media + blob |

### Users & Audit
| Method | Endpoint | Description |
|---|---|---|
| POST | /users | Create a user |
| GET | /users | List all users |
| GET | /users/:id | Get a user |
| GET | /users/:id/logs | Get audit logs for a user |

### Health
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/health | Health check |

---

## Step-by-Step Azure Deployment

### 1. Create Azure Resources

In the Azure Portal, create:

1. **Resource Group** – e.g. `mediavault-rg`

2. **Storage Account** – create a container called `mediavault-files`
   - Copy the **Connection String** from Access Keys

3. **Cosmos DB (NoSQL)** – API: Core (SQL)
   - Copy **Endpoint** and **Primary Key**

4. **Azure SQL Database**
   - Create server + database
   - Copy **Server name**, **Database name**, **Username**, **Password**
   - Add your IP to the firewall rules
   - Allow Azure services to connect

5. **App Service** – Node 18 LTS on Linux
   - Copy the app name

6. **Application Insights**
   - Copy the **Connection String**

---

### 2. Configure App Service Environment Variables

In Azure Portal → App Service → Configuration → Application Settings, add:

```
AZURE_STORAGE_CONNECTION_STRING   = <from Storage Account>
BLOB_CONTAINER_NAME               = mediavault-files
COSMOS_ENDPOINT                   = <from Cosmos DB>
COSMOS_KEY                        = <from Cosmos DB>
COSMOS_DATABASE                   = mediavaultdb
COSMOS_CONTAINER                  = media
SQL_SERVER                        = <yourserver>.database.windows.net
SQL_DATABASE                      = mediavaultdb
SQL_USER                          = <your sql user>
SQL_PASSWORD                      = <your sql password>
APPINSIGHTS_CONNECTION_STRING     = <from Application Insights>
```

---

### 3. Set Up GitHub Actions CI/CD

1. In GitHub repo → Settings → Secrets → Actions, add:
   - `AZURE_WEBAPP_NAME` → your App Service name (e.g. `mediavault-api`)
   - `AZURE_WEBAPP_PUBLISH_PROFILE` → contents of the publish profile file
     (Download from Azure Portal → App Service → Overview → Get publish profile)

2. Push to `main` branch → workflow auto-deploys

---

### 4. Run Locally (for testing before deployment)

```bash
cd api
cp .env.example .env
# Fill in your real Azure credentials in .env

npm install
npm run dev
```

Open: http://localhost:3000

---

## Advanced Feature – Application Insights

Azure Application Insights is integrated and provides:
- **Live request monitoring** (response times, status codes)
- **Exception tracking** (auto-caught errors)
- **Dependency tracking** (Cosmos DB, SQL, Blob Storage calls)
- **Performance metrics** (CPU, memory, throughput)
- **Live Metrics Stream** for real-time dashboard

To verify: Go to Azure Portal → Application Insights → Live Metrics.

---

## Video Walkthrough Checklist (CW2)

- [ ] Show running application at `https://<app>.azurewebsites.net`
- [ ] Demonstrate **Upload** (POST /media)
- [ ] Demonstrate **View/List** (GET /media)
- [ ] Demonstrate **Edit** (PUT /media/:id)
- [ ] Demonstrate **Delete** (DELETE /media/:id)
- [ ] Show **Azure Portal** → App Service
- [ ] Show **Blob Storage** container with uploaded files
- [ ] Show **Cosmos DB** with media documents
- [ ] Show **Azure SQL** tables (Users + AuditLogs)
- [ ] Show **GitHub Actions** – successful deployment run
- [ ] Show **Application Insights** – live metrics / requests
- [ ] Mention all advanced features used
