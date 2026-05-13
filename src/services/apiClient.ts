
// frontend/src/services/apiClient.ts
import axios, { AxiosHeaders } from 'axios';
const getApiBaseUrl = (): string => {
    const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    
    if (typeof window !== 'undefined') {
        const storedUrl = localStorage.getItem('apiBaseUrl');
        return storedUrl || envUrl || 'http://localhost:5000';
    }
    return envUrl || 'http://localhost:5000';
};

const apiClient = axios.create({
    baseURL: `${getApiBaseUrl()}/api`,
    withCredentials: true 
});

apiClient.interceptors.request.use(
    (config) => {
        if (!config.headers) {
            config.headers = new AxiosHeaders();
        }
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers.set('Authorization', `Bearer ${token}`);
            }
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;


// // frontend/src/services/apiClient.ts
// import axios, { AxiosHeaders } from 'axios'; // FIX: Import AxiosHeaders

// const getApiBaseUrl = (): string => {
//     if (typeof window === 'undefined') {
//         return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
//     }
//     try {
//         const storedUrl = localStorage.getItem('apiBaseUrl');
//         return storedUrl || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
//     } catch (error) {
//         console.warn("Could not access localStorage. Falling back to default API URL.", error);
//         return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
//     }
// };

// const apiClient = axios.create({
//     baseURL: `${getApiBaseUrl()}/api`,
// });

// apiClient.interceptors.request.use(
//     (config) => {
//         const baseUrl = getApiBaseUrl();
//         config.baseURL = `${baseUrl}/api`;

//         // Ensure config.headers is a valid AxiosHeaders object.
//         if (!config.headers) {
//             // FIX: Initialize with a new AxiosHeaders instance instead of a plain object.
//             config.headers = new AxiosHeaders();
//         }

//         if (typeof window !== 'undefined') {
//             const token = localStorage.getItem('authToken');
//             if (token) {
//                 // Use the .set() method, which is the standard way to add headers.
//                 config.headers.set('Authorization', `Bearer ${token}`);
//             }
//         }
        
//         return config;
//     },
//     (error) => {
//         return Promise.reject(error);
//     }
// );

// export default apiClient;