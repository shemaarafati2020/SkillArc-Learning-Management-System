import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

// Layouts
import AuthLayout from './components/layout/AuthLayout';
import MainLayout from './components/layout/MainLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Landing Page
import LandingPage from './pages/landing/LandingPage';

// Dashboard
import RoleDashboard from './pages/dashboard/RoleDashboard';

// Courses
import CourseList from './pages/courses/CourseList';
import CourseDetail from './pages/courses/CourseDetail';
import CourseCreate from './pages/courses/CourseCreate';
import MyCourses from './pages/courses/MyCourses';

// Modules
import ModuleList from './pages/modules/ModuleList';

// Lessons
import LessonList from './pages/lessons/LessonList';

// Assignments
import AssignmentList from './pages/assignments/AssignmentList';
import AssignmentDetail from './pages/assignments/AssignmentDetail';

// Quizzes
import QuizList from './pages/quizzes/QuizList';
import QuizAttempt from './pages/quizzes/QuizAttempt';

// Forums
import ForumList from './pages/forums/ForumList';
import ThreadView from './pages/forums/ThreadView';

// Certificates
import CertificateList from './pages/certificates/CertificateList';

// Profile
import Profile from './pages/profile/Profile';

// Admin Pages
import UserManagement from './pages/admin/UserManagement';
import CourseManagement from './pages/admin/CourseManagement';
import Analytics from './pages/admin/Analytics';
import AuditLogs from './pages/admin/AuditLogs';
import Settings from './pages/admin/Settings';
import Payments from './pages/admin/Payments';

// Protected Route Component
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      </Route>

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<RoleDashboard />} />
        
        {/* Courses */}
        <Route path="/courses" element={<CourseList />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/courses/create" element={<ProtectedRoute roles={['admin']}><CourseCreate /></ProtectedRoute>} />
        <Route path="/courses/:id/edit" element={<ProtectedRoute roles={['admin']}><CourseCreate /></ProtectedRoute>} />
        <Route path="/my-courses" element={<MyCourses />} />
        
        {/* Modules */}
        <Route path="/modules" element={<ProtectedRoute roles={['instructor', 'admin']}><ModuleList /></ProtectedRoute>} />
        
        {/* Lessons */}
        <Route path="/lessons" element={<ProtectedRoute roles={['instructor', 'admin']}><LessonList /></ProtectedRoute>} />
        
        {/* Assignments */}
        <Route path="/assignments" element={<AssignmentList />} />
        <Route path="/assignments/:id" element={<AssignmentDetail />} />
        
        {/* Quizzes */}
        <Route path="/quizzes" element={<QuizList />} />
        <Route path="/quizzes/:id/attempt" element={<QuizAttempt />} />
        
        {/* Forums */}
        <Route path="/forums" element={<ForumList />} />
        <Route path="/forums/:id" element={<ThreadView />} />
        
        {/* Certificates */}
        <Route path="/certificates" element={<CertificateList />} />
        
        {/* Profile */}
        <Route path="/profile" element={<Profile />} />
        
        {/* Admin Routes */}
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><UserManagement /></ProtectedRoute>} />
        <Route path="/admin/courses" element={<ProtectedRoute roles={['admin']}><CourseManagement /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><Analytics /></ProtectedRoute>} />
        <Route path="/admin/payments" element={<ProtectedRoute roles={['admin']}><Payments /></ProtectedRoute>} />
        <Route path="/admin/audit-logs" element={<ProtectedRoute roles={['admin']}><AuditLogs /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute roles={['admin']}><Settings /></ProtectedRoute>} />
      </Route>

      {/* Catch-all Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
