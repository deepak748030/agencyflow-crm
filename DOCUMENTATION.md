# 📖 AgencyFlow CRM — Technical Documentation

> **Version:** 2.0  
> **Last Updated:** February 2026  
> **Author:** Deepak Kushwah  
> **Status:** In Development

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Architecture](#2-system-architecture)
3. [Database Schema Design](#3-database-schema-design)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Project Module](#5-project-module)
6. [Milestone & Payment System](#6-milestone--payment-system)
7. [Invoice System (Zoho Invoice)](#7-invoice-system-zoho-invoice)
8. [Real-Time Chat System](#8-real-time-chat-system)
9. [WhatsApp Integration (Exotel)](#9-whatsapp-integration-exotel)
10. [Calling Integration (Exotel)](#10-calling-integration-exotel)
11. [Razorpay Payment Gateway](#11-razorpay-payment-gateway)
12. [File Management (Cloudinary)](#12-file-management-cloudinary)
13. [Dashboard & Analytics](#13-dashboard--analytics)
14. [Security Architecture](#14-security-architecture)
15. [Activity Logging](#15-activity-logging)
16. [Error Handling](#16-error-handling)
17. [API Reference](#17-api-reference)
18. [Socket.io Events](#18-socketio-events)
19. [Deployment Guide](#19-deployment-guide)
20. [Environment Configuration](#20-environment-configuration)
21. [Testing Strategy](#21-testing-strategy)
22. [Scaling & Performance](#22-scaling--performance)
23. [Future Roadmap](#23-future-roadmap)

---

## 1. Introduction

### 1.1 Purpose

AgencyFlow CRM is a comprehensive internal management system designed specifically for Software Development Agencies. It replaces fragmented workflows with a single unified platform that manages the entire project lifecycle — from client onboarding to final payment collection.

### 1.2 Scope

The system handles:
- **Project lifecycle management** with multi-role collaboration
- **Milestone-based billing** with automated invoice generation
- **Real-time communication** between all stakeholders
- **WhatsApp notifications** for critical business events
- **Payment processing** via Razorpay with manual override
- **Analytics & reporting** for business intelligence

### 1.3 Target Users

| User Type | Count | Primary Use |
|-----------|-------|------------|
| Admin | 1–5 | Full system management |
| Managers | 5–20 | Project oversight |
| Developers | 20–100 | Task execution & communication |
| Clients | 50–500 | Project visibility & payments |
| **Total** | **200–1,000** | |

### 1.4 System Load Expectations

| Metric | Target |
|--------|--------|
| Concurrent users | 200–500 |
| WhatsApp messages/day | 2,000+ |
| Chat messages/day | 5,000+ |
| File uploads/day | 100–500 |
| API requests/minute | 1,000+ |
| Database operations/second | 100+ |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                            │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Admin Panel  │  │ Manager View │  │ Client/Dev Portal    │  │
│  │ (React SPA)  │  │ (React SPA)  │  │ (React SPA)          │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         └─────────────────┼──────────────────────┘              │
│                           │                                     │
│                    REST API + WebSocket                         │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                     API GATEWAY (NGINX)                         │
│                 SSL Termination + Load Balancing                │
│                     Rate Limiting (nginx)                       │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                    APPLICATION LAYER                            │
│                                                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Node.js + Express + Socket.io                 │ │
│  │                    (PM2 Cluster Mode)                       │ │
│  ├──────────┬──────────┬──────────┬──────────┬───────────────┤ │
│  │   Auth   │  Project │   Chat   │ Invoice  │  Notification │ │
│  │ Module   │  Module  │  Module  │  Module  │    Module      │ │
│  └──────────┴──────────┴──────────┴──────────┴───────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   MIDDLEWARE LAYER                        │   │
│  │  JWT Auth │ Role Guard │ Rate Limit │ Activity Logger     │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                    INTEGRATION LAYER                            │
│                                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │Cloudinary│  │  Exotel  │  │   Zoho   │  │  Razorpay    │   │
│  │ (Files)  │  │(WhatsApp)│  │(Invoice) │  │ (Payments)   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                      DATA LAYER                                │
│                                                                │
│  ┌──────────────────────┐  ┌────────────────────────────────┐  │
│  │   MongoDB Atlas      │  │   Redis (Future)               │  │
│  │   - users            │  │   - Session cache              │  │
│  │   - projects         │  │   - Chat presence              │  │
│  │   - tasks            │  │   - Rate limit counters        │  │
│  │   - milestones       │  │   - Dashboard cache            │  │
│  │   - invoices         │  │                                │  │
│  │   - conversations    │  │                                │  │
│  │   - messages         │  │                                │  │
│  │   - activityLogs     │  │                                │  │
│  │   - whatsappLogs     │  │                                │  │
│  └──────────────────────┘  └────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend Framework | React 18 + Vite | Fast HMR, tree-shaking, TypeScript support |
| Backend Framework | Express.js | Lightweight, mature ecosystem, Socket.io native |
| Database | MongoDB | Flexible schema for varied data models, Atlas managed |
| Real-time | Socket.io | Reliable WebSocket with fallback, room-based architecture |
| Auth | JWT | Stateless, scalable, mobile-friendly |
| File Storage | Cloudinary | CDN built-in, image transformations, generous free tier |
| WhatsApp | Exotel | India-focused, reliable, template management |
| Invoicing | Zoho Invoice | Free tier available, GST compliant, API-first |
| Payments | Razorpay | India-first, easy integration, dashboard |

---

## 3. Database Schema Design

### 3.1 Collections Overview

```
MongoDB Database: agencyflow
├── users              # All system users (admin, manager, developer, client)
├── projects           # Project records
├── tasks              # Task assignments within projects
├── milestones         # Billing milestones per project
├── invoices           # Generated invoices (Zoho reference + local copy)
├── conversations      # Chat conversation metadata
├── messages           # Chat messages
├── activityLogs       # System-wide activity tracking
└── whatsappLogs       # WhatsApp message delivery logs
```

### 3.2 Users Collection

```javascript
{
  _id: ObjectId,
  name: String,                    // Required, trimmed
  email: String,                   // Required, unique, lowercase
  password: String,                // Hashed with bcrypt (salt rounds: 12)
  phone: String,                   // For WhatsApp notifications
  avatar: String,                  // Cloudinary URL
  role: String,                    // enum: ['admin', 'manager', 'developer', 'client']
  company: String,                 // Client company name
  designation: String,             // Job title
  isActive: Boolean,               // Soft delete flag (default: true)
  lastLogin: Date,
  pushToken: String,               // For future push notifications
  preferences: {
    emailNotifications: Boolean,    // default: true
    whatsappNotifications: Boolean, // default: true
    language: String,               // default: 'en'
    timezone: String,               // default: 'Asia/Kolkata'
  },
  createdAt: Date,                 // Auto (timestamps: true)
  updatedAt: Date,                 // Auto (timestamps: true)
}

// Indexes
{ email: 1 }                       // unique
{ role: 1 }
{ isActive: 1 }
{ phone: 1 }
```

### 3.3 Projects Collection

```javascript
{
  _id: ObjectId,
  name: String,                    // Required
  description: String,
  clientId: ObjectId,              // ref: 'User' (role: client)
  managerId: ObjectId,             // ref: 'User' (role: manager)
  developerIds: [ObjectId],        // ref: 'User' (role: developer)
  budget: {
    amount: Number,                // Total project budget
    currency: String,              // default: 'INR'
    paid: Number,                  // Total paid so far
    pending: Number,               // Calculated: amount - paid
  },
  deadline: Date,
  priority: String,                // enum: ['low', 'medium', 'high', 'critical']
  status: String,                  // enum: ['draft', 'active', 'on_hold', 'completed']
  tags: [String],                  // Project categorization
  documents: [{
    name: String,
    url: String,                   // Cloudinary URL
    uploadedBy: ObjectId,
    uploadedAt: Date,
  }],
  createdBy: ObjectId,             // ref: 'User' (admin who created)
  conversationId: ObjectId,        // ref: 'Conversation' (auto-created group chat)
  createdAt: Date,
  updatedAt: Date,
}

// Indexes
{ clientId: 1 }
{ managerId: 1 }
{ developerIds: 1 }
{ status: 1 }
{ priority: 1 }
{ createdBy: 1 }
```

### 3.4 Tasks Collection

```javascript
{
  _id: ObjectId,
  projectId: ObjectId,             // ref: 'Project'
  title: String,                   // Required
  description: String,
  assignedTo: ObjectId,            // ref: 'User' (developer)
  assignedBy: ObjectId,            // ref: 'User' (admin/manager)
  deadline: Date,
  priority: String,                // enum: ['low', 'medium', 'high', 'critical']
  status: String,                  // enum: ['todo', 'in_progress', 'review', 'done']
  attachments: [{
    name: String,
    url: String,                   // Cloudinary URL
    type: String,
  }],
  comments: [{
    userId: ObjectId,
    text: String,
    createdAt: Date,
  }],
  createdAt: Date,
  updatedAt: Date,
}

// Indexes
{ projectId: 1 }
{ assignedTo: 1 }
{ status: 1 }
{ projectId: 1, status: 1 }       // Compound index
```

### 3.5 Milestones Collection

```javascript
{
  _id: ObjectId,
  projectId: ObjectId,             // ref: 'Project'
  title: String,                   // Required
  description: String,
  amount: Number,                  // Milestone payment amount (INR)
  dueDate: Date,
  status: String,                  // enum: see flow below
  createdBy: ObjectId,             // ref: 'User'
  approvedBy: ObjectId,            // ref: 'User' (client who approved)
  approvedAt: Date,
  paymentId: ObjectId,             // ref: 'Payment' (Razorpay reference)
  paidAt: Date,
  paidBy: String,                  // 'razorpay' | 'manual'
  invoiceId: ObjectId,             // ref: 'Invoice'
  remindersSent: [{
    channel: String,               // 'email' | 'whatsapp'
    sentAt: Date,
    status: String,
  }],
  createdAt: Date,
  updatedAt: Date,
}

// Status Flow:
// pending → in_progress → submitted → client_approved → payment_pending → paid

// Indexes
{ projectId: 1 }
{ status: 1 }
{ dueDate: 1 }
{ projectId: 1, status: 1 }
```

### 3.6 Invoices Collection

```javascript
{
  _id: ObjectId,
  projectId: ObjectId,             // ref: 'Project'
  milestoneId: ObjectId,           // ref: 'Milestone'
  clientId: ObjectId,              // ref: 'User'

  // Zoho Invoice reference
  zohoInvoiceId: String,           // Zoho's invoice ID
  zohoInvoiceNumber: String,       // Auto-generated by Zoho (e.g., INV-00042)
  zohoInvoiceUrl: String,          // Zoho hosted invoice URL

  // Local invoice data (copy)
  invoiceNumber: String,           // Local reference number
  items: [{
    description: String,
    quantity: Number,
    rate: Number,
    amount: Number,
    taxPercentage: Number,         // GST percentage
    taxAmount: Number,
  }],
  subtotal: Number,
  taxTotal: Number,                // Total GST amount
  discount: {
    type: String,                  // 'percentage' | 'fixed'
    value: Number,
    amount: Number,                // Calculated discount amount
  },
  total: Number,                   // Final amount after tax & discount
  currency: String,                // default: 'INR'

  // GST Details
  gst: {
    enabled: Boolean,              // default: true
    companyGSTIN: String,          // Your company GSTIN
    clientGSTIN: String,           // Client's GSTIN (optional)
    sgst: Number,                  // State GST
    cgst: Number,                  // Central GST
    igst: Number,                  // Integrated GST (inter-state)
  },

  // Delivery
  sentVia: [{
    channel: String,               // 'email' | 'whatsapp'
    sentAt: Date,
    status: String,                // 'sent' | 'delivered' | 'failed'
  }],
  pdfUrl: String,                  // Cloudinary URL of generated PDF

  status: String,                  // enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled']
  dueDate: Date,
  paidAt: Date,

  createdBy: ObjectId,             // ref: 'User' (admin)
  createdAt: Date,
  updatedAt: Date,
}

// Indexes
{ projectId: 1 }
{ clientId: 1 }
{ milestoneId: 1 }
{ status: 1 }
{ zohoInvoiceId: 1 }
{ invoiceNumber: 1 }              // unique
```

### 3.7 Conversations Collection

```javascript
{
  _id: ObjectId,
  projectId: ObjectId,             // ref: 'Project'
  type: String,                    // 'project_group' (expandable for DMs later)
  participants: [{
    userId: ObjectId,              // ref: 'User'
    role: String,                  // User's role in this conversation
    joinedAt: Date,
    lastReadAt: Date,              // Last time user read messages
    isActive: Boolean,             // Still in conversation
  }],
  lastMessage: {
    text: String,
    senderId: ObjectId,
    sentAt: Date,
  },
  createdAt: Date,
  updatedAt: Date,
}

// Indexes
{ projectId: 1 }
{ 'participants.userId': 1 }
{ updatedAt: -1 }                  // For sorting by recent activity
```

### 3.8 Messages Collection

```javascript
{
  _id: ObjectId,
  conversationId: ObjectId,        // ref: 'Conversation'
  senderId: ObjectId,              // ref: 'User'
  type: String,                    // 'text' | 'file' | 'image' | 'system'
  message: String,                 // Text content
  attachments: [{
    name: String,
    url: String,                   // Cloudinary URL
    type: String,                  // MIME type
    size: Number,                  // File size in bytes
  }],
  replyTo: ObjectId,               // ref: 'Message' (for reply threading)
  isEdited: Boolean,               // default: false
  editedAt: Date,
  isDeleted: Boolean,              // Soft delete (default: false)
  seenBy: [{
    userId: ObjectId,
    seenAt: Date,
  }],
  createdAt: Date,
  updatedAt: Date,
}

// Indexes
{ conversationId: 1, createdAt: -1 }   // Primary query pattern
{ senderId: 1 }
{ conversationId: 1, senderId: 1 }
```

### 3.9 Activity Logs Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                // ref: 'User' (who performed action)
  action: String,                  // e.g., 'project.created', 'milestone.approved', 'user.login'
  resource: String,                // e.g., 'project', 'milestone', 'invoice', 'chat'
  resourceId: ObjectId,            // ID of affected resource
  details: Mixed,                  // Additional context (flexible)
  ip: String,                     // Client IP address
  userAgent: String,               // Browser/device info
  createdAt: Date,
}

// Indexes
{ userId: 1, createdAt: -1 }
{ action: 1 }
{ resource: 1, resourceId: 1 }
{ createdAt: -1 }                  // TTL index possible for auto-cleanup
```

### 3.10 WhatsApp Logs Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                // ref: 'User' (recipient)
  phone: String,                   // Recipient phone number
  templateName: String,            // Exotel template name
  templateParams: [String],        // Template variable values
  message: String,                 // Rendered message content
  mediaUrl: String,                // Attached media URL (if any)
  mediaType: String,               // 'image' | 'document' | 'video'

  // Exotel response
  exotelSid: String,               // Exotel message SID
  status: String,                  // 'queued' | 'sent' | 'delivered' | 'read' | 'failed'
  statusUpdatedAt: Date,
  errorCode: String,
  errorMessage: String,

  // Context
  trigger: String,                 // What triggered this message
  triggerResourceId: ObjectId,     // Related resource (milestone, invoice, etc.)

  createdAt: Date,
  updatedAt: Date,
}

// Indexes
{ userId: 1, createdAt: -1 }
{ phone: 1 }
{ status: 1 }
{ exotelSid: 1 }
{ trigger: 1 }
{ createdAt: -1 }
```

---

## 4. Authentication & Authorization

### 4.1 Authentication Flow

```
┌──────────┐     POST /api/auth/login      ┌──────────┐
│  Client  │ ─────────────────────────────▶ │  Server  │
│ (React)  │     { email, password }        │(Express) │
└──────────┘                                └────┬─────┘
                                                 │
                                    1. Find user by email
                                    2. Compare password (bcrypt)
                                    3. Generate JWT (7d expiry)
                                    4. Log activity
                                                 │
┌──────────┐     { token, user }            ┌────▼─────┐
│  Client  │ ◀───────────────────────────── │  Server  │
│  Store   │     200 OK                     │          │
│  token   │                                └──────────┘
└──────────┘

Subsequent requests:
┌──────────┐     Authorization: Bearer <token>  ┌──────────┐
│  Client  │ ──────────────────────────────────▶ │  Server  │
│          │                                     │ Verify   │
│          │     { data }                        │ JWT +    │
│          │ ◀────────────────────────────────── │ Check    │
└──────────┘     200 OK                          │ Role     │
                                                 └──────────┘
```

### 4.2 JWT Token Structure

```javascript
// Payload
{
  id: "user_object_id",
  role: "admin",          // Used for role-based middleware
  iat: 1708000000,        // Issued at
  exp: 1708604800,        // Expires in 7 days
}

// Signing
jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })
```

### 4.3 Role-Based Middleware

```javascript
// Usage in routes
router.post('/projects', auth, roleGuard(['admin']), createProject);
router.get('/projects', auth, roleGuard(['admin', 'manager', 'developer', 'client']), getProjects);
router.patch('/milestones/:id/approve', auth, roleGuard(['client']), approveMilestone);

// Implementation
const roleGuard = (allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions.'
    });
  }
  next();
};
```

### 4.4 Password Policy

| Rule | Requirement |
|------|-------------|
| Minimum length | 8 characters |
| Special characters | At least 1 required |
| Hashing algorithm | bcrypt |
| Salt rounds | 12 |
| Storage | Never stored in plain text |

---

## 5. Project Module

### 5.1 Project Status Flow

```
┌─────────┐     Activate     ┌─────────┐
│  DRAFT  │ ───────────────▶ │ ACTIVE  │
└─────────┘                  └────┬────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             │             ▼
              ┌──────────┐       │      ┌───────────┐
              │ ON HOLD  │───────┘      │ COMPLETED │
              └──────────┘  Resume      └───────────┘
```

### 5.2 Project Creation Flow

1. **Admin** creates project with client, manager, budget, deadline
2. System auto-creates a **project group chat** with all participants
3. System sends **WhatsApp notification** to client about new project
4. Activity logged: `project.created`
5. Status: `draft` (admin changes to `active` when ready)

### 5.3 Developer Assignment

- Admin can assign multiple developers to a project
- Developers are auto-added to the project group chat
- Developer receives WhatsApp notification about assignment
- Admin can reassign developers at any time

---

## 6. Milestone & Payment System

### 6.1 Milestone Status Flow

```
┌─────────┐    Start     ┌─────────────┐    Submit    ┌───────────┐
│ PENDING │ ───────────▶ │ IN PROGRESS │ ───────────▶ │ SUBMITTED │
└─────────┘              └─────────────┘              └─────┬─────┘
                                                            │
                                                     Client Review
                                                            │
                              ┌──────────────────────────────┤
                              │                              │
                              ▼                              ▼
                     ┌────────────────┐            ┌──────────────┐
                     │ CLIENT APPROVED│            │   REJECTED   │
                     └───────┬────────┘            │ (back to IP) │
                             │                     └──────────────┘
                     Generate Invoice
                             │
                             ▼
                   ┌─────────────────┐    Payment    ┌──────┐
                   │ PAYMENT PENDING │ ────────────▶ │ PAID │
                   └─────────────────┘               └──────┘
```

### 6.2 Payment Methods

| Method | Flow |
|--------|------|
| **Razorpay** | Client clicks Pay → Razorpay checkout → Webhook confirms → Status: Paid |
| **Manual** | Client pays via bank transfer → Admin marks as paid → Status: Paid |

### 6.3 Auto Reminders

| Event | Channel | Timing |
|-------|---------|--------|
| Milestone due in 3 days | WhatsApp + Email | Auto |
| Milestone overdue | WhatsApp + Email | Daily |
| Payment pending > 7 days | WhatsApp + Email | Every 3 days |
| Invoice generated | WhatsApp + Email | Immediate |

---

## 7. Invoice System (Zoho Invoice)

### 7.1 Integration Architecture

```
AgencyFlow CRM                          Zoho Invoice (Free)
┌────────────┐    Create Invoice API    ┌────────────────┐
│ Milestone  │ ────────────────────────▶│ Create Invoice │
│ Approved   │                          │ + Auto Number  │
│            │◀────────────────────────│ Return PDF URL │
│ Store ref  │    Invoice ID + PDF      │                │
└────────────┘                          └────────────────┘
      │
      │  Send via
      ▼
┌──────────┐     ┌──────────┐
│  Email   │     │ WhatsApp │
│  (Zoho)  │     │ (Exotel) │
└──────────┘     └──────────┘
```

### 7.2 Zoho Invoice API Setup

1. **Create Zoho Invoice Account** (Free — up to 1,000 invoices/year)
   - Go to [invoice.zoho.in](https://invoice.zoho.in)
   - Sign up with your business email
   - Complete GST setup

2. **Create API Application**
   - Go to [api-console.zoho.in](https://api-console.zoho.in)
   - Create "Server-based" application
   - Redirect URI: `https://yourdomain.com/api/zoho/callback`
   - Note: Client ID, Client Secret

3. **Generate Refresh Token**
   ```
   Authorization URL:
   https://accounts.zoho.in/oauth/v2/auth?
     scope=ZohoInvoice.invoices.CREATE,ZohoInvoice.invoices.READ,ZohoInvoice.invoices.UPDATE,ZohoInvoice.contacts.CREATE,ZohoInvoice.contacts.READ
     &client_id=YOUR_CLIENT_ID
     &response_type=code
     &redirect_uri=YOUR_REDIRECT_URI
     &access_type=offline
   ```

4. **Exchange code for refresh token:**
   ```bash
   curl -X POST https://accounts.zoho.in/oauth/v2/token \
     -d "code=AUTH_CODE" \
     -d "client_id=CLIENT_ID" \
     -d "client_secret=CLIENT_SECRET" \
     -d "redirect_uri=REDIRECT_URI" \
     -d "grant_type=authorization_code"
   ```

### 7.3 Invoice Generation Flow

```javascript
// Simplified flow
async function generateInvoice(milestoneId) {
  // 1. Get milestone & project data
  const milestone = await Milestone.findById(milestoneId).populate('projectId clientId');

  // 2. Create/get Zoho contact for client
  const zohoContact = await getOrCreateZohoContact(milestone.clientId);

  // 3. Create Zoho invoice
  const zohoInvoice = await zohoApi.createInvoice({
    customer_id: zohoContact.contact_id,
    line_items: [{
      name: milestone.title,
      description: `${milestone.projectId.name} - ${milestone.title}`,
      rate: milestone.amount,
      quantity: 1,
    }],
    gst_treatment: 'business_gst',        // or 'consumer'
    gst_no: milestone.clientId.gstNumber,
    place_of_supply: milestone.clientId.state,
    discount: milestone.discount || 0,
  });

  // 4. Store invoice reference locally
  const invoice = new Invoice({
    projectId: milestone.projectId._id,
    milestoneId: milestone._id,
    clientId: milestone.clientId._id,
    zohoInvoiceId: zohoInvoice.invoice_id,
    zohoInvoiceNumber: zohoInvoice.invoice_number,
    total: zohoInvoice.total,
    status: 'sent',
  });
  await invoice.save();

  // 5. Send via WhatsApp
  await sendWhatsAppInvoice(milestone.clientId.phone, zohoInvoice);

  // 6. Update milestone
  milestone.invoiceId = invoice._id;
  milestone.status = 'payment_pending';
  await milestone.save();

  return invoice;
}
```

### 7.4 GST Configuration

| Field | Description |
|-------|-------------|
| GSTIN | Your company's GST number |
| GST Treatment | `business_gst`, `business_none`, `consumer` |
| Place of Supply | State code for GST calculation |
| SGST | State GST (intra-state) |
| CGST | Central GST (intra-state) |
| IGST | Integrated GST (inter-state) |

---

## 8. Real-Time Chat System

### 8.1 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     CLIENTS                               │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐         │
│  │Admin   │  │Manager │  │  Dev   │  │Client  │         │
│  │Browser │  │Browser │  │Browser │  │Browser │         │
│  └───┬────┘  └───┬────┘  └───┬────┘  └───┬────┘         │
│      │           │           │           │               │
│      └───────────┴───────────┴───────────┘               │
│                      │                                    │
│               Socket.io Client                            │
└──────────────────────┼────────────────────────────────────┘
                       │  WebSocket (ws://)
                       │  with JWT auth
                       ▼
┌──────────────────────────────────────────────────────────┐
│                  SOCKET.IO SERVER                         │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Connection Handler                                  │ │
│  │  - Verify JWT token                                  │ │
│  │  - Join user to their project rooms                  │ │
│  │  - Track online status                               │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Rooms     │  │   Events    │  │   Broadcast     │  │
│  │ project:123 │  │ new_message │  │ to room members │  │
│  │ project:456 │  │ typing      │  │                 │  │
│  │             │  │ seen        │  │                 │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
               ┌──────────────┐
               │   MongoDB    │
               │  (messages)  │
               └──────────────┘
```

### 8.2 Socket.io Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `connection` | Client → Server | JWT in handshake | Authenticate & join rooms |
| `join_room` | Client → Server | `{ conversationId }` | Join a chat room |
| `send_message` | Client → Server | `{ conversationId, message, attachments }` | Send new message |
| `new_message` | Server → Client | `{ message }` | Broadcast new message to room |
| `typing_start` | Client → Server | `{ conversationId }` | User started typing |
| `typing_stop` | Client → Server | `{ conversationId }` | User stopped typing |
| `user_typing` | Server → Client | `{ userId, name }` | Broadcast typing indicator |
| `mark_seen` | Client → Server | `{ conversationId, messageId }` | Mark messages as seen |
| `message_seen` | Server → Client | `{ messageId, userId }` | Broadcast read receipt |
| `edit_message` | Client → Server | `{ messageId, newText }` | Edit existing message |
| `message_edited` | Server → Client | `{ messageId, newText }` | Broadcast edit |
| `delete_message` | Client → Server | `{ messageId }` | Soft delete message |
| `message_deleted` | Server → Client | `{ messageId }` | Broadcast deletion |
| `user_online` | Server → Client | `{ userId }` | User came online |
| `user_offline` | Server → Client | `{ userId }` | User went offline |

### 8.3 Chat Features

| Feature | Implementation |
|---------|---------------|
| Real-time messaging | Socket.io rooms per project |
| Typing indicator | Debounced events (300ms) |
| Read receipts | `seenBy` array in messages |
| File sharing | Upload to Cloudinary, send URL in message |
| Edit message | Update text, set `isEdited: true` |
| Delete message | Soft delete (`isDeleted: true`) |
| Message history | Paginated query (50 per page) |
| Offline support | Messages persist in DB, synced on reconnect |

---

## 9. WhatsApp Integration (Exotel)

### 9.1 Setup Guide

1. **Create Exotel Account**
   - Go to [exotel.com](https://exotel.com)
   - Sign up for a business account
   - Enable WhatsApp Business API

2. **Get API Credentials**
   - Dashboard → Settings → API
   - Note: SID, API Key, API Token, Subdomain

3. **Create Message Templates**
   Templates must be pre-approved by WhatsApp/Exotel.

### 9.2 Message Templates

| Template Name | Use Case | Variables |
|--------------|----------|-----------|
| `milestone_created` | New milestone notification | `{{project_name}}`, `{{milestone_title}}`, `{{amount}}` |
| `milestone_approved` | Client approved milestone | `{{project_name}}`, `{{milestone_title}}` |
| `invoice_generated` | Invoice sent to client | `{{invoice_number}}`, `{{amount}}`, `{{pdf_link}}` |
| `payment_reminder` | Payment overdue reminder | `{{client_name}}`, `{{amount}}`, `{{due_date}}` |
| `project_update` | Project status changed | `{{project_name}}`, `{{old_status}}`, `{{new_status}}` |
| `developer_assigned` | Dev assigned to project | `{{developer_name}}`, `{{project_name}}` |
| `payment_received` | Payment confirmation | `{{client_name}}`, `{{amount}}`, `{{invoice_number}}` |

### 9.3 API Integration

```javascript
// Exotel WhatsApp Service
const axios = require('axios');

class ExotelWhatsAppService {
  constructor() {
    this.baseUrl = `https://${process.env.EXOTEL_SUBDOMAIN}.exotel.com/v2/accounts/${process.env.EXOTEL_SID}`;
    this.auth = {
      username: process.env.EXOTEL_API_KEY,
      password: process.env.EXOTEL_API_TOKEN,
    };
  }

  async sendTemplate(phone, templateName, params, mediaUrl = null) {
    try {
      const payload = {
        from: process.env.EXOTEL_WHATSAPP_FROM,
        to: phone,
        template: {
          name: templateName,
          parameters: params,
        },
      };

      if (mediaUrl) {
        payload.media = { url: mediaUrl };
      }

      const response = await axios.post(
        `${this.baseUrl}/messages`,
        payload,
        { auth: this.auth }
      );

      // Log to database
      await WhatsAppLog.create({
        phone,
        templateName,
        templateParams: params,
        mediaUrl,
        exotelSid: response.data.sid,
        status: 'queued',
      });

      return response.data;
    } catch (error) {
      console.error('WhatsApp send failed:', error);
      throw error;
    }
  }

  // Webhook handler for delivery status updates
  async handleWebhook(data) {
    const log = await WhatsAppLog.findOne({ exotelSid: data.sid });
    if (log) {
      log.status = data.status; // 'sent', 'delivered', 'read', 'failed'
      log.statusUpdatedAt = new Date();
      if (data.error) {
        log.errorCode = data.error.code;
        log.errorMessage = data.error.message;
      }
      await log.save();
    }
  }
}

module.exports = new ExotelWhatsAppService();
```

### 9.4 Notification Triggers

| Event | Template | Recipients | Channel |
|-------|----------|-----------|---------|
| Milestone created | `milestone_created` | Client | WhatsApp + Email |
| Milestone submitted | `milestone_submitted` | Client | WhatsApp |
| Milestone approved | `milestone_approved` | Admin, Manager | WhatsApp |
| Invoice generated | `invoice_generated` | Client | WhatsApp + Email |
| Payment pending > 3 days | `payment_reminder` | Client | WhatsApp |
| Payment received | `payment_received` | Client, Admin | WhatsApp + Email |
| Project status change | `project_update` | All participants | WhatsApp |
| Developer assigned | `developer_assigned` | Developer | WhatsApp |

---

## 10. Calling Integration (Exotel)

### 10.1 Click-to-Call

```javascript
// Initiate call via Exotel
async function initiateCall(fromUserId, toPhone) {
  const response = await axios.post(
    `https://${EXOTEL_SUBDOMAIN}.exotel.com/v1/Accounts/${EXOTEL_SID}/Calls/connect`,
    {
      From: fromUserId.phone,
      To: toPhone,
      CallerId: EXOTEL_CALLER_ID,
      Record: true,
    },
    { auth: { username: EXOTEL_API_KEY, password: EXOTEL_API_TOKEN } }
  );

  // Log call
  await ActivityLog.create({
    userId: fromUserId,
    action: 'call.initiated',
    details: { to: toPhone, callSid: response.data.Call.Sid },
  });

  return response.data;
}
```

### 10.2 Call Features

| Feature | Support |
|---------|---------|
| Click-to-call from CRM | ✅ |
| Call recording | ✅ |
| Call duration tracking | ✅ |
| Call logs in activity | ✅ |
| IVR support | ✅ (Exotel built-in) |

---

## 11. Razorpay Payment Gateway

### 11.1 Integration Flow

```
┌──────────┐   Create Order    ┌──────────┐   Create Order API   ┌──────────┐
│  Client  │ ─────────────────▶│  Server  │ ────────────────────▶│ Razorpay │
│  (React) │                   │ (Express)│                      │   API    │
│          │◀──────────────────│          │◀────────────────────│          │
│          │   order_id        │          │   order object       │          │
│          │                   └──────────┘                      └──────────┘
│          │
│          │   Open Razorpay Checkout
│          │   (Client-side SDK)
│          │
│          │   Payment Success
│          │   { razorpay_order_id, razorpay_payment_id, razorpay_signature }
│          │ ─────────────────▶┌──────────┐   Verify Signature   ┌──────────┐
│          │                   │  Server  │ ────────────────────▶│ Razorpay │
│          │                   │          │                      │   API    │
│          │◀──────────────────│          │◀────────────────────│          │
│          │   Payment confirmed│         │   Verified           │          │
└──────────┘                   └──────────┘                      └──────────┘
```

### 11.2 Setup

1. Create account at [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Get Key ID (publishable) and Key Secret (private)
3. Configure webhook URL: `https://api.yourdomain.com/api/payments/webhook`
4. Enable events: `payment.captured`, `payment.failed`

### 11.3 Server Implementation

```javascript
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create order
router.post('/payments/create-order', auth, roleGuard(['client']), async (req, res) => {
  const { milestoneId } = req.body;
  const milestone = await Milestone.findById(milestoneId);

  const order = await razorpay.orders.create({
    amount: milestone.amount * 100, // Amount in paise
    currency: 'INR',
    receipt: `milestone_${milestoneId}`,
    notes: {
      milestoneId,
      projectId: milestone.projectId.toString(),
    },
  });

  res.json({ success: true, response: { orderId: order.id, amount: order.amount } });
});

// Verify payment
router.post('/payments/verify', auth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature === razorpay_signature) {
    // Payment verified — update milestone status to 'paid'
    // Send WhatsApp confirmation
    // Log activity
    res.json({ success: true, message: 'Payment verified' });
  } else {
    res.status(400).json({ success: false, message: 'Payment verification failed' });
  }
});
```

---

## 12. File Management (Cloudinary)

### 12.1 Configuration

| Setting | Value |
|---------|-------|
| Max file size | 10MB |
| Allowed types | PDF, JPG, PNG, GIF, ZIP, DOCX, XLSX |
| Storage | Cloudinary CDN |
| Access control | Role-based |
| File versioning | Enabled |

### 12.2 Upload Flow

```javascript
const cloudinary = require('../config/cloudinary');
const multer = require('multer');

// Memory storage for serverless compatibility
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/zip', 'application/x-zip-compressed',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  },
});

// Upload to Cloudinary
async function uploadToCloudinary(buffer, folder, resourceType = 'auto') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `agencyflow/${folder}`,
        resource_type: resourceType,
        quality: 'auto',
        fetch_format: 'auto',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}
```

### 12.3 Folder Structure (Cloudinary)

```
agencyflow/
├── avatars/           # User profile pictures
├── projects/
│   ├── {projectId}/
│   │   ├── documents/ # Project documents
│   │   └── chat/      # Chat file attachments
├── invoices/          # Generated invoice PDFs
└── misc/              # Other uploads
```

---

## 13. Dashboard & Analytics

### 13.1 Admin Dashboard

| Widget | Data Source | Refresh |
|--------|-----------|---------|
| Total Revenue | Sum of paid milestones | Real-time |
| Pending Payments | Milestones in `payment_pending` | Real-time |
| Active Projects | Projects with status `active` | Real-time |
| Total Users | Count by role | Real-time |
| WhatsApp Stats | Message delivery rates | Hourly |
| Revenue Chart (7 days) | Daily payment totals | Daily |
| Top Clients | Revenue per client | Daily |
| Project Status Distribution | Pie chart of statuses | Real-time |

### 13.2 Manager Dashboard

| Widget | Data Source |
|--------|-----------|
| My Projects | Projects where `managerId = currentUser` |
| Active Milestones | Open milestones across projects |
| Team Members | Developers in assigned projects |
| Recent Chat Activity | Latest messages in project chats |

### 13.3 Developer Dashboard

| Widget | Data Source |
|--------|-----------|
| My Tasks | Tasks where `assignedTo = currentUser` |
| Task Progress | Status distribution of assigned tasks |
| Upcoming Deadlines | Tasks sorted by deadline |
| Chat Notifications | Unread messages count |

### 13.4 Client Dashboard

| Widget | Data Source |
|--------|-----------|
| My Projects | Projects where `clientId = currentUser` |
| Milestones | Project milestones with status |
| Invoices | All invoices for client |
| Payment History | Completed payments |
| Chat | Conversations in projects |

### 13.5 Report Export

| Format | Library | Use Case |
|--------|---------|----------|
| PDF | `puppeteer` / `pdfkit` | Formal reports, invoices |
| Excel | `exceljs` | Data analysis, financial reports |
| CSV | Native | Raw data export |

---

## 14. Security Architecture

### 14.1 Security Layers

```
┌─────────────────────────────────────────┐
│           NGINX (Reverse Proxy)          │
│  - SSL/TLS termination                   │
│  - DDoS protection                       │
│  - Request size limits                   │
│  - IP-based rate limiting                │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│          EXPRESS MIDDLEWARE               │
│  - CORS (whitelisted origins)            │
│  - Helmet (security headers)             │
│  - Rate limiting (express-rate-limit)    │
│  - Body size limit (4.5MB)               │
│  - Request logging                       │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│          AUTH MIDDLEWARE                  │
│  - JWT verification                      │
│  - Role-based access control             │
│  - Token expiry check                    │
│  - Activity logging                      │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│          ROUTE HANDLERS                  │
│  - Input validation                      │
│  - Sanitization                          │
│  - Business logic                        │
└──────────────────────────────────────────┘
```

### 14.2 Security Checklist

| Item | Status | Implementation |
|------|--------|---------------|
| HTTPS enforcement | ✅ | NGINX + Let's Encrypt |
| JWT authentication | ✅ | jsonwebtoken library |
| Password hashing | ✅ | bcryptjs (12 rounds) |
| Role-based access | ✅ | Custom middleware |
| Rate limiting | ✅ | express-rate-limit |
| CORS protection | ✅ | Whitelisted origins |
| Input validation | 🔄 | Joi / express-validator |
| SQL injection prevention | ✅ | MongoDB (NoSQL) + Mongoose |
| XSS prevention | 🔄 | Helmet + sanitize-html |
| CSRF protection | 🔄 | csrf tokens (if needed) |
| Activity logging | ✅ | Custom activity logger |
| IP logging | ✅ | req.ip in activity logs |
| File type validation | ✅ | Multer file filter |
| File size limits | ✅ | 10MB max |
| Environment variables | ✅ | dotenv, never committed |

---

## 15. Activity Logging

### 15.1 Logged Actions

| Category | Actions |
|----------|---------|
| Auth | `user.login`, `user.logout`, `user.password_changed` |
| Project | `project.created`, `project.updated`, `project.status_changed` |
| Milestone | `milestone.created`, `milestone.submitted`, `milestone.approved`, `milestone.rejected` |
| Payment | `payment.initiated`, `payment.completed`, `payment.manual_marked` |
| Invoice | `invoice.generated`, `invoice.sent`, `invoice.downloaded` |
| Chat | `message.sent`, `message.edited`, `message.deleted` |
| WhatsApp | `whatsapp.sent`, `whatsapp.delivered`, `whatsapp.failed` |
| File | `file.uploaded`, `file.downloaded`, `file.deleted` |
| User | `user.created`, `user.updated`, `user.deactivated` |

### 15.2 Log Format

```javascript
{
  userId: ObjectId,
  action: 'milestone.approved',
  resource: 'milestone',
  resourceId: ObjectId('milestone_id'),
  details: {
    milestoneTitle: 'Frontend Development Phase 1',
    amount: 50000,
    projectName: 'Client Portal Redesign',
  },
  ip: '203.0.113.42',
  userAgent: 'Mozilla/5.0 ...',
  createdAt: ISODate('2026-02-17T10:30:00Z'),
}
```

---

## 16. Error Handling

### 16.1 API Error Response Format

```javascript
// Success response
{
  success: true,
  message: 'Operation completed successfully',
  response: { /* data */ }
}

// Error response
{
  success: false,
  message: 'Human-readable error message',
  error: 'DETAILED_ERROR_CODE',  // Only in development
  details: { /* validation errors */ }  // Optional
}
```

### 16.2 HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / Validation error |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient role) |
| 404 | Resource not found |
| 409 | Conflict (duplicate resource) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

### 16.3 Global Error Handler

```javascript
// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${err.stack}`);

  // Log to activity
  if (req.user) {
    ActivityLog.create({
      userId: req.user._id,
      action: 'error.occurred',
      details: { message: err.message, path: req.path },
      ip: req.ip,
    }).catch(() => {}); // Fire and forget
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      details: Object.values(err.errors).map(e => e.message),
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }

  // Default
  res.status(err.statusCode || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : err.message,
  });
});
```

---

## 17. API Reference

### 17.1 Base URL

```
Development: http://localhost:5000/api
Production:  https://api.yourdomain.com/api
```

### 17.2 Authentication Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### 17.3 Complete Endpoint List

Refer to [API Endpoints in README.md](./README.md#-api-endpoints) for the full table.

---

## 18. Socket.io Events

Refer to [Section 8.2](#82-socketio-events) for complete event reference.

### 18.1 Connection Setup (Client)

```javascript
import { io } from 'socket.io-client';

const socket = io(SOCKET_URL, {
  auth: {
    token: localStorage.getItem('admin_token'),
  },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

// Events
socket.on('connect', () => console.log('Connected'));
socket.on('new_message', (message) => { /* handle */ });
socket.on('user_typing', ({ userId, name }) => { /* show indicator */ });
socket.on('message_seen', ({ messageId, userId }) => { /* update UI */ });
```

### 18.2 Connection Setup (Server)

```javascript
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const io = new Server(httpServer, {
  cors: { origin: '*' },
});

// Auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  // Join user's project rooms
  // Handle events
  // Track online status
});
```

---

## 19. Deployment Guide

### 19.1 Prerequisites Checklist

- [ ] MongoDB Atlas cluster created with user & IP whitelisted
- [ ] Cloudinary account with API credentials
- [ ] Exotel account with WhatsApp templates approved
- [ ] Zoho Invoice account with API application created
- [ ] Razorpay account with test/live keys
- [ ] Domain name configured (DNS)
- [ ] VPS/EC2 instance provisioned (2GB RAM minimum)
- [ ] SSL certificate (Let's Encrypt)

### 19.2 Step-by-Step Deployment

Refer to [Deployment section in README.md](./README.md#-deployment) for detailed instructions.

### 19.3 Environment-Specific Configs

| Variable | Development | Production |
|----------|------------|------------|
| `NODE_ENV` | `development` | `production` |
| `MONGODB_URI` | Local/Atlas dev cluster | Atlas production cluster |
| `JWT_SECRET` | Any string | 64+ char random string |
| `CORS origin` | `*` | `https://yourdomain.com` |
| `Rate limit` | 1000/min | 100/min (IP), 1000/min (auth) |

---

## 20. Environment Configuration

### 20.1 Complete Variable Reference

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|-------------|
| `PORT` | ✅ | Server port | Default: 5000 |
| `NODE_ENV` | ✅ | Environment | `development` / `production` |
| `MONGODB_URI` | ✅ | MongoDB connection string | [MongoDB Atlas](https://cloud.mongodb.com) |
| `JWT_SECRET` | ✅ | JWT signing secret (64+ chars) | Generate: `openssl rand -hex 32` |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name | [Cloudinary Dashboard](https://cloudinary.com/console) |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key | Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret | Cloudinary Dashboard |
| `EXOTEL_SID` | ✅ | Exotel account SID | [Exotel Dashboard](https://my.exotel.com) |
| `EXOTEL_API_KEY` | ✅ | Exotel API key | Exotel Dashboard → Settings → API |
| `EXOTEL_API_TOKEN` | ✅ | Exotel API token | Exotel Dashboard → Settings → API |
| `EXOTEL_SUBDOMAIN` | ✅ | Exotel subdomain | Exotel Dashboard |
| `EXOTEL_WHATSAPP_FROM` | ✅ | WhatsApp sender number | Exotel WhatsApp setup |
| `ZOHO_CLIENT_ID` | ✅ | Zoho OAuth client ID | [Zoho API Console](https://api-console.zoho.in) |
| `ZOHO_CLIENT_SECRET` | ✅ | Zoho OAuth client secret | Zoho API Console |
| `ZOHO_REFRESH_TOKEN` | ✅ | Zoho OAuth refresh token | OAuth flow (see Section 7.2) |
| `ZOHO_ORGANIZATION_ID` | ✅ | Zoho organization ID | Zoho Invoice → Settings → Organization |
| `RAZORPAY_KEY_ID` | ✅ | Razorpay key ID | [Razorpay Dashboard](https://dashboard.razorpay.com) |
| `RAZORPAY_KEY_SECRET` | ✅ | Razorpay key secret | Razorpay Dashboard |
| `VITE_API_URL` | ✅ | Backend API URL (frontend) | Your backend URL |
| `VITE_SOCKET_URL` | ✅ | Socket.io URL (frontend) | Your backend URL |
| `VITE_RAZORPAY_KEY_ID` | ✅ | Razorpay publishable key | Razorpay Dashboard |

---

## 21. Testing Strategy

### 21.1 Test Pyramid

```
         ┌─────────┐
         │   E2E   │  ← Cypress / Playwright (critical flows)
         │  Tests  │
        ┌┴─────────┴┐
        │Integration │  ← Supertest (API endpoints)
        │   Tests    │
       ┌┴────────────┴┐
       │  Unit Tests   │  ← Jest / Vitest (utils, services)
       └──────────────┘
```

### 21.2 Test Coverage Targets

| Layer | Target | Tool |
|-------|--------|------|
| Unit tests | 80%+ | Vitest / Jest |
| API integration | All endpoints | Supertest |
| E2E critical paths | Login, Create Project, Payment | Cypress |
| Performance | Load testing | Artillery / k6 |

### 21.3 Critical Test Scenarios

1. **Auth flow:** Login → Get profile → Unauthorized access → Token expiry
2. **Project flow:** Create → Assign → Update status → Complete
3. **Milestone flow:** Create → Submit → Approve → Generate Invoice → Pay
4. **Chat:** Send → Receive → Edit → Delete → File share
5. **WhatsApp:** Template send → Webhook delivery status
6. **Payment:** Create order → Razorpay checkout → Verify → Mark paid

---

## 22. Scaling & Performance

### 22.1 Current Architecture (Phase 1: 1–200 users)

| Component | Config |
|-----------|--------|
| Server | Single PM2 process |
| Database | MongoDB Atlas M10 |
| Chat | In-memory Socket.io |
| Cache | None |
| File CDN | Cloudinary |

### 22.2 Phase 2: 200–500 users

| Component | Upgrade |
|-----------|---------|
| Server | PM2 cluster mode (all CPUs) |
| Database | MongoDB Atlas M30 + indexes |
| Chat | Socket.io + Redis adapter |
| Cache | Redis for sessions + analytics |
| Monitoring | PM2 metrics + Sentry |

### 22.3 Phase 3: 500–1000 users

| Component | Upgrade |
|-----------|---------|
| Server | Load balancer (NGINX) + multiple instances |
| Database | MongoDB replica set + sharding |
| Chat | Dedicated Socket.io cluster |
| Cache | Redis Cluster |
| Monitoring | Grafana + Prometheus |
| CDN | Cloudflare in front of Cloudinary |

### 22.4 Phase 4: 1000+ users (SaaS conversion)

| Component | Upgrade |
|-----------|---------|
| Architecture | Microservices |
| Orchestration | Kubernetes |
| Database | Per-tenant databases |
| Queue | RabbitMQ / Bull for async jobs |
| Search | Elasticsearch |
| Auth | OAuth2 + SSO |

### 22.5 MongoDB Indexes

```javascript
// Critical indexes for performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1, isActive: 1 });

db.projects.createIndex({ clientId: 1, status: 1 });
db.projects.createIndex({ managerId: 1 });
db.projects.createIndex({ developerIds: 1 });

db.tasks.createIndex({ projectId: 1, status: 1 });
db.tasks.createIndex({ assignedTo: 1, status: 1 });

db.milestones.createIndex({ projectId: 1, status: 1 });
db.milestones.createIndex({ dueDate: 1, status: 1 });

db.messages.createIndex({ conversationId: 1, createdAt: -1 });

db.activityLogs.createIndex({ userId: 1, createdAt: -1 });
db.activityLogs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

db.whatsappLogs.createIndex({ phone: 1, createdAt: -1 });
db.whatsappLogs.createIndex({ status: 1 });
```

---

## 23. Future Roadmap

### 23.1 Short-term (3–6 months)

- [ ] Complete all planned API endpoints
- [ ] Socket.io chat implementation
- [ ] Exotel WhatsApp integration
- [ ] Zoho Invoice integration
- [ ] Razorpay payment flow
- [ ] Admin, Manager, Developer, Client dashboards
- [ ] File upload with Cloudinary
- [ ] Activity logging system
- [ ] Email notification system

### 23.2 Medium-term (6–12 months)

- [ ] Mobile app (React Native / Expo)
- [ ] Push notifications
- [ ] Advanced analytics & reporting
- [ ] PDF/Excel export
- [ ] Redis caching layer
- [ ] Rate limiting with Redis
- [ ] Automated testing suite
- [ ] CI/CD pipeline
- [ ] Monitoring & alerting (Sentry, Grafana)

### 23.3 Long-term (12+ months)

- [ ] SaaS conversion (multi-tenancy)
- [ ] Custom domain per tenant
- [ ] AI-powered project estimation
- [ ] Client self-service portal
- [ ] Kanban board for tasks
- [ ] Time tracking integration
- [ ] Third-party integrations (Slack, Jira, GitHub)
- [ ] API documentation portal (Swagger/OpenAPI)
- [ ] Kubernetes deployment
- [ ] Internationalization (i18n)

---

## 📞 Support & Contact

| Channel | Details |
|---------|---------|
| Developer | Deepak Kushwah |
| Email | deepakkushwah748930@gmail.com |
| GitHub | [github.com/deepakkushwah](https://github.com/deepakkushwah) |

---

<p align="center">
  <strong>AgencyFlow CRM — Documentation v2.0</strong><br/>
  <em>Last updated: February 2026</em>
</p>
