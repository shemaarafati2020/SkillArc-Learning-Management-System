import { useAuth } from '../../contexts/AuthContext';
import StudentDashboard from './StudentDashboard';
import InstructorDashboard from './InstructorDashboard';
import AdminDashboard from './AdminDashboard';

const RoleDashboard = () => {
  const { isAdmin, isInstructor } = useAuth();

  if (isAdmin) {
    return <AdminDashboard />;
  }

  if (isInstructor) {
    return <InstructorDashboard />;
  }

  return <StudentDashboard />;
};

export default RoleDashboard;
