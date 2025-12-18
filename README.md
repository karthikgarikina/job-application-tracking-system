# Job Application Tracking System (ATS) — Backend

## 1. Project Overview

This project is a **Job Application Tracking System (ATS) backend** that demonstrates how real-world hiring platforms manage applications using **Role-Based Access Control (RBAC)**, **workflow state machines**, and **asynchronous background processing**.

The system supports multiple user roles (**Candidate, Recruiter, Hiring Manager**), enforces valid application stage transitions, and sends **non-blocking email notifications** using a background worker and message queue.

---

## 2. Architecture Explanation

### High-Level Architecture

```
Client (Postman / Optional Frontend)
        |
        v
REST API (Node.js + Express)
        |
        |-- Authentication & RBAC
        |-- Business Logic
        |-- State Machine Validation
        |
        |---> Email Job Queue (In-Memory)
                     |
                     v
              Background Worker
                     |
                     v
              SMTP Service (Ethereal Email)
```

### How the Background Worker & Queue Interact with the API

- The API handles all user requests synchronously (job apply, stage update, etc.).
- When an action requires an email notification:
  - The API pushes an email job into an **in-memory queue**
  - A **background worker** continuously polls this queue
  - The worker sends emails using **Ethereal SMTP**
- The API response is returned immediately, ensuring **non-blocking behavior**
- This keeps the API responsive even when notifications are triggered

---

## 3. Application Workflow & State Transitions

### Application Workflow

```
Candidate → Apply for Job
        → Application Created (APPLIED)
        → Recruiter Reviews
        → Stage Updated
        → Hiring Manager Views (Read-only)
```

### Valid Application State Transitions

```
APPLIED
   ↓
SCREENING
   ↓
INTERVIEW
   ↓
HIRED
```

- `REJECTED` can be reached from any stage **except HIRED**
- All transitions are validated in the backend
- Invalid transitions are rejected with proper error responses

---

## 4. Role-Based Access Control (RBAC)

### RBAC Matrix

| Endpoint                         | Candidate | Recruiter | Hiring Manager |
|----------------------------------|-----------|-----------|----------------|
| POST /auth/register              | ✅        | ✅        | ✅             |
| POST /auth/login                 | ✅        | ✅        | ✅             |
| GET /jobs                        | ✅        | ✅        | ✅             |
| POST /jobs                       | ❌        | ✅        | ❌             |
| POST /applications/apply         | ✅        | ❌        | ❌             |
| GET /applications/my             | ✅        | ❌        | ❌             |
| GET /applications/job/:id        | ❌        | ✅        | ❌             |
| POST /applications/update-stage  | ❌        | ✅        | ❌             |
| GET /applications/company        | ❌        | ❌        | ✅             |

RBAC is enforced using middleware at the API level.

---

## 5. Asynchronous Email Notifications

### Triggered Events

| Event                         | Email Recipient |
|------------------------------|-----------------|
| Application submitted        | Candidate       |
| Application submitted        | Recruiter       |
| Application stage updated    | Candidate       |

### Email Processing Design

- Email jobs are queued by the API
- A background worker processes the queue asynchronously
- Emails are sent using **Ethereal Email**
- Email preview URLs are logged for verification

This design cleanly decouples side effects from core API logic.

---

## 6. Database Schema (ERD)

### Entities & Relationships

```
User
 ├─ id
 ├─ name
 ├─ email
 ├─ role
 ├─ companyId (nullable)

Company
 ├─ id
 ├─ name

Job
 ├─ id
 ├─ title
 ├─ description
 ├─ companyId
 ├─ recruiterId

Application
 ├─ id
 ├─ stage
 ├─ jobId
 ├─ candidateId

ApplicationHistory
 ├─ id
 ├─ applicationId
 ├─ fromStage
 ├─ toStage
 ├─ changedBy
 ├─ createdAt
```

- Recruiters and Hiring Managers belong to a Company
- Jobs belong to a Company
- Applications link Candidates and Jobs
- ApplicationHistory provides an **audit trail**

---

## 📂 Project Structure

