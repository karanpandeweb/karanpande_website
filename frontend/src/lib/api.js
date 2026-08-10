import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
export const API = `${BACKEND_URL}/api`;

const TOKEN_KEY = "kp_admin_token";

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && error?.config?.url?.startsWith("/admin/")) auth.clear();
    return Promise.reject(error);
  }
);

export const auth = {
  setToken: (t) => localStorage.setItem(TOKEN_KEY, t),
  getToken: () => localStorage.getItem(TOKEN_KEY),
  clear: () => localStorage.removeItem(TOKEN_KEY),
  isAuthed: () => !!localStorage.getItem(TOKEN_KEY),
};

export async function login(username, password) {
  const { data } = await api.post("/admin/login", { username, password });
  auth.setToken(data.token);
  return data;
}

// A successful reset signs the admin straight in, so the spent recovery
// code is never a dead end for someone already locked out.
export async function resetPassword(username, recoveryCode, newPassword) {
  const { data } = await api.post("/admin/password/reset", {
    username,
    recovery_code: recoveryCode,
    new_password: newPassword,
  });
  auth.setToken(data.token);
  return data;
}

export const fetchRecoveryStatus = () => api.get(`/admin/recovery-code`).then((r) => r.data);
export const generateRecoveryCode = () => api.post(`/admin/recovery-code`).then((r) => r.data);

// Media
export const fetchMedia = (category) => api.get(`/media/${category}`).then((r) => r.data);
export const fetchAllMedia = () => api.get(`/media`).then((r) => r.data);
export const createMedia = (payload) => api.post(`/admin/media`, payload).then((r) => r.data);
export const updateMedia = (id, payload) => api.put(`/admin/media/${id}`, payload).then((r) => r.data);
export const deleteMedia = (id) => api.delete(`/admin/media/${id}`).then((r) => r.data);

// Albums
export const fetchAlbums = (category) => api.get(`/albums/${category}`).then((r) => r.data);
export const fetchAllAlbums = () => api.get(`/albums`).then((r) => r.data);
export const fetchAlbumBySlug = (category, slug) => api.get(`/albums/${category}/${slug}`).then((r) => r.data);
export const createAlbum = (payload) => api.post(`/admin/albums`, payload).then((r) => r.data);
export const updateAlbum = (id, payload) => api.put(`/admin/albums/${id}`, payload).then((r) => r.data);
export const deleteAlbum = (id) => api.delete(`/admin/albums/${id}`).then((r) => r.data);

// Testimonials
export const fetchTestimonials = () => api.get(`/testimonials`).then((r) => r.data);
export const createTestimonial = (payload) => api.post(`/admin/testimonials`, payload).then((r) => r.data);
export const updateTestimonial = (id, payload) => api.put(`/admin/testimonials/${id}`, payload).then((r) => r.data);
export const deleteTestimonial = (id) => api.delete(`/admin/testimonials/${id}`).then((r) => r.data);

// Settings
export const fetchSettings = () => api.get(`/settings`).then((r) => r.data);
export const updateSettings = (payload) => api.put(`/admin/settings`, payload).then((r) => r.data);

async function optimizeImageForUpload(file) {
  if (!file?.type?.startsWith("image/") || file.size <= 3.5 * 1024 * 1024) return file;

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("This photograph could not be prepared for upload."));
      element.src = sourceUrl;
    });

    const maxEdge = 2400;
    const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);

    let quality = 0.88;
    let blob;
    do {
      blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      quality -= 0.1;
    } while (blob && blob.size > 3.5 * 1024 * 1024 && quality >= 0.48);

    if (!blob) throw new Error("This browser could not prepare the photograph for upload.");
    const name = file.name.replace(/\.[^.]+$/, "") || "photograph";
    return new File([blob], `${name}.webp`, { type: "image/webp" });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export async function uploadImage(file, onProgress) {
  const optimizedFile = await optimizeImageForUpload(file);
  const body = new FormData();
  body.append("file", optimizedFile);
  const { data } = await api.post("/admin/upload", body, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (event.total && onProgress) onProgress(Math.round((event.loaded / event.total) * 100));
    },
  });
  return data.url.startsWith("http") ? data.url : `${BACKEND_URL}${data.url}`;
}

export async function verifyAdmin() {
  try {
    await api.get(`/admin/me`);
    return true;
  } catch {
    auth.clear();
    return false;
  }
}
