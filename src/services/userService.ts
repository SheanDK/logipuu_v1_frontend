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
const USER_API_ENDPOINT = '/users/me';

export const getAllUsersApi = async (): Promise<IBackendUser[]> => {
    const response = await apiClient.get<IBackendUser[]>(ADMIN_API_ENDPOINT);
    return response.data;
};

export const fetchUserByTunnusApi = async (tunnus: string): Promise<IBackendUser> => {
    const response = await apiClient.get<IBackendUser>(
        `${ADMIN_API_ENDPOINT}/${encodeURIComponent(tunnus)}`
    );
    console.log('[fetchUserByTunnusApi] status:', response.status, 'data:', response.data);
    return response.data;
};


export const createUserApi = async (userData: CreateUserPayload): Promise<IUser> => {
    const response = await apiClient.post<IUser>(ADMIN_API_ENDPOINT, userData);
    return response.data;
};

export const updateUserApi = async (username: string, updateData: UpdateUserPayload): Promise<IUser> => {
    const response = await apiClient.put<IUser>(`${ADMIN_API_ENDPOINT}/${username}`, updateData);
    return response.data;
};

export const deleteUserApi = async (username: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`${ADMIN_API_ENDPOINT}/${username}`);
    return response.data;
};

export const fetchMyProfileApi = async (): Promise<UserProfileResponseDto> => {
    const response = await apiClient.get<UserProfileResponseDto>(`${USER_API_ENDPOINT}/profile`);
    return response.data;
};

export const updateMyProfileApi = async (profileData: UpdateUserProfilePayload): Promise<{ message: string, profile: UserProfileResponseDto }> => {
    const response = await apiClient.put<{ message: string, profile: UserProfileResponseDto }>(`${USER_API_ENDPOINT}/profile`, profileData);
    return response.data;
};

export const changeMyPasswordApi = async (passwordData: ChangePasswordPayload): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`${USER_API_ENDPOINT}/change-password`, passwordData);
    return response.data;
};

export const updateCurrentVehicleApi = async (vehicleId: number | null):
    Promise<{ message: string, currentVehicleId: number | null }> => {

    const deviceInfo = typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown Device';

    const response = await apiClient.put<{
        message: string,
        currentVehicleId: number | null
    }>(`${USER_API_ENDPOINT}/current-vehicle`, {
        vehicleId,
        deviceInfo
    });

    return response.data;
};

