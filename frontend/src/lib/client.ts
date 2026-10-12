import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

const API_BASE_URL =
  "http://127.0.0.1:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
});

/*
|--------------------------------------------------------------------------
| Authentication endpoints
|--------------------------------------------------------------------------
| These endpoints must NEVER receive an old JWT.
|--------------------------------------------------------------------------
*/

const NO_AUTH_ENDPOINTS = [
  "/auth/token/",
  "/auth/token/refresh/",
];

/*
|--------------------------------------------------------------------------
| Public GET endpoints
|--------------------------------------------------------------------------
*/

const PUBLIC_GET_ENDPOINTS = [
  "/products/",
  "/categories/",
];

/*
|--------------------------------------------------------------------------
| Get stored authentication
|--------------------------------------------------------------------------
*/

function getAuth() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedAuth =
    localStorage.getItem(
      "trademarket-auth"
    );

  if (!storedAuth) {
    return null;
  }

  try {
    return JSON.parse(storedAuth);
  } catch {
    return null;
  }
}

/*
|--------------------------------------------------------------------------
| Save authentication
|--------------------------------------------------------------------------
*/

function saveAuth(auth: any) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    "trademarket-auth",
    JSON.stringify(auth)
  );
}

/*
|--------------------------------------------------------------------------
| Clear authentication
|--------------------------------------------------------------------------
*/

function clearAuth() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    "trademarket-auth"
  );
}

/*
|--------------------------------------------------------------------------
| Check authentication endpoint
|--------------------------------------------------------------------------
*/

function isNoAuthEndpoint(
  url: string
) {
  return NO_AUTH_ENDPOINTS.some(
    (endpoint) =>
      url === endpoint ||
      url.startsWith(endpoint)
  );
}

/*
|--------------------------------------------------------------------------
| Check public GET endpoint
|--------------------------------------------------------------------------
*/

function isPublicGet(
  method: string | undefined,
  url: string
) {
  return (
    method?.toLowerCase() === "get" &&
    PUBLIC_GET_ENDPOINTS.some(
      (endpoint) =>
        url === endpoint ||
        url.startsWith(endpoint)
    )
  );
}

/*
|--------------------------------------------------------------------------
| REQUEST INTERCEPTOR
|--------------------------------------------------------------------------
*/

