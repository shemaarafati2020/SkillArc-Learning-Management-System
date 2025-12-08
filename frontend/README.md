# UniLearn LMS - Frontend

A modern, responsive Learning Management System frontend built with React, Vite, and Material-UI.

## 🚀 Tech Stack

- **React 18.3.1** - UI library
- **Vite 6.0.1** - Build tool and dev server
- **Material-UI 6.1.9** - Component library
- **React Router 6.28.0** - Client-side routing
- **Axios 1.7.9** - HTTP client
- **Notistack 3.0.1** - Toast notifications
- **Recharts 2.15.0** - Data visualization
- **Day.js 1.11.13** - Date manipulation
- **React Dropzone 14.3.5** - File uploads

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable components
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── PageHeader.jsx
│   │   │   └── StatCard.jsx
│   │   └── layout/          # Layout components
│   │       ├── AuthLayout.jsx
│   │       └── MainLayout.jsx
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── pages/               # Page components
│   │   ├── admin/           # Admin pages
│   │   ├── assignments/     # Assignment pages
│   │   ├── auth/            # Login/Register
│   │   ├── certificates/    # Certificate pages
│   │   ├── courses/         # Course pages
│   │   ├── dashboard/       # Dashboard
│   │   ├── forums/          # Forum pages
│   │   ├── profile/         # User profile
│   │   └── quizzes/         # Quiz pages
│   ├── services/            # API services
│   │   └── api.js
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── index.html               # HTML template
├── vite.config.js           # Vite configuration
└── package.json             # Dependencies

```

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API endpoint:**
   - The API base URL is configured in `src/services/api.js`
   - Default: `http://localhost/learning%20management%20system/backend/api`
   - Update if your backend is hosted elsewhere

## 🚀 Development

Start the development server:

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## 🏗️ Build

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## ✨ Features

### Authentication
- ✅ Login with email/password
- ✅ User registration with validation
- ✅ Session management
- ✅ Role-based access control (Student, Instructor, Admin)

### Theme & Accessibility
- ✅ Light/Dark mode toggle
- ✅ Adjustable font sizes
- ✅ High contrast mode
- ✅ Keyboard navigation support
- ✅ Screen reader friendly

### User Roles

#### Student
- View and enroll in courses
- Access course materials (modules, lessons)
- Submit assignments
- Take quizzes
- Participate in forums
- View certificates
- Track progress

#### Instructor
- Create and manage courses
- Create modules and lessons
- Create assignments and quizzes
- Grade submissions
- Moderate forums
- View course analytics

#### Admin
- Manage users (students, instructors)
- Manage all courses
- View system analytics
- Access audit logs
- Configure system settings

## 📋 Page Status

### ✅ Completed Pages
- Login
- Register
- Main Layout
- Auth Layout

### 🚧 To Be Implemented
All other pages have placeholder templates and need to be customized:
- Dashboard (Student/Instructor/Admin views)
- Course List, Detail, Create
- Assignment List, Detail
- Quiz List, Attempt
- Forum List, Thread View
- Certificate List
- Profile
- Admin pages (Users, Courses, Analytics, Audit Logs, Settings)

## 🔧 Customization Guide

### Adding a New Page

1. Create the component in the appropriate folder under `src/pages/`
2. Import and add the route in `src/App.jsx`
3. Add navigation link in `src/components/layout/MainLayout.jsx` if needed

### Adding API Endpoints

Add new API functions in `src/services/api.js`:

```javascript
export const newAPI = {
  getAll: () => api.get('/new/index.php'),
  create: (data) => api.post('/new/create.php', data),
  // ... more endpoints
};
```

### Styling

- Use Material-UI's `sx` prop for component-specific styles
- Global styles are in `src/index.css`
- Theme configuration is in `src/contexts/ThemeContext.jsx`

## 🔐 Authentication Flow

1. User logs in via `/login`
2. Backend returns user data and sets session cookie
3. `AuthContext` stores user data in state
4. Protected routes check authentication status
5. Role-based routes check user role

## 📡 API Integration

All API calls use Axios with:
- Base URL configuration
- Credentials included (cookies)
- Request/response interceptors
- Centralized error handling

## 🎨 UI Components

### Common Components
- **LoadingSpinner** - Loading indicator
- **PageHeader** - Page title with breadcrumbs and actions
- **StatCard** - Dashboard statistics card

### Material-UI Components Used
- AppBar, Toolbar, Drawer (Navigation)
- Card, Paper (Containers)
- TextField, Button, Select (Forms)
- Table, DataGrid (Data display)
- Dialog, Menu, Snackbar (Overlays)
- Icons from @mui/icons-material

## 📊 Data Visualization

Recharts is used for analytics:
- Line charts (enrollment trends)
- Pie charts (user distribution)
- Bar charts (performance metrics)

## 🐛 Troubleshooting

### Port already in use
Change the port in `vite.config.js`:
```javascript
server: {
  port: 3001, // Change to any available port
}
```

### API connection issues
1. Ensure backend is running
2. Check CORS configuration in backend
3. Verify API base URL in `src/services/api.js`

### Build errors
1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📝 Next Steps

1. **Implement Dashboard** - Add role-specific dashboard views
2. **Course Management** - Complete CRUD operations for courses
3. **Assignment System** - File upload, submission, grading
4. **Quiz Engine** - Question types, timer, auto-grading
5. **Forum System** - Threads, replies, moderation
6. **Analytics** - Charts and reports with Recharts
7. **Notifications** - Real-time notifications
8. **File Uploads** - Integrate with backend upload system

## 📄 License

This project is part of a university consortium LMS initiative.

## 👥 Contributors

Built for modern learning management with best practices in React development.
