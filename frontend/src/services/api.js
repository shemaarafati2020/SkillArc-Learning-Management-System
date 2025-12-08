import axios from 'axios';

const API_BASE_URL = 'http://localhost/learning%20management%20system/backend/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  uploadAvatar: (formData) =>
    api.post('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  // These map to UserController::getInstructors/getStudents where the action
  // is expected as the third URL segment (e.g. /users/any/instructors).
  getInstructors: () => api.get('/users/list/instructors'),
  getStudents: () => api.get('/users/list/students'),
};

// Courses API
export const coursesAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  getMyCourses: () => api.get('/courses/my-courses'),
  getCategories: () => api.get('/courses/categories'),
};

// Modules API
export const modulesAPI = {
  getByCourse: (courseId) => api.get(`/modules/course/${courseId}`),
  getById: (id) => api.get(`/modules/${id}`),
  create: (data) => api.post('/modules', data),
  update: (id, data) => api.put(`/modules/${id}`, data),
  delete: (id) => api.delete(`/modules/${id}`),
  reorder: (data) => api.post('/modules/reorder', data),
  // Helper to get all modules across instructor's courses
  getAll: async () => {
    try {
      const coursesRes = await coursesAPI.getMyCourses();
      if (coursesRes?.data?.success) {
        const courses = coursesRes.data.data || [];
        if (courses.length === 0) {
          return { data: { success: true, data: [] } };
        }
        const allModules = [];
        for (const course of courses) {
          try {
            const res = await modulesAPI.getByCourse(course.course_id);
            if (res?.data?.success) {
              allModules.push(...(res.data.data || []));
            }
          } catch (error) {
            console.warn(`Failed to fetch modules for course ${course.course_id}:`, error);
          }
        }
        return { data: { success: true, data: allModules } };
      }
      return { data: { success: true, data: [] } };
    } catch (error) {
      console.error('Error in modulesAPI.getAll():', error);
      return { data: { success: true, data: [] } };
    }
  },
};

// Lessons API
export const lessonsAPI = {
  getByModule: (moduleId) => api.get(`/lessons/module/${moduleId}`),
  getByCourse: (courseId) => api.get(`/lessons/course/${courseId}`),
  getById: (id) => api.get(`/lessons/${id}`),
  create: (data) => api.post('/lessons', data),
  update: (id, data) => api.put(`/lessons/${id}`, data),
  delete: (id) => api.delete(`/lessons/${id}`),
  markComplete: (id) => api.post(`/lessons/${id}/complete`),
  // Helper to get all lessons across instructor's courses
  getAll: async () => {
    try {
      const coursesRes = await coursesAPI.getMyCourses();
      if (coursesRes?.data?.success) {
        const courses = coursesRes.data.data || [];
        if (courses.length === 0) {
          return { data: { success: true, data: [] } };
        }
        const allLessons = [];
        for (const course of courses) {
          try {
            const res = await lessonsAPI.getByCourse(course.course_id);
            if (res?.data?.success) {
              allLessons.push(...(res.data.data || []));
            }
          } catch (error) {
            console.warn(`Failed to fetch lessons for course ${course.course_id}:`, error);
          }
        }
        return { data: { success: true, data: allLessons } };
      }
      return { data: { success: true, data: [] } };
    } catch (error) {
      console.error('Error in lessonsAPI.getAll():', error);
      return { data: { success: true, data: [] } };
    }
  },
};

// Enrollments API
export const enrollmentsAPI = {
  getAll: (params) => api.get('/enrollments', { params }),
  getMyEnrollments: () => api.get('/enrollments/my-enrollments'),
  getByCourse: (courseId) => api.get(`/enrollments/course/${courseId}`),
  checkEnrollment: (courseId) => api.get(`/enrollments/check/${courseId}`),
  enroll: (courseId) => api.post('/enrollments/enroll', { course_id: courseId }),
  drop: (courseId) => api.post(`/enrollments/${courseId}/drop`),
  updateProgress: (id, data) => api.put(`/enrollments/${id}`, data),
};

// Assignments API
export const assignmentsAPI = {
  getByCourse: (courseId) => api.get(`/assignments/course/${courseId}`),
  getUpcoming: () => api.get('/assignments/upcoming'),
  getById: (id) => api.get(`/assignments/${id}`),
  create: (data) => api.post('/assignments', data),
  update: (id, data) => api.put(`/assignments/${id}`, data),
  delete: (id) => api.delete(`/assignments/${id}`),
  // Helper to get all assignments across instructor's courses
  getAll: async () => {
    try {
      const coursesRes = await coursesAPI.getMyCourses();
      if (coursesRes?.data?.success) {
        const courses = coursesRes.data.data || [];
        if (courses.length === 0) {
          return { data: { success: true, data: [] } };
        }
        const allAssignments = [];
        for (const course of courses) {
          try {
            const res = await assignmentsAPI.getByCourse(course.course_id);
            if (res?.data?.success) {
              allAssignments.push(...(res.data.data || []));
            }
          } catch (error) {
            console.warn(`Failed to fetch assignments for course ${course.course_id}:`, error);
          }
        }
        return { data: { success: true, data: allAssignments } };
      }
      return { data: { success: true, data: [] } };
    } catch (error) {
      console.error('Error in assignmentsAPI.getAll():', error);
      return { data: { success: true, data: [] } };
    }
  },
};

// Submissions API
export const submissionsAPI = {
  getByAssignment: (assignId) => api.get(`/submissions/assignment/${assignId}`),
  getMySubmissions: () => api.get('/submissions/my-submissions'),
  getById: (id) => api.get(`/submissions/${id}`),
  submit: (data) => api.post('/submissions', data),
  grade: (id, data) => api.post(`/submissions/${id}/grade`, data),
};

