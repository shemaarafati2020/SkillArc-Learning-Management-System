<div align="center">

<!-- Animated Header -->
<img src="docs/images/banner.svg" alt="UniLearn Banner" width="100%"/>

<br/>
<br/>

<!-- Badges -->
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MUI](https://img.shields.io/badge/MUI-6.1-007FFF?style=for-the-badge&logo=mui&logoColor=white)](https://mui.com/)
[![PHP](https://img.shields.io/badge/PHP-8.x-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://php.net/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com/)

<br/>

[![Stars](https://img.shields.io/github/stars/yourusername/unilearn-lms?style=social)](https://github.com/yourusername/unilearn-lms)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

---

### A comprehensive Learning Management System for managing courses, students, instructors, and educational content.

<br/>

[Features](#-features) | [Screenshots](#-screenshots) | [Quick Start](#-quick-start) | [Installation](#-installation) | [API](#-api-endpoints)

<br/>

</div>

---

## Screenshots

<details open>
<summary><h3>Landing Page</h3></summary>
<br/>
<p align="center">
  <img src="docs/images/landing page.png" alt="Landing Page" width="100%"/>
</p>
<p align="center"><em>Beautiful landing page with course discovery and user registration</em></p>
</details>

<details open>
<summary><h3>Student Dashboard</h3></summary>
<br/>
<p align="center">
  <img src="docs/images/student dashboard.png" alt="Student Dashboard" width="100%"/>
</p>
<p align="center"><em>Track progress, view enrolled courses, and manage learning journey</em></p>
</details>

<details>
<summary><h3>Instructor Dashboard</h3></summary>
<br/>
<p align="center">
  <img src="docs/images/instructor dashboard.png" alt="Instructor Dashboard" width="100%"/>
</p>
<p align="center"><em>Manage courses, view analytics, and review student submissions</em></p>
</details>

<details>
<summary><h3>Admin Panel</h3></summary>
<br/>
<p align="center">
  <img src="docs/images/admin dashboard.png" alt="Admin Panel" width="100%"/>
</p>
<p align="center"><em>Complete system administration with user management and analytics</em></p>
</details>

<details>
<summary><h3>Course Management</h3></summary>
<br/>
<p align="center">
  <img src="docs/images/course management.png" alt="Course Management" width="100%"/>
</p>
<p align="center"><em>Create, edit, and organize courses with modules and lessons</em></p>
</details>

<details>
<summary><h3>Login Page</h3></summary>
<br/>
<p align="center">
  <img src="docs/images/login page.png" alt="Login Page" width="100%"/>
</p>
<p align="center"><em>Secure authentication with role-based access control</em></p>
</details>

---

## Features

<table>
<tr>
<td width="50%" valign="top">

### Student Features
| Feature | Description |
|:-------:|-------------|
| **Course Enrollment** | Browse catalog and enroll in courses |
| **Progress Tracking** | Visual progress bars and completion status |
| **Assignments** | Submit work and receive feedback |
| **Quizzes** | Take timed quizzes with instant grading |
| **Certificates** | Earn certificates upon course completion |
| **Forums** | Participate in discussion forums |
| **Dashboard** | Personalized learning dashboard |

</td>
<td width="50%" valign="top">

### Instructor Features
| Feature | Description |
|:-------:|-------------|
| **Course Builder** | Create and manage courses |
| **Module Designer** | Organize content into modules |
| **Quiz Creator** | Build quizzes with multiple question types |
| **Grading System** | Grade assignments and provide feedback |
| **Analytics** | View enrollment and performance stats |
| **Forum Moderation** | Manage course discussions |
| **Certificate Issuing** | Award completion certificates |

</td>
</tr>
<tr>
<td width="50%" valign="top">

### Admin Features
| Feature | Description |
|:-------:|-------------|
| **User Management** | Create, edit, and manage all users |
| **System Analytics** | Platform-wide statistics dashboard |
| **Audit Logs** | Track all system activities |
| **Settings** | Configure system-wide settings |
| **Backup/Restore** | Database backup and recovery |
| **Role Management** | Assign and manage user roles |
| **Notifications** | Send platform-wide notifications |

</td>
<td width="50%" valign="top">

### Platform Features
| Feature | Description |
|:-------:|-------------|
| **Responsive UI** | Material Design with MUI components |
| **Real-time Updates** | Instant notifications |
| **File Uploads** | Support for documents and media |
| **Charts & Graphs** | Recharts data visualization |
| **Animations** | Smooth Framer Motion transitions |
| **REST API** | Well-structured backend API |
| **Secure Auth** | JWT-based authentication |

</td>
</tr>
</table>

---

## Quick Start

Get up and running in 5 minutes:

```bash
# 1. Start XAMPP (Apache + MySQL)

# 2. Create database
mysql -u root -e "CREATE DATABASE lms_db"

# 3. Import schema
mysql -u root lms_db < backend/config/schema.sql

# 4. Install frontend dependencies
cd frontend && npm install

# 5. Start development server
npm run dev
```

Open **http://localhost:3000** in your browser!

---

## Tech Stack

<table>
<tr>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="48" height="48" alt="React"/>
<br/><b>React 18</b>
<br/><sub>UI Library</sub>
</td>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" width="48" height="48" alt="Vite"/>
<br/><b>Vite</b>
<br/><sub>Build Tool</sub>
</td>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/materialui/materialui-original.svg" width="48" height="48" alt="MUI"/>
<br/><b>Material UI</b>
<br/><sub>Components</sub>
</td>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg" width="48" height="48" alt="PHP"/>
<br/><b>PHP</b>
<br/><sub>Backend</sub>
</td>
<td align="center" width="20%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg" width="48" height="48" alt="MySQL"/>
<br/><b>MySQL</b>
<br/><sub>Database</sub>
</td>
</tr>
</table>

### Additional Libraries

| Frontend | Backend |
|----------|---------|
| React Router - Client-side routing | Apache - Web server |
| Axios - HTTP client | XAMPP - Development stack |
| Recharts - Data visualization | |
| Framer Motion - Animations | |
| Notistack - Notifications | |
| Day.js - Date handling | |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                          │
│                    (React + Vite on :3000)                      │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP Requests
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VITE DEV SERVER                            │
│                   (Proxy /api requests)                         │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     APACHE WEB SERVER                           │
│                      (XAMPP on :80)                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    PHP BACKEND                            │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │  │
│  │  │ Controllers │──│    Models    │──│     Utils       │   │  │
│  │  └─────────────┘  └──────────────┘  └─────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MySQL DATABASE                              │
│                    (lms_db on :3306)                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

Before running this project, ensure you have the following installed:

1. **XAMPP** (or any Apache + MySQL + PHP stack)
   - Download: https://www.apachefriends.org/
   
2. **Node.js** (v18 or higher recommended)
   - Download: https://nodejs.org/

3. **Git** (optional, for cloning)
   - Download: https://git-scm.com/

---

## Installation

### Step 1: Clone or Download the Project

Place the project folder in your XAMPP `htdocs` directory:
```
C:\xampp\htdocs\learning management system
```

### Step 2: Database Setup

1. Start **XAMPP Control Panel**
2. Start **Apache** and **MySQL** services
3. Open **phpMyAdmin** in your browser: http://localhost/phpmyadmin
4. Create a new database named `lms_db`
5. Import the database schema:
   - Go to the `lms_db` database
   - Click on **Import** tab
   - Select the file: `backend/config/schema.sql`
   - Click **Go** to execute

Alternatively, run this SQL to create the database:
```sql
CREATE DATABASE IF NOT EXISTS lms_db;
USE lms_db;
```
Then import the schema from `backend/config/schema.sql`.

### Step 3: Configure Database Connection (Optional)

The default database configuration is in `backend/config/database.php`:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'lms_db');
```

Modify these values if your MySQL credentials differ.

### Step 4: Install Frontend Dependencies

Open a terminal/command prompt and navigate to the frontend directory:

```bash
cd "C:\xampp\htdocs\learning management system\frontend"
```

Install the required Node.js modules:

```bash
npm install
```

This will install all dependencies listed in `package.json`.

---

## Running the Application

### Start the Backend (XAMPP)

1. Open **XAMPP Control Panel**
2. Start **Apache** (runs on port 80)
3. Start **MySQL** (runs on port 3306)

The backend API will be available at:
```
http://localhost/learning%20management%20system/backend/api/
```

### Start the Frontend Development Server

Open a terminal in the frontend directory and run:

```bash
cd "C:\xampp\htdocs\learning management system\frontend"
npm run dev
```

The frontend will start at:
```
http://localhost:3000
```

The browser should open automatically.

---

## Available Scripts

In the `frontend` directory:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint for code quality |

---

## Project Structure

```
learning management system/
├── backend/
│   ├── api/              # API endpoints
│   ├── config/           # Database config and schema
│   ├── controllers/      # Business logic controllers
│   ├── models/           # Data models
│   ├── uploads/          # File uploads directory
│   └── utils/            # Utility functions
│
├── frontend/
│   ├── src/              # React source code
│   ├── public/           # Static assets
│   ├── package.json      # NPM dependencies
│   └── vite.config.js    # Vite configuration
│
└── README.md             # This file
```

---

## Troubleshooting

### Port Conflicts
- If port 80 is in use, modify Apache's port in XAMPP or stop conflicting services.
- If port 3000 is in use, Vite will automatically try the next available port.

### Database Connection Issues
- Ensure MySQL is running in XAMPP.
- Verify database name `lms_db` exists.
- Check credentials in `backend/config/database.php`.

### CORS Issues
- The frontend uses Vite's proxy to route `/api` requests to the backend.
- Ensure both Apache and Vite dev server are running.

### Module Not Found Errors
- Run `npm install` again in the frontend directory.
- Delete `node_modules` folder and `package-lock.json`, then run `npm install`.

---

## API Endpoints

The backend provides RESTful API endpoints:

| Module | Endpoints |
|--------|-----------|
| **Auth** | `POST /login`, `POST /register`, `POST /logout` |
| **Users** | `GET /users`, `GET /users/{id}`, `PUT /users/{id}` |
| **Courses** | `GET /courses`, `POST /courses`, `PUT /courses/{id}`, `DELETE /courses/{id}` |
| **Modules** | `GET /modules`, `POST /modules`, `PUT /modules/{id}` |
| **Lessons** | `GET /lessons`, `POST /lessons`, `PUT /lessons/{id}` |
| **Enrollments** | `GET /enrollments`, `POST /enrollments`, `DELETE /enrollments/{id}` |
| **Quizzes** | `GET /quizzes`, `POST /quizzes`, `GET /quizzes/{id}/submit` |
| **Assignments** | `GET /assignments`, `POST /assignments`, `POST /submissions` |
| **Forums** | `GET /forums`, `POST /forums`, `POST /forums/{id}/replies` |
| **Certificates** | `GET /certificates`, `POST /certificates/generate` |
| **Analytics** | `GET /analytics/dashboard`, `GET /analytics/reports` |

---


## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is for educational purposes.

---

<div align="center">

### Built with React + PHP + MySQL

<br/>

**[Report Bug](../../issues)** | **[Request Feature](../../issues)**

</div>
