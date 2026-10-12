import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const storedAuth = localStorage.getItem(
        "trademarket-auth"
      );

      if (storedAuth) {
        try {
          const auth = JSON.parse(storedAuth);

          const accessToken = auth?.state?.accessToken;

          if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
          }
        } catch (error) {
          console.error(
            "Unable to read authentication data:",
            error
          );
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;