// Quizzes API
export const quizzesAPI = {
  getByCourse: (courseId) => api.get(`/quizzes/course/${courseId}`),
  getById: (id) => api.get(`/quizzes/${id}`),
  getQuestions: (id) => api.get(`/quizzes/${id}/questions`),
  getAttempts: (id) => api.get(`/quizzes/${id}/attempts`),
  create: (data) => api.post('/quizzes', data),
  update: (id, data) => api.put(`/quizzes/${id}`, data),
  delete: (id) => api.delete(`/quizzes/${id}`),
  addQuestion: (data) => api.post('/quizzes/questions', data),
  updateQuestion: (id, data) => api.put(`/quizzes/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/quizzes/questions/${id}`),
  startAttempt: (id) => api.post(`/quizzes/${id}/start`),
  submitAttempt: (attemptId, answers) => api.post(`/quizzes/${attemptId}/submit`, { answers }),
  // Helper to get all quizzes across instructor's courses
  getAll: async () => {
    try {
      const coursesRes = await coursesAPI.getMyCourses();
      if (coursesRes?.data?.success) {
        const courses = coursesRes.data.data || [];
        if (courses.length === 0) {
          return { data: { success: true, data: [] } };
        }
        const allQuizzes = [];
        for (const course of courses) {
          try {
            const res = await quizzesAPI.getByCourse(course.course_id);
            if (res?.data?.success) {
              allQuizzes.push(...(res.data.data || []));
            }
          } catch (error) {
            console.warn(`Failed to fetch quizzes for course ${course.course_id}:`, error);
          }
        }
        return { data: { success: true, data: allQuizzes } };
      }
      return { data: { success: true, data: [] } };
    } catch (error) {
      console.error('Error in quizzesAPI.getAll():', error);
      return { data: { success: true, data: [] } };
    }
  },
};

// Certificates API
export const certificatesAPI = {
  getMyCertificates: () => api.get('/certificates/my-certificates'),
  getById: (id) => api.get(`/certificates/${id}`),
  generate: (courseId) => api.post(`/certificates/generate/${courseId}`),
  verify: (code) => api.get(`/certificates/verify/${code}`),
  download: (id) => api.get(`/certificates/${id}/download`, { responseType: 'blob' }),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.post(`/notifications/${id}/mark-read`),
  markAllAsRead: () => api.post('/notifications/mark-all-read'),
  send: (data) => api.post('/notifications/send', data),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// Forums API
export const forumsAPI = {
  getByCourse: (courseId) => api.get(`/forums/course/${courseId}`),
  getThreads: (forumId) => api.get(`/forums/${forumId}/threads`),
  getThread: (threadId) => api.get(`/forums/threads/${threadId}`),
  createForum: (data) => api.post('/forums', data),
  createThread: (data) => api.post('/forums/threads', data),
  createReply: (data) => api.post('/forums/replies', data),
  updateThread: (id, data) => api.put(`/forums/threads/${id}`, data),
  deleteThread: (id) => api.delete(`/forums/threads/${id}`),
  markSolution: (replyId) => api.post(`/forums/replies/${replyId}/solution`),
  updateForum: (id, data) => api.put(`/forums/${id}`, data),
  deleteForum: (id) => api.delete(`/forums/${id}`),
  // Helper to get all forums across instructor's courses
  getAll: async () => {
    try {
      const coursesRes = await coursesAPI.getMyCourses();
      if (coursesRes?.data?.success) {
        const courses = coursesRes.data.data || [];
        if (courses.length === 0) {
          return { data: { success: true, data: [] } };
        }
        const allForums = [];
        for (const course of courses) {
          try {
            const res = await forumsAPI.getByCourse(course.course_id);
            if (res?.data?.success) {
              allForums.push(...(res.data.data || []));
            }
          } catch (error) {
            console.warn(`Failed to fetch forums for course ${course.course_id}:`, error);
          }
        }
        return { data: { success: true, data: allForums } };
      }
      return { data: { success: true, data: [] } };
    } catch (error) {
      console.error('Error in forumsAPI.getAll():', error);
      return { data: { success: true, data: [] } };
    }
  },
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getCourse: (courseId) => api.get(`/analytics/course/${courseId}`),
  getStudent: (studentId) => api.get(`/analytics/student/${studentId}`),
  getInstructor: (instructorId) => api.get(`/analytics/instructor/${instructorId}`),
  getEnrollmentTrends: () => api.get('/analytics/enrollment-trends'),
  getCompletionRates: () => api.get('/analytics/completion-rates'),
};

// Settings API
export const settingsAPI = {
  getAll: () => api.get('/settings'),
  get: (key) => api.get(`/settings/${key}`),
  update: (key, value) => api.put(`/settings/${key}`, { value }),
  updateMultiple: (data) => api.put('/settings', data),
};

// Audit Logs API
export const auditLogsAPI = {
  getAll: (params) => api.get('/audit-logs', { params }),
  getByUser: (userId) => api.get(`/audit-logs/user/${userId}`),
  getByTable: (table) => api.get(`/audit-logs/table/${table}`),
  export: (params) => api.get('/audit-logs/export', { params }),
};

// Backup API
export const backupAPI = {
  create: () => api.post('/backup/create'),
  list: () => api.get('/backup/list'),
  download: (filename) => {
    window.open(`${API_BASE_URL}/backup/download?filename=${filename}`, '_blank');
  },
  delete: (filename) => api.delete(`/backup/${filename}`),
};
