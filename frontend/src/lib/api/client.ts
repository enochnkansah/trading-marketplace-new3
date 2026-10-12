import axios from "axios";

import { API_BASE_URL } from "@/lib/config";

const api = axios.create({
  baseURL: API_BASE_URL,
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
            config.headers.Authorization =
              `Bearer ${accessToken}`;
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