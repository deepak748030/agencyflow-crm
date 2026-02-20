

# 🚀 AgencyFlow CRM — Server

**Enterprise-Grade Backend API for Software Development Agency Management**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payments-02042B?style=flat-square&logo=razorpay&logoColor=white)](https://razorpay.com)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-CDN-3448C5?style=flat-square&logo=cloudinary&logoColor=white)](https://cloudinary.com)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](LICENSE)

> **Production-ready REST API + WebSocket server** powering project management, real-time team chat, milestone-based billing, Razorpay payment processing, PDF invoice generation, and full activity audit logging.

[📦 Repository](https://github.com/deepak748030/agencyflow-crm) · [📋 API Reference](#-api-reference) · [🚀 Quick Start](#-quick-start) · [🏗 Architecture](#-architecture)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Folder Structure](#-folder-structure)
- [Database Models](#-database-models)
- [API Reference](#-api-reference)
- [Socket.io Events](#-socketio-events)
- [Authentication & Authorization](#-authentication--authorization)
- [Third-Party Integrations](#-third-party-integrations)
- [Environment Variables](#-environment-variables)
- [Quick Start](#-quick-start)
- [Deployment](#-deployment)

---

## 🌟 Overview

AgencyFlow CRM Server is a **production-ready Node.js + Express + Socket.io** backend built for software development agencies. It handles:

| Module | What it does |
|---|---|
| **Auth** | JWT login, role-based middleware, profile & password management |
| **Users** | Create/manage Admin, Manager, Developer, Client accounts |
| **Projects** | Full project lifecycle: Draft → Active → On Hold → Completed |
| **Tasks** | Assign & track tasks per project with comments |
| **Milestones** | Billing checkpoints with Razorpay payment & PDF invoice generation |
| **Chat** | Real-time project group chat via Socket.io + Cloudinary file uploads |
| **Dashboard** | Role-aware analytics, revenue charts, recent activity |
| **Activity Logs** | Full audit trail for every action across the platform |
| **Webhooks** | Razorpay payment webhook verification |

---

## 🛠 Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 18+ | Runtime |
| **Express.js** | 4.x | REST API framework |
| **Socket.io** | 4.x | Real-time WebSocket server |
| **MongoDB + Mongoose** | 8.x | Database + ODM |
| **JWT (jsonwebtoken)** | 9.x | Stateless authentication |
| **bcryptjs** | 3.x | Password hashing (salt rounds: 12) |
| **Razorpay** | 2.x | Payment gateway |
| **Cloudinary** | 2.x | File & image CDN storage |
| **PDFKit** | 0.17 | Invoice PDF generation |
| **Nodemailer** | 8.x | Email notifications (SMTP) |
| **Multer** | 2.x | Multipart file upload handling |
| **dotenv** | 17.x | Environment variable management |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT (React / Mobile)               │
│              HTTP REST + Socket.io WSS                   │
└───────────────────────────┬──────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│                    Express Server                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │  Routes  │→ │Middleware│→ │Controllers│              │
│  └──────────┘  └──────────┘  └──────────┘               │
│        ↓              ↓             ↓                    │
│   ┌─────────┐   ┌──────────┐  ┌──────────┐              │
│   │Socket.io│   │ Services │  │  Models  │              │
│   └─────────┘   └──────────┘  └──────────┘              │
└───────────────────────────┬──────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
   ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
   │ MongoDB     │  │  Cloudinary  │  │  Razorpay    │
   │ Atlas       │  │  (Files/CDN) │  │  (Payments)  │
   └─────────────┘  └──────────────┘  └──────────────┘
```

**Request Lifecycle:**
```
Request → CORS → Body Parser → dbMiddleware → auth → roleGuard → Controller → Service → Model → Response
```

---

## 📂 Folder Structure

```
server/
├── index.js                    # Entry point — Express app + Socket.io init
│
├── config/
│   ├── db.js                   # MongoDB connection (serverless-ready)
│   └── cloudinary.js           # Cloudinary SDK configuration
│
├── middleware/
│   ├── auth.js                 # JWT auth + roleGuard middleware
│   ├── adminAuth.js            # Legacy admin auth middleware
│   ├── dbMiddleware.js         # Per-request DB connection handler
│   └── errorHandler.js         # Global error handler
│
├── models/
│   ├── User.js                 # Users (Admin/Manager/Developer/Client)
│   ├── Project.js              # Projects
│   ├── Task.js                 # Tasks with comments & attachments
│   ├── Milestone.js            # Milestones with Razorpay fields
│   ├── Conversation.js         # Chat conversations (project_group)
│   ├── Message.js              # Chat messages with seen receipts
│   ├── ActivityLog.js          # Full audit log
│   └── Admin.js                # Legacy admin model
│
├── routes/
│   ├── authRoutes.js           # /api/auth/*
│   ├── userRoutes.js           # /api/users/*
│   ├── projectRoutes.js        # /api/projects/*
│   ├── taskRoutes.js           # /api/tasks/*
│   ├── milestoneRoutes.js      # /api/milestones/*
│   ├── chatRoutes.js           # /api/chat/*
│   ├── dashboardRoutes.js      # /api/dashboard/*
│   ├── activityRoutes.js       # /api/activity/*
│   ├── adminRoutes.js          # /api/admin/*
│   └── webhookRoutes.js        # /api/webhooks/*
│
├── controllers/
│   ├── authController.js       # Login, setup, profile, password
│   ├── userController.js       # CRUD users
│   ├── projectController.js    # CRUD projects + status
│   ├── taskController.js       # CRUD tasks + comments
│   ├── milestoneController.js  # Milestones + Razorpay + PDF invoice
│   ├── chatController.js       # Conversations + messages + file upload
│   ├── dashboardController.js  # Role-aware analytics
│   ├── activityController.js   # Audit log listing
│   ├── adminController.js      # Legacy admin endpoints
│   └── webhookController.js    # Razorpay webhook handler
│
├── services/
│   ├── activityService.js      # Reusable audit log writer
│   ├── emailService.js         # Nodemailer — payment & milestone emails
│   └── invoiceService.js       # PDFKit invoice generation
│
├── socket/
│   └── socketManager.js        # Socket.io init, auth, rooms, events
│
├── vercel.json                 # Vercel serverless deployment config
├── package.json
└── .env.example
```

---

## 🗄 Database Models

### User
```
name | email | password (bcrypt) | phone | avatar | role [admin|manager|developer|client]
company | designation | isActive | lastLogin | preferences { emailNotifications, whatsappNotifications }
```
**Indexes:** `email (unique)`, `role`, `isActive`, `phone`

### Project
```
name | description | clientId → User | managerId → User | developerIds → [User]
budget { amount, currency, paid, pending } | deadline | priority [low|medium|high|critical]
status [draft|active|on_hold|completed] | tags | documents | createdBy → User
```
**Indexes:** `clientId`, `managerId`, `developerIds`, `status`, `priority`

### Task
```
projectId → Project | title | description | assignedTo → User | assignedBy → User
deadline | priority [low|medium|high|critical] | status [todo|in_progress|review|done]
attachments [ { name, url, type } ] | comments [ { userId, text, createdAt } ]
```
**Indexes:** `projectId`, `assignedTo`, `status`, `projectId + status (compound)`

### Milestone
```
projectId → Project | title | description | amount | dueDate
status [pending|in_progress|completed|paid] | createdBy → User | paidAt
razorpayOrderId | razorpayPaymentId | razorpaySignature
```
**Indexes:** `projectId`, `status`, `dueDate`, `projectId + status (compound)`

### Conversation
```
projectId → Project | type [project_group|direct]
participants [ { userId → User, role, joinedAt, lastReadAt, isActive } ]
lastMessage { text, senderId, sentAt }
```
**Indexes:** `projectId`, `participants.userId`, `updatedAt desc`

### Message
```
conversationId → Conversation | senderId → User | type [text|file|image|system]
message | attachments [ { name, url, type, size } ] | replyTo → Message
isEdited | editedAt | isDeleted | seenBy [ { userId, seenAt } ]
```
**Indexes:** `conversationId + createdAt desc (compound)`, `senderId`

### ActivityLog
```
userId → User | action (e.g. "project.created") | resource | resourceId | details {} | ip | userAgent
```
**Indexes:** `userId + createdAt`, `action`, `resource + resourceId`, `createdAt desc`

---

## 📡 API Reference

> All protected routes require: `Authorization: Bearer `

---

### 🔐 Auth — `/api/auth`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/setup` | ❌ | — | Create default admin (first-time only) |
| `POST` | `/login` | ❌ | — | Login → returns JWT token |
| `GET` | `/me` | ✅ | All | Get current user profile |
| `PUT` | `/profile` | ✅ | All | Update name, email, phone, avatar, designation |
| `PUT` | `/password` | ✅ | All | Change password (requires current password) |

**Login Request:**
```json
{ "email": "admin@agencyflow.com", "password": "Admin@123" }
```

**Login Response:**
```json
{
  "success": true,
  "response": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5...",
    "user": { "_id": "...", "name": "Admin", "role": "admin", "email": "..." }
  }
}
```

---

### 👥 Users — `/api/users`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/` | ✅ | admin, manager | List all users (with pagination + search) |
| `POST` | `/` | ✅ | admin | Create user (any role) |
| `GET` | `/:id` | ✅ | All | Get user by ID |
| `PUT` | `/:id` | ✅ | admin | Update user |
| `DELETE` | `/:id` | ✅ | admin | Deactivate user (soft delete) |

**Query Params (GET /):** `role`, `search`, `isActive`, `page`, `limit`

---

### 📁 Projects — `/api/projects`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/` | ✅ | All | List projects (role-filtered automatically) |
| `POST` | `/` | ✅ | admin | Create project |
| `GET` | `/:id` | ✅ | All | Get project details (fully populated) |
| `PUT` | `/:id` | ✅ | admin, manager | Update project fields |
| `PATCH` | `/:id/status` | ✅ | admin, manager | Update status |

**Status values:** `draft` → `active` → `on_hold` → `completed`

**Create Project Body:**
```json
{
  "name": "E-Commerce App",
  "clientId": "...",
  "managerId": "...",
  "developerIds": ["...", "..."],
  "budget": { "amount": 150000, "currency": "INR" },
  "deadline": "2025-12-31",
  "priority": "high"
}
```

---

### ✅ Tasks — `/api/tasks`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/` | ✅ | All | List tasks (role-filtered) |
| `POST` | `/` | ✅ | admin, manager | Create task |
| `GET` | `/:id` | ✅ | All | Get task + comments |
| `PUT` | `/:id` | ✅ | admin, manager | Update task |
| `PATCH` | `/:id/status` | ✅ | All | Update task status |
| `POST` | `/:id/comments` | ✅ | All | Add comment |
| `DELETE` | `/:id` | ✅ | admin, manager | Delete task |

**Task Status Flow:** `todo` → `in_progress` → `review` → `done`

---

### 🎯 Milestones — `/api/milestones`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/` | ✅ | admin, manager | Create milestone |
| `GET` | `/project/:projectId` | ✅ | All | Get milestones for a project |
| `PATCH` | `/:id/status` | ✅ | admin, manager, developer | Update milestone status |
| `PUT` | `/:id` | ✅ | admin | Edit milestone (cannot edit paid) |
| `DELETE` | `/:id` | ✅ | admin | Delete milestone (cannot delete paid) |
| `POST` | `/:id/create-order` | ✅ | All | Create Razorpay payment order |
| `POST` | `/:id/verify-payment` | ✅ | All | Verify Razorpay payment signature |
| `POST` | `/:id/send-reminder` | ✅ | admin, manager | Send payment reminder email to client |
| `GET` | `/:id/invoice` | ✅ | All | Download PDF invoice (paid milestones only) |

**Milestone Status Flow:**
```
pending → in_progress → completed → payment_pending → paid
```

> Only `admin` can move milestone to `payment_pending` or `paid`

**Payment Flow:**
```
1. Admin marks milestone → payment_pending
2. Client calls POST /:id/create-order → gets Razorpay orderId
3. Client completes payment in frontend
4. Client calls POST /:id/verify-payment with razorpay_* fields
5. Server verifies HMAC signature → marks paid → sends invoice PDF email
```

---

### 💬 Chat — `/api/chat`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/conversations` | ✅ | List all conversations for current user |
| `POST` | `/conversations/project/:projectId` | ✅ | Get or create project group conversation |
| `GET` | `/conversations/:id/messages` | ✅ | Get messages (paginated, oldest first) |
| `POST` | `/conversations/:id/messages` | ✅ | Send a message |
| `POST` | `/upload` | ✅ | Upload file to Cloudinary (max 10MB) |
| `GET` | `/unread-count` | ✅ | Get unread message counts per conversation |
| `POST` | `/conversations/:id/read` | ✅ | Mark conversation as read |
| `PUT` | `/messages/:id` | ✅ | Edit own message |
| `DELETE` | `/messages/:id` | ✅ | Delete own message (admin can delete any) |

**Allowed file types for upload:** `image/*`, `application/pdf`, `zip`, `docx`, `xlsx`, `txt`, `csv`

**Send Message Body:**
```json
{
  "message": "Hello team!",
  "type": "text",
  "attachments": [],
  "replyTo": ""
}
```

---

### 📊 Dashboard — `/api/dashboard`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/analytics` | ✅ | Role-aware analytics |

**Response includes:**
- `stats`: totalUsers, totalProjects, activeProjects, totalRevenue, pendingPayments
- `usersByRole`: counts by role (admin only)
- `projectsByStatus`: counts by status
- `recentActivity`: last 10 activity log entries
- `recentProjects`: last 5 updated projects
- `monthlyRevenue`: 6-month revenue chart data

---

### 📋 Activity Logs — `/api/activity`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/` | ✅ | admin | List all activity logs (paginated) |

**Query Params:** `action`, `resource`, `userId`, `search`, `page`, `limit`

**Action examples logged automatically:**
`user.login`, `user.created`, `project.created`, `project.status_changed`, `milestone.created`, `milestone.paid`, `task.created`, `task.done`

---

### ⚙️ Admin — `/api/admin`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/setup` | ❌ | Create default legacy admin |
| `POST` | `/login` | ❌ | Legacy admin login |
| `GET` | `/me` | ✅ | Get admin profile |
| `PUT` | `/profile` | ✅ | Update admin profile |
| `PUT` | `/password` | ✅ | Update admin password |
| `GET` | `/activity` | ✅ | Get admin activity stats |
| `GET` | `/analytics` | ✅ | Get analytics summary |

---

### 🔗 Webhooks — `/api/webhooks`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/razorpay` | ❌ (signature verified) | Razorpay payment event webhook |

> Razorpay webhook verifies `X-Razorpay-Signature` HMAC before processing

---

### 🏥 Health Check

```
GET /api/health
→ { "success": true, "message": "AgencyFlow CRM API is running", "timestamp": "..." }
```

---

## ⚡ Socket.io Events

**Connection:** Requires JWT token via `socket.handshake.auth.token`

### Client → Server (Emit)

| Event | Payload | Description |
|---|---|---|
| `conversation:join` | `conversationId` | Join a conversation room |
| `conversation:leave` | `conversationId` | Leave a conversation room |
| `typing:start` | `{ conversationId }` | Broadcast typing started |
| `typing:stop` | `{ conversationId }` | Broadcast typing stopped |
| `messages:read` | `{ conversationId }` | Notify others messages are read |

### Server → Client (Listen)

| Event | Payload | Description |
|---|---|---|
| `user:online` | `{ userId, name }` | A user came online |
| `user:offline` | `{ userId }` | A user went offline |
| `typing:start` | `{ conversationId, userId, userName }` | Someone is typing |
| `typing:stop` | `{ conversationId, userId }` | Someone stopped typing |
| `message:new` | `{ conversationId, message }` | New message received |
| `message:edited` | `{ conversationId, message }` | A message was edited |
| `message:deleted` | `{ conversationId, messageId }` | A message was deleted |
| `messages:read` | `{ conversationId, userId, readAt }` | Read receipt update |
| `conversation:updated` | `{ conversationId, lastMessage }` | Conversation sidebar update |

**Room naming convention:** `conv:`

---

## 🔐 Authentication & Authorization

### JWT Flow
```
POST /api/auth/login
→ JWT signed with { id, role } — expires in 7 days
→ Store in client (localStorage / SecureStore)
→ Send as: Authorization: Bearer 
```

### Role Hierarchy

| Role | Level | Key Permissions |
|---|---|---|
| `admin` | Highest | Full access — create projects, users, manage payments, view all analytics |
| `manager` | High | View & manage assigned projects, create milestones, chat |
| `developer` | Medium | View assigned tasks, chat, upload files, view milestones |
| `client` | Low | View project status, milestones, invoices, chat |

### roleGuard Middleware
```js
// Route definition example
router.post('/', auth, roleGuard(['admin']), controller.createProject);
```

Data is also **automatically filtered by role** inside controllers:
- Clients see only their own projects
- Managers see only their assigned projects
- Developers see only tasks assigned to them

---

## 🔌 Third-Party Integrations

### 💳 Razorpay (Payments)
- Creates Razorpay orders for milestone payments (`amount * 100` for paise)
- Verifies HMAC-SHA256 signature on payment callback
- Webhook endpoint for server-side confirmation
- Automatically updates project `budget.paid` and `budget.pending` on success

### ☁️ Cloudinary (File Storage)
- Chat file uploads streamed directly to Cloudinary via `upload_stream`
- Folder: `agencyflow/chat`
- Resource type: `auto` (supports images, PDFs, docs)
- Max file size: **10MB**

### 📧 Nodemailer (Email Notifications)
Emails sent automatically on:
| Trigger | Recipient | Email Type |
|---|---|---|
| Milestone → `payment_pending` | Client | Payment reminder |
| Milestone → `paid` (with PDF) | Client | Payment success + Invoice PDF |
| Any milestone status change | All team members (except updater) | Status update notification |

### 📄 PDFKit (Invoice Generation)
- Professional A4 invoice PDF with branded header
- Includes: Invoice number, client info, project details, amount, payment ID, payment date
- Color scheme: Indigo (`#4F46E5`) brand accent
- Returned as Buffer — downloadable or email-attached

---

## 🔑 Environment Variables

Create `server/.env` from `server/.env.example`:

```env
# ── Server ──────────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ── Database ────────────────────────────────────────────
MONGODB_URI=mongodb+srv://:@cluster.mongodb.net/agencyflow

# ── Authentication ───────────────────────────────────────
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# ── Cloudinary (File Storage) ────────────────────────────
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ── Razorpay (Payments) ──────────────────────────────────
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret

# ── SMTP Email (Nodemailer) ──────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account
- Cloudinary account
- Razorpay account (for payments)

### Installation

```bash
# Clone the repo
git clone https://github.com/deepak748030/agencyflow-crm.git
cd agencyflow-crm/server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev
# → AgencyFlow CRM Server running on port 5000 (with Socket.io)
```

### Create Default Admin

```bash
curl -X POST http://localhost:5000/api/auth/setup
```

```json
{
  "success": true,
  "message": "Default admin created successfully",
  "response": { "email": "admin@agencyflow.com", "name": "Admin" }
}
```

> ⚠️ **Default credentials:** `admin@agencyflow.com` / `Admin@123`
> Change immediately after first login!

### Verify Server

```bash
curl http://localhost:5000/api/health
# → { "success": true, "message": "AgencyFlow CRM API is running" }
```

---

## 🚢 Deployment

### VPS (Recommended — AWS EC2 / DigitalOcean)

```bash
# 1. Install Node.js + PM2 + NGINX
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx
sudo npm install -g pm2

# 2. Clone & setup
git clone https://github.com/deepak748030/agencyflow-crm.git
cd agencyflow-crm/server
npm install --production
cp .env.example .env
nano .env  # Fill all variables

# 3. Start with PM2 cluster mode
pm2 start index.js -i max --name agencyflow-api
pm2 save && pm2 startup
```

**NGINX config (`/etc/nginx/sites-available/agencyflow`):**
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
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/agencyflow /etc/nginx/sites-enabled/
sudo certbot --nginx -d api.yourdomain.com
sudo systemctl restart nginx
```

### Vercel (Serverless)
```bash
# Uses server/vercel.json — already configured
cd server
vercel --prod
```

---

## 📈 Scaling Notes

| Phase | Users | Strategy |
|---|---|---|
| Phase 1 | 1–200 | Single VPS + PM2 cluster + MongoDB Atlas M10 |
| Phase 2 | 200–500 | Redis for Socket.io adapter + session caching |
| Phase 3 | 500–1000 | Load balancer + MongoDB read replicas |
| Phase 4 | 1000+ | Microservices + Kubernetes |

**MongoDB compound indexes** are already configured on all high-traffic query paths. Add Redis when scaling Socket.io across multiple instances.

---

**Built with ❤️ by [Deepak Kushwah](https://github.com/deepak748030)**

[![GitHub](https://img.shields.io/badge/GitHub-deepak748030-181717?style=flat-square&logo=github)](https://github.com/deepak748030/agencyflow-crm)

*AgencyFlow CRM — Professional Agency Management, Simplified.*
