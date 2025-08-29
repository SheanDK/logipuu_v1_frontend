// frontend/src/services/apiClient.ts
import axios from 'axios';

// Create an Axios instance with a base URL from environment variables.
const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to automatically add the auth token to every request.
apiClient.interceptors.request.use(
    (config) => {
        // Only run this code in the browser environment.
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('authToken');
            if (token && config.headers) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => response, // Pass through successful responses
    (error) => {
        // --- ENHANCED ERROR HANDLING ---
        let errorMessage = 'An unexpected error occurred.';

        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            errorMessage = error.response.data?.message || `Error: ${error.response.status} ${error.response.statusText}`;
            console.error('API Error Response:', error.response.data);

            if (error.response.status === 401) {
                console.error("Authentication error. Redirecting to login.");
                // In a real app, you might call a logout function from a global state.
                localStorage.removeItem('authToken');
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
            }
        } else if (error.request) {
            // The request was made but no response was received
            errorMessage = 'No response from server. Please check your network connection.';
            console.error('API No Response:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            errorMessage = error.message;
            console.error('API Request Setup Error:', error.message);
        }
        
        // Instead of just rejecting the error, we can augment it with a user-friendly message
        error.message = errorMessage;
        return Promise.reject(error);
    }
);

export default apiClient;