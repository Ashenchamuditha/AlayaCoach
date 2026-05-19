import axios from "axios";

export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "development"
    ? "http://localhost:8081/api"
    : `${window.location.protocol}//${window.location.hostname}:8081/api`);

if (!import.meta.env.VITE_API_URL) {
  if (import.meta.env.PROD) {
    console.error(
      "CRITICAL: VITE_API_URL is NOT defined! The app will likely fail to connect to the backend. " +
      "Please set VITE_API_URL in your Vercel/deployment environment variables."
    );
  } else {
    console.warn("VITE_API_URL is NOT defined. Falling back to localhost for development.");
  }
}

console.log("API_BASE initialized as:", API_BASE);

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
