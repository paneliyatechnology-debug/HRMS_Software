# Paneliya HRMS — Enterprise Human Resource Management System

A modern, production-grade, full-lifecycle Enterprise **Human Resource Management System (HRMS)** built with **Next.js 16 (App Router)** and **Nest.js 11 (REST API & Swagger OpenAPI)**.

---

## 🌟 Key Features & Capabilities

- **Full Lifecycle HR Management**:
  `Recruitment → Onboarding → Employee Directory → Attendance & Clock → Leave Workflow → Payroll & Payslips → Performance & OKRs → Training & Certifications → Documents → Assets → Resignation & Exit Clearance`
- **Pixel-Accurate SaaS UI**: Aligned with the reference dashboard design featuring 4 interactive KPI metric cards with micro-charts, Performance Overview (Income vs Expense bar chart with month hover card), Leave Application statuses, Employee Status breakdown, and responsive Employee Directory.
- **Role-Based Access Control (RBAC)**:
  - 👑 **Super Admin**: Complete platform configuration, audits, settings, and full system privileges.
  - 💼 **HR Admin / HR Executive**: Employee management, onboarding, attendance override, leaves, payroll processing, ATS hiring.
  - 👥 **Manager**: Direct reports approval, team attendance, leave sign-offs, performance reviews.
  - 👤 **Employee**: Self-service portal (Check-in/Check-out clock, leave applications, payslip downloads, goal tracking).
  - 🎯 **Recruiter**: Job openings, applicant tracking system (ATS) pipeline, interview scheduling, candidate-to-employee onboarding.
  - 💰 **Finance / Payroll Admin**: Salary structure configuration, tax deductions, payroll run execution, payslip generation.
- **Instant Role Switcher**: Quick one-click dropdown in the header to effortlessly test any role without re-logging.
- **Dark Mode & Light Mode**: Seamless theme toggling with smooth transitions.
- **Global Search**: `Ctrl + K` or `/` shortcut to instantly search employees, roles, departments, or navigate modules.
- **Live Interactive Punch Clock**: Real-time seconds counter, break tracker, geofence verification, and attendance audit trail.
- **11-Tab Employee Profile Modal**:
  1. Overview & Quick Stats
  2. Personal Information & Emergency Contact
  3. Employment & Shift Details
  4. Attendance History & Overtime
  5. Leave Balances & History
  6. Salary Structure & Deductions Breakdown
  7. Verified Documents Vault
  8. Performance Ratings & Appraisals
  9. Training Programs & Skill Certifications
  10. Company Assets Assigned
  11. Chronological Activity Audit Trail

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | **Next.js 16** (React 19) | App Router, Server/Client components, TailwindCSS, Lucide Icons |
| **Backend** | **Nest.js 11** | TypeScript (ESM `nodenext`), Controllers, Services, Class-validator |
| **API Docs** | **Swagger OpenAPI 3.0** | Interactive API testing at `http://localhost:4000/api/docs` |
| **Persistence** | File-backed JSON Database | Zero-dependency file persistence in `backend/data/database.json` |
| **Security** | JWT, RBAC Guards, Bcrypt | Password hashing, audit logging, protected module access |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Installation
Install dependencies for root, backend, and frontend:
```bash
# In the root repository directory:
npm install

# Backend dependencies:
cd backend && npm install

# Frontend dependencies:
cd ../frontend && npm install
```

### 2. Running Locally

You can launch both frontend and backend concurrently or run them in separate terminals:

#### Option A: Run Both Concurrently (Recommended)
```bash
npm run dev
```

#### Option B: Run Individually
**Terminal 1 — Nest.js Backend (Port 4000):**
```bash
cd backend
npm run start:dev
```
*API Base URL*: `http://localhost:4000/api`  
*Swagger UI*: `http://localhost:4000/api/docs`

**Terminal 2 — Next.js Frontend (Port 3000):**
```bash
cd frontend
npm run dev
```
*Web Application*: `http://localhost:3000`

---

## 👥 Demo Accounts & Credentials

Use the one-click **Role Switcher** in the top navigation bar or log in with any of these pre-seeded demo users (Password: `password123`):

| Role | Name | Email | Permissions |
|---|---|---|---|
| **Super Admin** | John Deo | `john.admin@paneliya.com` | Full system access, audit logs, system settings |
| **HR Admin** | Sarah Jenkins | `sarah.hr@paneliya.com` | Complete employee lifecycle, payroll, ATS, attendance |
| **Manager** | David Miller | `david.m@paneliya.com` | Team directory, team approvals, performance reviews |
| **Employee** | Juan Hogan | `juan.hogan@paneliya.com` | Attendance punch, leave application, payslips, goals |
| **Recruiter** | Emily Stone | `emily.recruiter@paneliya.com` | Job requisitions, ATS applicant pipeline, interviews |
| **Finance Admin** | Robert Sterling | `robert.finance@paneliya.com` | Payroll calculations, salary structures, payslips |

