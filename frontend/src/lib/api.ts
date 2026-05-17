import axios from "axios";

export const API_BASE =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8081/api`
    : "http://localhost:8081/api";

export const api = axios.create({
  baseURL: API_BASE,
});

export const getMediaUrl = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  // Remove trailing /api if present to get the root server URL
  const root = API_BASE.replace(/\/api\/?$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${root}${cleanPath}`;
};

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("alaya_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("alaya_token");
      localStorage.removeItem("alaya_user");
    }
    return Promise.reject(err);
  },
);
