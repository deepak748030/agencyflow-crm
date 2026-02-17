<p align="center">
  <h1 align="center">🚀 AgencyFlow CRM</h1>
  <p align="center"><strong>Enterprise-Grade Software Development Agency Management System</strong></p>
  <p align="center">
    <em>Project Management • Real-Time Chat • WhatsApp Notifications • Invoice Generation • Payment Tracking</em>
  </p>
</p>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Third-Party Integrations](#third-party-integrations)
- [User Roles](#user-roles)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Scaling Strategy](#scaling-strategy)
- [Documentation](#documentation)
- [License](#license)

---

## 🌟 Overview

**AgencyFlow CRM** is a comprehensive, production-ready internal CRM system purpose-built for **Software Development Agencies**. It streamlines project management, client communication, milestone tracking, payment processing, and invoice generation — all in one unified platform.

### Why AgencyFlow?

| Problem | AgencyFlow Solution |
|---------|-------------------|
| Scattered project tracking | Unified project dashboard with status flows |
| Client communication gaps | Real-time chat + WhatsApp notifications |
| Manual invoice creation | Automated invoicing via Zoho Invoice API |
| Payment follow-ups | Auto reminders via Email & WhatsApp |
| No visibility into progress | Milestone tracking with approval workflows |
| Security concerns | JWT auth + role-based access + rate limiting |

**Target Scale:** 200–1,000 users | 2,000+ WhatsApp messages/day | Heavy real-time chat

---

## ✨ Key Features

### 📁 Project Management
- **Status Flow:** `Draft → Active → On Hold → Completed`
- Priority-based project tracking (Low / Medium / High / Critical)
- Multi-developer assignment per project
- Budget & deadline management
- Activity logging for all project actions

### 🎯 Milestone & Payment System
- **Milestone Flow:** `Pending → In Progress → Submitted → Client Approved → Payment Pending → Paid`
- Razorpay payment gateway integration
- Manual payment marking by Admin
- No partial payments — full milestone-based billing
- Auto payment reminders via Email & WhatsApp

### 🧾 Invoice System (Zoho Invoice)
- Automated invoice generation via **Zoho Invoice Free API**
- GST-enabled invoicing
- Auto invoice numbering
- PDF generation & download
- Invoice delivery via Email + WhatsApp
- Discount support
- Full invoice copy stored in CRM database

### 💬 Real-Time Chat System
- **Socket.io** powered real-time messaging
- Project-based group chats
- Typing indicators & read receipts
- File sharing within chat
- Edit & delete messages
- Permanent message storage in MongoDB
- Activity logging for all chat events

### 📱 WhatsApp Integration (Exotel)
- **Exotel API** for WhatsApp Business messaging
- Template-based notification system
- **Notification triggers:**
  - Milestone created/updated
  - Invoice generated
  - Payment reminders
  - Project status updates
- Full media support (images, PDFs, documents)
- All messages stored in database with delivery status

### 📞 Calling Integration (Exotel)
- Click-to-call functionality via Exotel
- Call logging and recording
- Call analytics and reports

### 📊 Dashboard & Analytics
- **Admin Dashboard:** Total revenue, pending payments, active projects, WhatsApp stats
- **Developer Dashboard:** Assigned tasks, project progress
- **Client Dashboard:** Milestones, invoices, chat, project status
- Revenue reports with date range filters
- Client payment history
- Project performance reports
- **Export formats:** PDF, Excel, CSV

### 🔐 Security
- JWT-based authentication with 7-day token expiry
- Role-based middleware authorization
- Rate limiting on all API endpoints
- Comprehensive activity logging
- IP logging for security audits
- Password policy: Min 8 characters with special character
- CORS protection

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18** | UI Framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first styling |
| **Socket.io Client** | Real-time communication |
| **Recharts** | Dashboard charts & analytics |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client |
| **Lucide React** | Icon library |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js** | Runtime |
| **Express.js** | Web framework |
| **Socket.io** | Real-time WebSocket server |
| **JWT (jsonwebtoken)** | Authentication |
| **bcryptjs** | Password hashing |
| **Mongoose** | MongoDB ODM |
| **Multer** | File upload handling |
| **Cloudinary SDK** | Cloud file storage |

### Database & Storage
| Technology | Purpose |
|-----------|---------|
| **MongoDB Atlas** | Primary database |
| **Cloudinary** | File/image CDN storage |
| **Redis** *(future)* | Chat scaling & caching |

### Third-Party APIs
| Service | Purpose |
|---------|---------|
| **Exotel** | WhatsApp messaging & calling |
| **Zoho Invoice** | Invoice generation (Free tier) |
| **Razorpay** | Payment gateway |
| **Cloudinary** | File storage & CDN |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│          React + Vite + Tailwind CSS                │
│          Socket.io Client                           │
│              (Vercel)                               │
└──────────────────┬──────────────────────────────────┘
                   │ HTTPS / WSS
                   ▼
┌─────────────────────────────────────────────────────┐
│                    BACKEND                          │
│           Node.js + Express + Socket.io             │
│          JWT Auth + Role Middleware                  │
│         (VPS / AWS EC2 + NGINX + PM2)               │
├─────────────┬───────────┬───────────┬───────────────┤
│  Cloudinary │  Exotel   │   Zoho    │   Razorpay    │
│  (Files)    │ (WhatsApp)│ (Invoice) │  (Payments)   │
└─────────────┴───────────┴───────────┴───────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│                  DATABASE                           │
│              MongoDB Atlas                          │
│   Collections: users, projects, tasks,              │
│   milestones, invoices, conversations,              │
│   messages, activityLogs, whatsappLogs              │
└─────────────────────────────────────────────────────┘
```

---

## 👥 User Roles

### 🔴 Admin (Super Admin)
| Permission | Access |
|-----------|--------|
| Create projects | ✅ |
| Assign manager to project | ✅ |
| Assign/reassign developers | ✅ |
| Create milestones | ✅ |
| View revenue & analytics | ✅ |
| View WhatsApp stats | ✅ |
| Generate invoices | ✅ |
| Mark payments as paid | ✅ |
| Manage all users | ✅ |

### 🟡 Manager
| Permission | Access |
|-----------|--------|
| View assigned projects | ✅ |
| Create milestones | ✅ |
| Communicate with clients | ✅ |
| Communicate with developers | ✅ |
| Track project progress | ✅ |
| Create projects | ❌ |
| View revenue | ❌ |

### 🟢 Developer
| Permission | Access |
|-----------|--------|
| View assigned tasks | ✅ |
| Chat with client | ✅ |
| Chat with manager | ✅ |
| Upload files | ✅ |
| View milestones (read-only) | ✅ |
| Create milestones | ❌ |
| Manage payments | ❌ |

### 🔵 Client
| Permission | Access |
|-----------|--------|
| View project milestones | ✅ |
| View & download invoices | ✅ |
| Chat with developer & manager | ✅ |
| View project status | ✅ |
| Approve milestones | ✅ |
| Modify project | ❌ |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **MongoDB** (Atlas recommended)
- **Cloudinary** account
- **Exotel** account (for WhatsApp)
- **Zoho Invoice** account (Free)
- **Razorpay** account (for payments)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/agencyflow-crm.git
cd agencyflow-crm

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
cd server
npm install
cd ..

# 4. Configure environment variables
cp server/.env.example server/.env
# Edit server/.env with your credentials

# 5. Start development servers

# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
npm run dev
```

### Initial Setup

```bash
# Create default admin account
curl -X POST http://localhost:5000/api/admin/setup

# Default credentials:
# Email: admin@shreejii.com
# Password: Admin@123
```

> ⚠️ **IMPORTANT:** Change default credentials immediately after first login!

---

## 🔑 Environment Variables

### Backend (`server/.env`)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/agencyflow

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Cloudinary (File Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Exotel (WhatsApp & Calling)
EXOTEL_SID=your-exotel-sid
EXOTEL_API_KEY=your-exotel-api-key
EXOTEL_API_TOKEN=your-exotel-api-token
EXOTEL_SUBDOMAIN=your-exotel-subdomain
EXOTEL_WHATSAPP_FROM=your-whatsapp-number

# Zoho Invoice
ZOHO_CLIENT_ID=your-zoho-client-id
ZOHO_CLIENT_SECRET=your-zoho-client-secret
ZOHO_REFRESH_TOKEN=your-zoho-refresh-token
ZOHO_ORGANIZATION_ID=your-zoho-org-id

# Razorpay (Payments)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

### Frontend

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=your-razorpay-publishable-key
```

---

## 📂 Project Structure

```
agencyflow-crm/
├── public/                     # Static assets
├── src/                        # Frontend source
│   ├── assets/                 # Images, icons
│   ├── components/             # Reusable UI components
│   │   ├── DashboardLayout.tsx # Main layout wrapper
│   │   ├── ProtectedRoute.tsx  # Auth guard
│   │   └── ui/                 # shadcn/ui components
│   ├── context/
│   │   └── AuthContext.tsx     # Authentication state
│   ├── lib/
│   │   ├── api.ts              # API client (Axios)
│   │   └── utils.ts            # Utility functions
│   ├── pages/
│   │   ├── LoginPage.tsx       # Admin login
│   │   └── DashboardPage.tsx   # Main dashboard
│   ├── App.tsx                 # Root component & routes
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles & design tokens
│
├── server/                     # Backend source
│   ├── config/
│   │   ├── db.js               # MongoDB connection (serverless-ready)
│   │   └── cloudinary.js       # Cloudinary configuration
│   ├── models/
│   │   └── Admin.js            # Admin model with bcrypt
│   ├── routes/
│   │   └── adminRoutes.js      # Auth & admin endpoints
│   ├── middleware/              # (planned) Auth, rate-limit, roles
│   ├── controllers/            # (planned) Route controllers
│   ├── services/               # (planned) Business logic
│   ├── socket/                 # (planned) Socket.io handlers
│   ├── index.js                # Express server entry
│   ├── vercel.json             # Vercel serverless config
│   └── package.json
│
├── docs/
│   └── AgencyFlow_CRM_SRS_v2.pdf  # SRS Document
│
├── DOCUMENTATION.md            # Detailed technical documentation
├── README.md                   # This file
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|---------|-------------|------|
| `POST` | `/api/admin/setup` | Create default admin | ❌ |
| `POST` | `/api/admin/login` | Admin login | ❌ |
| `GET` | `/api/admin/me` | Get current profile | ✅ |
| `PUT` | `/api/admin/profile` | Update profile | ✅ |
| `PUT` | `/api/admin/password` | Change password | ✅ |
| `GET` | `/api/admin/activity` | Get admin activity | ✅ |

### Projects *(Planned)*

| Method | Endpoint | Description | Auth | Roles |
|--------|---------|-------------|------|-------|
| `POST` | `/api/projects` | Create project | ✅ | Admin |
| `GET` | `/api/projects` | List projects | ✅ | All |
| `GET` | `/api/projects/:id` | Get project details | ✅ | All |
| `PUT` | `/api/projects/:id` | Update project | ✅ | Admin, Manager |
| `PATCH` | `/api/projects/:id/status` | Update status | ✅ | Admin, Manager |
| `POST` | `/api/projects/:id/assign` | Assign developer | ✅ | Admin |

### Milestones *(Planned)*

| Method | Endpoint | Description | Auth | Roles |
|--------|---------|-------------|------|-------|
| `POST` | `/api/milestones` | Create milestone | ✅ | Admin, Manager, Dev |
| `GET` | `/api/milestones/project/:id` | Get project milestones | ✅ | All |
| `PATCH` | `/api/milestones/:id/status` | Update milestone status | ✅ | All (by flow) |
| `PATCH` | `/api/milestones/:id/approve` | Client approve | ✅ | Client |

### Chat *(Planned)*

| Method | Endpoint | Description | Auth |
|--------|---------|-------------|------|
| `GET` | `/api/chat/conversations` | List conversations | ✅ |
| `GET` | `/api/chat/:conversationId/messages` | Get messages | ✅ |
| `POST` | `/api/chat/:conversationId/messages` | Send message | ✅ |
| `PUT` | `/api/chat/messages/:id` | Edit message | ✅ |
| `DELETE` | `/api/chat/messages/:id` | Delete message | ✅ |

### Invoices *(Planned)*

| Method | Endpoint | Description | Auth | Roles |
|--------|---------|-------------|------|-------|
| `POST` | `/api/invoices/generate` | Generate via Zoho | ✅ | Admin |
| `GET` | `/api/invoices` | List invoices | ✅ | Admin, Client |
| `GET` | `/api/invoices/:id/pdf` | Download PDF | ✅ | All |
| `POST` | `/api/invoices/:id/send` | Send via Email/WhatsApp | ✅ | Admin |

### Payments *(Planned)*

| Method | Endpoint | Description | Auth | Roles |
|--------|---------|-------------|------|-------|
| `POST` | `/api/payments/create-order` | Create Razorpay order | ✅ | Client |
| `POST` | `/api/payments/verify` | Verify payment | ✅ | System |
| `PATCH` | `/api/payments/:id/mark-paid` | Manual mark paid | ✅ | Admin |

### WhatsApp *(Planned)*

| Method | Endpoint | Description | Auth | Roles |
|--------|---------|-------------|------|-------|
| `POST` | `/api/whatsapp/send` | Send template message | ✅ | Admin |
| `GET` | `/api/whatsapp/logs` | View message logs | ✅ | Admin |
| `POST` | `/api/whatsapp/webhook` | Exotel webhook | ❌ | System |

---

## 🚢 Deployment

### Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Backend (VPS / AWS EC2)

```bash
# 1. SSH into server
ssh user@your-server-ip

# 2. Install Node.js, PM2, NGINX
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx
sudo npm install -g pm2

# 3. Clone & setup
git clone https://github.com/your-org/agencyflow-crm.git
cd agencyflow-crm/server
npm install --production
cp .env.example .env
nano .env  # Configure all variables

# 4. Start with PM2 (cluster mode)
pm2 start index.js -i max --name agencyflow-api
pm2 save
pm2 startup

# 5. Configure NGINX
sudo nano /etc/nginx/sites-available/agencyflow
```

**NGINX Configuration:**

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 6. Enable site & SSL
sudo ln -s /etc/nginx/sites-available/agencyflow /etc/nginx/sites-enabled/
sudo certbot --nginx -d api.yourdomain.com
sudo systemctl restart nginx
```

### Database (MongoDB Atlas)

1. Create cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create database user
3. Whitelist server IP
4. Copy connection string to `MONGODB_URI`

---

## 📈 Scaling Strategy

| Phase | Users | Strategy |
|-------|-------|----------|
| **Phase 1** | 1–200 | Single server, PM2, MongoDB Atlas M10 |
| **Phase 2** | 200–500 | PM2 cluster mode, Redis for sessions/cache |
| **Phase 3** | 500–1000 | Load balancer, MongoDB sharding, CDN |
| **Phase 4** | 1000+ | Microservices, Kubernetes, SaaS conversion |

### Performance Optimizations
- MongoDB compound indexes on frequently queried fields
- Redis caching for dashboard analytics
- Socket.io Redis adapter for multi-instance chat
- Cloudinary transformations for optimized media delivery
- Rate limiting: 100 req/min per IP, 1000 req/min per authenticated user

---

## 📚 Documentation

- **[DOCUMENTATION.md](./DOCUMENTATION.md)** — Full technical documentation with database schemas, API specs, integration guides
- **[docs/AgencyFlow_CRM_SRS_v2.pdf](./docs/AgencyFlow_CRM_SRS_v2.pdf)** — Software Requirement Specification v2.0

---

## 📄 License

This project is proprietary software. All rights reserved.

---

<p align="center">
  <strong>Built with ❤️ by Deepak Kushwah</strong><br/>
  <em>AgencyFlow CRM — Professional Agency Management, Simplified.</em>
</p>
