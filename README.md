# Skillvora - Production-Ready MERN Stack Course Platform

Skillvora is a premium, secure educational website featuring granular course structures (Lectures, Videos, PDFs, Notes), a custom video player, built-in browser document readers, a student approval onboarding system, circular progress visualizations, and deep security overlays.

---

## Technical Stack
- **Frontend**: React.js, Vite, Tailwind CSS, Framer Motion, React Icons, Axios
- **Backend**: Node.js, Express.js, JWT, Nodemailer, Gmail SMTP
- **Database**: MongoDB, Mongoose
- **Security**: Helmet, express-rate-limit, express-mongo-sanitize, Key combination filters, console monitoring.

---

## Core Features & Protections

### 1. Granular Course Structures
- Courses contain Modules $\rightarrow$ Modules contain Lectures (Videos, PDFs, Notes).
- Admin syllabus panel allows rapid addition of modules and pasting of Google Drive sharing links.

### 2. Google Drive URL Embed Helper
The backend automatically parses sharing links (e.g. `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`) and transforms them into secure, sandboxed embed targets: `https://drive.google.com/file/d/FILE_ID/preview`.

### 3. Student Enrollment Lifecycle (Admin Approval System)
- New signups default to `pending` status.
- Admin immediately receives an email alert with signup attributes and verification links.
- Admin dashboard allows manual approval or rejection.
- Approved students receive an automated HTML welcome email, while rejected students receive a decline email.

### 4. High-Performance Security Shields
- Intercepts key commands: `F12`, `Ctrl+Shift+I`, `Ctrl+U`, `Ctrl+Shift+J`, `Ctrl+Shift+C`.
- Detects DevTools open states and blurs video feed elements with an inspect warn overlay.
- Dynamic floating watermark rendering the logged-in student's email, ID, and live-updating clock floats across the video.

---

## Directory Setup Guides

### Backend Configuration (`/backend`)
1. Create a `/backend/.env` file with these keys:
```text
PORT=5000
MONGODB_URI=mongodb://localhost:27017/skillvora
JWT_SECRET=your_jwt_signing_key_change_me
JWT_EXPIRE=7d

# SMTP Gmail Setup
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=receiver-admin@gmail.com

CLIENT_URL=http://localhost:5173
```
2. Start server in development mode:
```bash
cd backend
npm install
npm run dev
```

> [!TIP]
> **Out-of-the-Box Setup**: The very first user registering on a clean database is automatically assigned the `admin` role and approved status, ensuring you can log in and manage the site immediately without manual database edits!

---

### Frontend Configuration (`/frontend`)
1. Compile and host:
```bash
cd frontend
npm install
npm run dev
```

---

## Backend API Documentation

### Auth Module (`/api/auth`)
| Route | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/register` | `POST` | Public | Submits registration details, sends admin notification mail. |
| `/login` | `POST` | Public | Validates details and issues JWT. Rejects if pending/rejected. |
| `/me` | `GET` | Private | Returns currently logged-in user profile from session. |

### Admin Module (`/api/admin`) (Requires `adminOnly`)
| Route | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/pending-users` | `GET` | Admin | Lists all pending student signups. |
| `/approve/:id` | `PUT` | Admin | Approves a student and triggers confirmation email. |
| `/reject/:id` | `PUT` | Admin | Declines a student and triggers notification email. |
| `/analytics` | `GET` | Admin | Fetches system stats widgets counters. |

### Course Module (`/api/courses`)
| Route | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/` | `GET` | Public | Lists all courses (supports `q`, `category`, and `sort`). |
| `/:id` | `GET` | Public | Fetches complete populated syllabus details. |
| `/` | `POST` | Admin | Creates a new course folder. |
| `/:courseId/modules`| `POST` | Admin | Creates a module outline chapter. |
| `/modules/:moduleId/lectures`| `POST` | Admin | Uploads a lesson (resolves Google Drive embeds). |

### Progress Module (`/api/progress`) (Requires `approvedUsersOnly`)
| Route | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/dashboard` | `GET` | Student | Fetches student active enrollments and continue cards. |
| `/:courseId` | `GET` | Student | Retrives completion metrics for single course. |
| `/:courseId/lecture/:lectureId/toggle` | `POST` | Student | Checks/Unchecks lecture item and updates circular progress bar. |
| `/:courseId/resume` | `POST` | Student | Updates resume watch reference and elapsed timestamp. |

---

## Deployment ready guidelines

### Frontend (Vercel)
Ensure to direct build directory targets to Vite's output `/dist`. Set environment key:
- `VITE_API_URL` to backend server host url.

### Backend (Render / Railway / Heroku)
Make sure `MONGODB_URI`, `EMAIL_USER`, `EMAIL_PASS`, and `JWT_SECRET` are specified in production config properties.
