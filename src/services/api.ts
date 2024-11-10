import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout
  timeout: 10000,
  // Enable retries
  validateStatus: function (status) {
    return status >= 200 && status < 300;
  }
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Retry failed requests up to 2 times
    const { config } = error;
    if (!config || !config.retry) {
      config.retry = 0;
    }

    if (config.retry < 2) {
      config.retry += 1;
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(api(config));
        }, 1000 * config.retry); // Progressive delay
      });
    }

    return Promise.reject(error);
  }
);

export const projectService = {
  getProjects: (category: string) => api.get(`/projects/${category}`),
  addProject: (data: any) => api.post('/projects', data),
  updateProject: (id: string, data: any) => api.put(`/projects/${id}`, data),
  deleteProject: (id: string) => api.delete(`/projects/${id}`),
};

export const authService = {
  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login', credentials),
};

export const contactService = {
  submit: (data: any) => api.post('/contact', data),
};