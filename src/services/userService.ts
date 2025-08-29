// frontend/src/services/userService.ts
import apiClient from './apiClient';
import { 
    IUser, 
    CreateUserPayload, 
    UpdateUserPayload, 
    IBackendUser, 
    UserProfileResponseDto, 
    UpdateUserProfilePayload, 
    ChangePasswordPayload 
} from '../types';

const ADMIN_API_ENDPOINT = '/admin/users';
const USER_API_ENDPOINT = '/users/me'; // Endpoint for the logged-in user

// --- ADMIN FUNCTIONS ---

/**
 * Fetches all users from the admin endpoint. Requires admin privileges.
 * @returns A promise that resolves to an array of raw user objects from the backend.
 */
export const getAllUsersApi = async (): Promise<IBackendUser[]> => {
    const response = await apiClient.get<IBackendUser[]>(ADMIN_API_ENDPOINT);
    return response.data;
};

/**
 * Creates a new user. Requires admin privileges.
 * @param userData The payload containing the new user's details.
 * @returns A promise that resolves to the newly created user object (IUser format).
 */
export const createUserApi = async (userData: CreateUserPayload): Promise<IUser> => {
    const response = await apiClient.post<IUser>(ADMIN_API_ENDPOINT, userData);
    return response.data;
};

/**
 * Updates an existing user's details. Requires admin privileges.
 * @param username The username of the user to update.
 * @param updateData The payload with the fields to update.
 * @returns A promise that resolves to the updated user object (IUser format).
 */
export const updateUserApi = async (username: string, updateData: UpdateUserPayload): Promise<IUser> => {
    const response = await apiClient.put<IUser>(`${ADMIN_API_ENDPOINT}/${username}`, updateData);
    return response.data;
};

/**
 * Deletes a user. Requires admin privileges.
 * @param username The username of the user to delete.
 * @returns A promise that resolves with a success message from the backend.
 */
export const deleteUserApi = async (username:string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`${ADMIN_API_ENDPOINT}/${username}`);
    return response.data;
};

// --- NEW USER-SPECIFIC FUNCTIONS ---

/**
 * Fetches the profile of the currently logged-in user.
 */
export const fetchMyProfileApi = async (): Promise<UserProfileResponseDto> => {
    const response = await apiClient.get<UserProfileResponseDto>(`${USER_API_ENDPOINT}/profile`);
    return response.data;
};

/**
 * Updates the profile of the currently logged-in user.
 */
export const updateMyProfileApi = async (profileData: UpdateUserProfilePayload): Promise<{ message: string, profile: UserProfileResponseDto }> => {
    const response = await apiClient.put<{ message: string, profile: UserProfileResponseDto }>(`${USER_API_ENDPOINT}/profile`, profileData);
    return response.data;
};

/**
 * Changes the password for the currently logged-in user.
 */
export const changeMyPasswordApi = async (passwordData: ChangePasswordPayload): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`${USER_API_ENDPOINT}/change-password`, passwordData);
    return response.data;
};