---

## 📦 Backend API Modules

Nest.js routes are organized cleanly under `/api`:

- **`/api/auth`**: Login, token verification, password management
- **`/api/employees`**: Employee CRUD, profile tabs, status lifecycle updates
- **`/api/organization`**: Departments, designations, locations, org chart tree
- **`/api/attendance`**: Check-in, check-out, break tracking, monthly calendar
- **`/api/leaves`**: Apply, approve/reject, leave balance calculation
- **`/api/holidays`**: Company holiday calendar & location filters
- **`/api/payroll`**: Salary structures, payroll processing runs, payslip generation
- **`/api/documents`**: Employee document storage, verification status, categories
- **`/api/performance`**: Goal setting, reviews, KPIs, 1-5 rating appraisals
- **`/api/training`**: Courses, training programs, employee enrollments
- **`/api/recruitment`**: Jobs, candidates pipeline (Applied → Offer → Hired)
- **`/api/assets`**: Asset inventory & employee allocations
- **`/api/resignations`**: Resignation submission, exit clearance, final settlement
- **`/api/notifications`**: System notifications, mark-as-read
- **`/api/announcements`**: Company-wide broadcasts & target audiences
- **`/api/reports`**: Statistical summaries and export (CSV/Excel/PDF)
- **`/api/audit-logs`**: Immutable security and activity audit records
- **`/api/settings`**: Working hours, policies, company information

---

## 📁 Repository Structure

```text
paneliya-hrms/
├── backend/                  # Nest.js 11 REST API Application
│   ├── src/
│   │   ├── app.module.ts     # Main application module wiring 18 submodules
│   │   ├── main.ts           # Bootstrap, CORS, Swagger setup (Port 4000)
│   │   ├── database/         # JSON-backed database service & realistic seed data
│   │   ├── auth/             # Authentication & RBAC guards
│   │   ├── employees/        # Employee management module
│   │   ├── attendance/       # Clock in/out & attendance tracking
│   │   ├── leaves/           # Leave policies & workflow
│   │   ├── payroll/          # Payroll calculation & payslips
│   │   ├── recruitment/      # ATS, candidates & jobs
│   │   ├── performance/      # Performance appraisal module
│   │   ├── training/         # Employee development & courses
│   │   ├── assets/           # Equipment tracking
│   │   ├── resignations/     # Resignation & exit management
│   │   ├── documents/        # Employee document vault
│   │   ├── organization/     # Departments, designations, locations
│   │   ├── holidays/         # Holiday calendar
│   │   ├── announcements/    # Company notice board
│   │   ├── notifications/    # Alert system
│   │   ├── reports/          # Analytics & data export
│   │   ├── audit-logs/       # Compliance audit trails
│   │   └── settings/         # Company & system configuration
│   └── package.json
│
├── frontend/                 # Next.js 16 SaaS Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx    # Root layout with Auth & Theme providers
│   │   │   ├── page.tsx      # Main application controller & active module router
│   │   │   └── globals.css   # Custom CSS tokens, scrollbars, micro-animations
│   │   ├── components/
│   │   │   ├── Sidebar.tsx   # SaaS navigation & Discord daily meeting widget
│   │   │   ├── Header.tsx    # Global search, notification bell, role switcher
│   │   │   ├── DashboardView.tsx # Pixel-aligned dashboard from reference
│   │   │   ├── modals/       # Punch clock, leave modal, profile modal, global search
│   │   │   └── modules/      # 15+ Full-page Enterprise HR modules
│   │   ├── context/          # AuthContext (RBAC) & ThemeContext
│   │   ├── lib/              # API client with automatic offline fallback
│   │   └── types/            # TypeScript type definitions
│   └── package.json
│
└── package.json              # Monorepo root with dev orchestration
```

---

## 🛡️ Security & Enterprise Best Practices

- **Zero Client Trust**: All permissions validated on the backend.
- **Data Integrity**: Relational foreign keys and balance checks on leave and payroll calculations.
- **Audit Trails**: Critical operations (employee creation, salary changes, leave approvals) write immutable audit records.
- **Resilience**: Frontend includes intelligent network fallbacks ensuring zero blank screens even during server restarts.

---

## 📄 License
This project is licensed under the MIT License.
