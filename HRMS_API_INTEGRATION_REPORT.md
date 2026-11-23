# HRMS API Integration Report: 9 Targeted Modules

This document details the complete end-to-end frontend integration of the 9 required modules from the Postman API Collection (`1_HRMS_API.postman_collection.json`).

All integrations strictly follow the project rules:
1. **Frontend Only**: Zero modifications to backend routes, database models, or controllers.
2. **Zero Dummy / Fabricated Data**: If backend data is unavailable or empty, clean loading, empty, and error states with retry buttons are displayed.
3. **Global Popup & Modal Design Standardization**: All modals across all modules adhere strictly to the shared design system (translucent dark backdrop `bg-slate-900/60 backdrop-blur-xs`, rounded-3xl cards, emerald primary actions, structured headers, and accessible inputs).

---

## Complete API Call Inventory by Module

### 1. Department Management (5 Endpoints)
- **File**: `src/components/modules/OrganizationModule.tsx` (`Departments` tab)
- **API Endpoints**:
  1. `GET /departments` → Fetches live department listing & department employee count stats.
  2. `POST /departments` → Creates a new department via the "Add Department" standardized modal.
  3. `GET /departments/:departmentId` → Loads full department details & structure.
  4. `PATCH /departments/:departmentId` → Updates department information via the "Edit Department" modal.
  5. `DELETE /departments/:departmentId` → Deletes a department via the standardized confirmation dialog.

---

### 2. Team Management (8 Endpoints)
- **File**: `src/components/modules/OrganizationModule.tsx` (`Teams` tab & sub-routing `/teams`)
- **API Endpoints**:
  1. `GET /teams` → Fetches all teams in the organization, showing team leads and member counters.
  2. `POST /teams` → Creates a new team via the "Create Team" modal.
  3. `GET /teams/:teamId` → Opens the "Team Roster & Details" modal displaying members and team lead.
  4. `PATCH /teams/:teamId` → Updates team name and description via the "Edit Team" modal.
  5. `DELETE /teams/:teamId` → Removes a team via the standardized confirmation dialog.
  6. `POST /teams/:teamId/leader` → Assigns or changes team leader via the "Assign Team Leader" modal.
  7. `POST /teams/:teamId/members` → Adds employees to a team via the "Add Team Member" modal.
  8. `DELETE /teams/:teamId/members/:userId` → Removes a member from a team.

---

### 3. Task Management (5 Endpoints)
- **File**: `src/components/modules/TasksModule.tsx` (Sidebar route `/tasks`)
- **API Endpoints**:
  1. `GET /tasks` → Fetches all company tasks, populating metrics cards (Total, In Progress, Review, Completed) and the task table.
  2. `POST /tasks` → Creates a new task with title, description, priority, assignee, and due date via the "Create New Task" modal.
  3. `GET /tasks/:taskId` → Opens the "Task Details" modal with full description, timeline, and assignment info.
  4. `PATCH /tasks/:taskId` → Updates task details or quick status transitions (Pending → In Progress → Review → Completed).
  5. `DELETE /tasks/:taskId` → Deletes a task via the standardized confirmation dialog.

---

### 4. Job Openings (6 Endpoints)
- **File**: `src/components/modules/RecruitmentModule.tsx` (`Openings` tab)
- **API Endpoints**:
  1. `GET /openings` → Loads all job openings, open positions count, and pipeline metrics.
  2. `POST /openings` → Creates a new job posting via the "Create Job Opening" modal.
  3. `GET /openings/public` → Opens the "Public Careers View" modal previewing published job listings.
  4. `GET /openings/:openingId` → Loads single opening details and requirement breakdown.
  5. `PATCH /openings/:openingId` → Updates opening status, title, department, or requirements via the "Edit Opening" modal.
  6. `DELETE /openings/:openingId` → Deletes a job posting via the standardized confirmation dialog.

---