```
job-application-tracking-system/
├── backend/
│ ├── src/
│ │ ├── config/
│ │ │ ├── prisma.js
│ │ │ └── email.js
│ │ │
│ │ ├── middleware/
│ │ │ ├── auth.middleware.js
│ │ │ └── rbac.middleware.js
│ │ │
│ │ ├── modules/
│ │ │ ├── auth/
│ │ │ │ ├── auth.controller.js
│ │ │ │ └── auth.routes.js
│ │ │ │
│ │ │ ├── jobs/
│ │ │ │ ├── jobs.controller.js
│ │ │ │ └── jobs.routes.js
│ │ │ │
│ │ │ ├── applications/
│ │ │ │ ├── applications.controller.js
│ │ │ │ └── applications.routes.js
│ │ │
│ │ ├── queues/
│ │ │ └── emailQueue.js
│ │ │
│ │ ├── workers/
│ │ │ └── emailWorker.js
│ │ │
│ │ ├── app.js
│ │ └── server.js
│ │
│ ├── prisma/
│ │ ├── schema.prisma
│ │ └── migrations/
│ │
│ ├── .env
│ ├── package.json
│ └── README.md
│
├── ATS.postman_collection.json
└── README.md
```

### Structure Highlights
- **Modular design** by feature (auth, jobs, applications)
- **Background worker & queue** isolated from API logic
- **Clear separation of concerns**
- Easy to scale and maintain

---

## 7. Setup Instructions

### Prerequisites

- Node.js (v18+)
- PostgreSQL
- npm

### Step 1: Clone Repository

```bash
git clone https://github.com/karthikgarikina/job-application-tracking-system
cd job-application-tracking-system/backend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Variables

Create a `.env` file:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/ats_db
JWT_SECRET=your_jwt_secret
```

### Step 4: Run Database Migrations

```bash
npx prisma migrate dev
```

### Step 5: Start Application

```bash
npm run dev
```

Expected logs:

```
Server running on port 3000
📨 Email worker started
```

---

## 8. Running Tests & API Verification

- APIs are tested using **Postman**
- JWT tokens are required for protected routes
- All role-based flows can be verified without a frontend
- A Postman collection is included for easy testing

---

## 9. Postman Collection

**File:** `ATS.postman_collection.json`

Includes requests for:
- Authentication
- Job creation
- Application submission
- Stage updates
- Hiring Manager views

---

## 10. Audit Trail (Application History)

The system maintains a complete **audit trail** for application state changes to ensure traceability and accountability.

### How Audit Trail Works
- Every application stage change creates a new record
- Stored in the `ApplicationHistory` table
- Records:
  - Previous stage
  - New stage
  - User who made the change
  - Timestamp
  
### Example (Database View)

```sql
select * from "ApplicationHistory";
```
or

```sql
SELECT 
  ah.applicationId,
  ah.fromStage,.;
  ah.toStage,
  u.name AS changedBy,
  u.role,
  ah.createdAt
FROM "ApplicationHistory" ah
JOIN "User" u ON u.id = ah."changedById"
ORDER BY ah.createdAt;
```
### Note:
- The audit trail is intentionally not exposed via a public API, as it is considered internal system data meant to be accessed only by administrators for monitoring and compliance purposes.
---
## 11. Demo Video

📹 **Demo Video Link:**  
<PASTE_YOUR_VIDEO_LINK_HERE>

### Demo Flow

1. Recruiter logs in and creates a job
2. Candidate applies for the job
3. Recruiter updates application stage
4. Hiring Manager views applications
5. Terminal shows asynchronous email preview URLs (Ethereal)

### Demonstrates
- Complete application workflow
- Role-Based Access Control (RBAC)
- Valid application state transitions
- Asynchronous background email processing


## 12. Notes on Design Choices

- In-memory queue used for simplicity and clarity
- Ethereal Email used for safe SMTP testing
- Backend-first approach
- Clear separation of concerns

---

## 13. Conclusion

This project demonstrates:S

- Stateful backend workflows
- Secure role-based systems
- Asynchronous background processing
- Real-world system design patterns
- Future work includes adding a frontend interface to provide a complete end-to-end user experience

Focus is placed on **correctness**, **maintainability**, and **clarity**.
