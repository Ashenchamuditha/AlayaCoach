import axios from "axios";

export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "development"
    ? "http://localhost:8081/api"
    : "https://alayacoach-production.up.railway.app/api"); // Hardcoded fallback for production if Vercel fails to pass the variable

if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
  console.warn(
    "VITE_API_URL was not found in environment. Using hardcoded production fallback: https://alayacoach-production.up.railway.app/api",
  );
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

  // Ensure path starts with / and root does not end with /
  const cleanRoot = root.endsWith("/") ? root.slice(0, -1) : root;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${cleanRoot}${cleanPath}`;
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