### 5. Job Applications & Candidates (8 Endpoints)
- **File**: `src/components/modules/RecruitmentModule.tsx` (`Candidates` tab)
- **API Endpoints**:
  1. `GET /applications` → Fetches candidate applications across recruitment stages (Applied, Screening, Interview, Offered, Hired, Rejected).
  2. `POST /applications` → Adds a candidate application via the "Add Candidate" modal.
  3. `GET /applications/:applicationId` → Opens the "Candidate Application Details" modal.
  4. `PATCH /applications/:applicationId` → Updates application recruitment stage / status.
  5. `POST /applications/:applicationId/note` → Appends an interviewer note via the "Add Candidate Note" modal.
  6. `POST /applications/:applicationId/interview` → Schedules an interview via the "Schedule Interview" modal.
  7. `POST /applications/:applicationId/offer` → Sends an official job offer letter via the "Send Offer Letter" modal.
  8. `DELETE /applications/:applicationId` → Deletes a candidate record via the standardized confirmation dialog.

---

### 6. Payroll & Salaries (6 Endpoints)
- **Files**:
  - `src/components/modules/PayrollModule.tsx` (Admin Payroll & Salary Structures)
  - `src/components/modules/EmployeePayslipsModule.tsx` (Employee Self-Service Payslips)
- **API Endpoints**:
  1. `GET /payroll/payslips` → Fetches monthly payroll runs and payslip records for admin and employee views.
  2. `GET /payroll/payslips/:id` → Fetches complete itemized payslip breakdown for preview and PDF download.
  3. `POST /payroll/payslips/:id/paid` → Marks a payslip as Paid directly in the disbursement ledger.
  4. `GET /payroll/salaries` → Fetches employee monthly salary structures in the "Salary Structures" tab.
  5. `PUT /payroll/salaries/:employeeId` → Saves / configures monthly base salary, allowances, and statutory deductions via the "Configure Monthly Salary" modal.
  6. `GET /payroll/salaries/:employeeId` → Opens the "Salary Structure History" modal showing past revisions.

---

### 7. Subscription Plans (5 Endpoints)
- **File**: `src/components/modules/SettingsModule.tsx` (`Subscription & Plans` tab) & `src/components/modals/UpgradePlanModal.tsx`
- **API Endpoints**:
  1. `GET /plans` → Fetches all available subscription plans configured in the backend database.
  2. `POST /plans` → Creates a new system plan with price, duration, and feature description via the "Create System Plan" modal.
  3. `PATCH /plans/:planId` → Updates existing plan parameters via the "Edit System Plan" modal.
  4. `DELETE /plans/:planId` → Deletes a system plan via the standardized confirmation dialog.
  5. `POST /plans/:planId/sell` → Assigns a plan directly to a target company via the "Sell Plan to Company" modal.

---

### 8. Premium Management (7 Endpoints)
- **Files**:
  - `src/components/modules/SettingsModule.tsx` (`Subscription & Plans` tab)
  - `src/components/modals/UpgradePlanModal.tsx`
- **API Endpoints**:
  1. `GET /premium` → Fetches the company's current active premium tier, billing cycle, and expiration.
  2. `GET /premium/plans` → Fetches live plans available for purchase.
  3. `POST /premium/checkout` → Initiates a plan purchase / generates a Razorpay checkout session order.
  4. `POST /premium/verify` → Verifies the Razorpay payment signature after successful checkout.
  5. `GET /premium/orders` → Lists all company premium purchase orders.
  6. `POST /premium/orders` → Places a premium plan order.
  7. `PATCH /premium/orders/:orderId` → Updates order status via the "Update Order Status" modal.

---

### 9. Support & Demo Inquiries (4 Endpoints)
- **Files**:
  - `src/components/landing/BookDemoModal.tsx`
  - `src/components/modules/SettingsModule.tsx` (`Support Inquiries` tab)
- **API Endpoints**:
  1. `POST /support` → Submits a live demo request or contact message from the website landing page.
  2. `GET /support` → Lists all submitted demo and contact inquiries in the Admin Settings panel.
  3. `GET /support/:supportId` → Fetches full inquiry details via the "Inquiry Details" modal.
  4. `PATCH /support/:supportId` → Updates inquiry status (e.g., marks as `Read` or `Resolved`).

---

## Summary Total
- Total targeted modules: **9**
- Total real backend endpoints integrated: **49**
- Build Status: **100% Passing** (`npm run build` compiled cleanly with 0 TypeScript/Turbopack errors).
- Data integrity: **100% Real API** with clean loading and empty states, zero synthetic dummy records.