api.interceptors.request.use(
  (
    config: InternalAxiosRequestConfig
  ) => {
    const url =
      config.url || "";

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT: FormData / Image Upload
    |--------------------------------------------------------------------------
    |
    | When sending FormData, DO NOT send:
    |
    | Content-Type: application/json
    |
    | The browser must create:
    |
    | multipart/form-data; boundary=...
    |
    | Otherwise Django may report:
    |
    | "The submitted data was not a file."
    |
    |--------------------------------------------------------------------------
    */

    if (
      typeof FormData !== "undefined" &&
      config.data instanceof FormData
    ) {
      if (config.headers) {
        delete config.headers[
          "Content-Type"
        ];

        delete config.headers[
          "content-type"
        ];
      }
    } else {
      /*
      |--------------------------------------------------------------------------
      | Normal JSON requests
      |--------------------------------------------------------------------------
      */

      if (config.headers) {
        config.headers[
          "Content-Type"
        ] = "application/json";
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Authentication endpoints
    |--------------------------------------------------------------------------
    */

    if (isNoAuthEndpoint(url)) {
      if (config.headers) {
        delete config.headers.Authorization;
      }

      return config;
    }

    /*
    |--------------------------------------------------------------------------
    | Public GET requests
    |--------------------------------------------------------------------------
    */

    if (
      isPublicGet(
        config.method,
        url
      )
    ) {
      if (config.headers) {
        delete config.headers.Authorization;
      }

      return config;
    }

    /*
    |--------------------------------------------------------------------------
    | Add access token
    |--------------------------------------------------------------------------
    */

    const auth = getAuth();
    const accessToken = auth?.state?.accessToken;

    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },

  (error) =>
    Promise.reject(error)
);

/*
|--------------------------------------------------------------------------
| JWT REFRESH STATE
|--------------------------------------------------------------------------
*/

let refreshing = false;

let waitingRequests: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

/*
|--------------------------------------------------------------------------
| Process waiting requests
|--------------------------------------------------------------------------
*/

function processQueue(
  error: any,
  token: string | null
) {
  waitingRequests.forEach(
    ({
      resolve,
      reject,
    }) => {
      if (error) {
        reject(error);
      } else if (token) {
        resolve(token);
      }
    }
  );

  waitingRequests = [];
}

/*
|--------------------------------------------------------------------------
| RESPONSE INTERCEPTOR
|--------------------------------------------------------------------------
*/

api.interceptors.response.use(
  (response) => response,

  async (
    error: AxiosError
  ) => {
    const originalRequest =
      error.config as
        | (InternalAxiosRequestConfig & {
            _retry?: boolean;
          })
        | undefined;

    if (!originalRequest) {
      return Promise.reject(
        error
      );
    }

    const status =
      error.response?.status;

    const url =
      originalRequest.url || "";

    /*
    |--------------------------------------------------------------------------
    | Never refresh authentication requests
    |--------------------------------------------------------------------------
    */

    if (
      isNoAuthEndpoint(url)
    ) {
      return Promise.reject(
        error
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Only refresh on 401
    |--------------------------------------------------------------------------
    */

    if (status !== 401) {
      return Promise.reject(
        error
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent infinite retry
    |--------------------------------------------------------------------------
    */

    if (
      originalRequest._retry
    ) {
      return Promise.reject(
        error
      );
    }

    originalRequest._retry = true;

    /*
    |--------------------------------------------------------------------------
    | Get refresh token
    |--------------------------------------------------------------------------
    */

    const auth = getAuth();

    const refreshToken =
      auth?.state?.refreshToken;

    if (!refreshToken) {
      clearAuth();

      return Promise.reject(
        error
      );
    }

    /*
    |--------------------------------------------------------------------------
    | If another request is already refreshing
    |--------------------------------------------------------------------------
    */

    if (refreshing) {
      return new Promise(
        (
          resolve,
          reject
        ) => {
          waitingRequests.push({
            resolve,
            reject,
          });
        }
      ).then(
        (newToken) => {
          originalRequest.headers.Authorization =
            `Bearer ${newToken}`;

          return api(
            originalRequest
          );
        }
      );
    }

    refreshing = true;

    try {
      /*
      |--------------------------------------------------------------------------
      | Refresh JWT
      |--------------------------------------------------------------------------
      |
      | Use plain axios instead of `api`.
      | This prevents the expired access token
      | from being attached to the refresh request.
      |--------------------------------------------------------------------------
      */

      const refreshResponse =
        await axios.post(
          `${API_BASE_URL}/auth/token/refresh/`,
          {
            refresh:
              refreshToken,
          },
          {
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

      const newAccessToken =
        refreshResponse.data?.access;

      const newRefreshToken =
        refreshResponse.data?.refresh;

      if (!newAccessToken) {
        throw new Error(
          "No access token was returned from the refresh endpoint."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Update authentication
      |--------------------------------------------------------------------------
      */

      const updatedAuth = {
        ...auth,

        state: {
          ...auth.state,

          accessToken:
            newAccessToken,

          refreshToken:
            newRefreshToken ||
            auth.state
              .refreshToken,
        },
      };

      saveAuth(updatedAuth);

      /*
      |--------------------------------------------------------------------------
      | Release queued requests
      |--------------------------------------------------------------------------
      */

      processQueue(
        null,
        newAccessToken
      );

      /*
      |--------------------------------------------------------------------------
      | Retry original request
      |--------------------------------------------------------------------------
      */

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return api(
        originalRequest
      );
    } catch (
      refreshError
    ) {
      processQueue(
        refreshError,
        null
      );

      clearAuth();

      if (
        typeof window !==
        "undefined"
      ) {
        window.location.href =
          "/login";
      }

      return Promise.reject(
        refreshError
      );
    } finally {
      refreshing = false;
    }
  }
);

export default api;