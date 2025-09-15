import axios from "axios";

const URL = process.env.REACT_APP_SERVER_URL || "https://teamsphere-server-production.up.railway.app/";
const api = axios.create({
    baseURL: URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    },
});

// 쿠키에서 토큰 읽기 함수
const getCookieValue = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

// Axios 요청 인터셉터 - 모든 요청에 JWT 토큰 추가 (쿠키에서)
api.interceptors.request.use(
  (config) => {
    const token = getCookieValue('accesstoken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Axios 응답 인터셉터 - 401 오류 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      return;
    }
    return Promise.reject(error);
  }
);

export default api;
