import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    timeout: 60000, // Increase timeout to 60 seconds for large file uploads
    maxContentLength: 50 * 1024 * 1024, // 50MB
    maxBodyLength: 50 * 1024 * 1024, // 50MB
    withCredentials: true // Enable credentials
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Check both localStorage and sessionStorage for token
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            // Also set the default header for all future requests
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            console.log('Adding token to request:', {
                url: config.url,
                method: config.method,
                hasToken: !!token,
                headers: config.headers
            });
        } else {
            console.log('No token found for request:', {
                url: config.url,
                method: config.method
            });
            // Clear the default header if no token is found
            delete api.defaults.headers.common['Authorization'];
        }
        // Don't set Content-Type for FormData, let the browser set it with the boundary
        if (!(config.data instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
        }

        // Add retry logic for network errors
        config.retry = 3;
        config.retryDelay = 1000;

        return config;
    },
    (error) => {
        console.error('Request interceptor error:', {
            error: error.message,
            config: error.config
        });
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;

        // Log detailed error information
        console.error('API Error Details:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
            headers: error.config?.headers,
            requestHeaders: error.request?.headers,
            responseHeaders: error.response?.headers
        });

        // If there's no config or we've already retried, reject
        if (!config || !config.retry) {
            return Promise.reject(error);
        }

        // Set retry count
        config.retryCount = config.retryCount || 0;

        // Check if we should retry
        if (config.retryCount < config.retry) {
            config.retryCount += 1;

            // Create new promise with exponential backoff
            const backoff = new Promise(resolve => {
                setTimeout(() => {
                    resolve();
                }, config.retryDelay * config.retryCount);
            });

            // Wait for backoff and retry
            await backoff;
            return api(config);
        }

        if (error.response?.status === 401) {
            // Only clear token and redirect if it's not a login attempt
            if (!error.config.url.includes('/api/auth/login')) {
                console.log('Clearing tokens due to 401 error');
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api; 