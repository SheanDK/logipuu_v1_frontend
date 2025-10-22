// frontend/src/services/apiClient.ts
import axios from 'axios';

const getApiBaseUrl = (): string => {
    // This function safely gets the URL, even during Server-Side Rendering where localStorage is not available.
    if (typeof window === 'undefined') {
        return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
    }
    try {
        const storedUrl = localStorage.getItem('apiBaseUrl');
        return storedUrl || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
    } catch (error) {
        console.warn("Could not access localStorage. Falling back to default API URL.", error);
        return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
    }
};

const apiClient = axios.create({
    // The initial baseURL is set here but will be updated by the interceptor before each request.
    baseURL: `${getApiBaseUrl()}/api`,
});

apiClient.interceptors.request.use(
    (config) => {
        // Always set the most up-to-date baseURL before the request is sent.
        config.baseURL = `${getApiBaseUrl()}/api`;

        // --- THE FIX IS HERE ---
        // Ensure config.headers is defined before trying to set a property on it.
        if (!config.headers) {
            config.headers = {};
        }

        // Safely get the token and add it to the headers.
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;