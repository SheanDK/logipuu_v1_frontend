// frontend/src/services/authService.ts
import apiClient from './apiClient';
import { UserLoginCredentials, LoginApiResponse } from '../types/auth';

/**
 * Calls the backend API to log in a user.
 * @param credentials - The user's username and password.
 * @returns A promise that resolves with the login API response, containing the token and user data.
 */
export const loginUserApi = async (credentials: UserLoginCredentials): Promise<LoginApiResponse> => {
    const response = await apiClient.post<LoginApiResponse>('/auth/login', credentials);
    return response.data;
};