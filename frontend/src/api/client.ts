import axios from "axios";

// API 기본 설정
const API_BASE_URL = "http://localhost:3300";

// Axios 기본 설정
axios.defaults.baseURL = API_BASE_URL;

// 요청 인터셉터 (옵션)
axios.interceptors.request.use(
  (config) => {
    // 요청 전에 수행할 작업
    console.log(
      `Making ${config.method?.toUpperCase()} request to: ${config.url}`
    );
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 (옵션)
axios.interceptors.response.use(
  (response) => {
    // 응답 데이터 처리
    return response;
  },
  (error) => {
    // 응답 에러 처리
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export { axios };
