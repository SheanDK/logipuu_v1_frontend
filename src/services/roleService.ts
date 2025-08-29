// frontend/src/services/roleService.ts
import apiClient from './apiClient';
import { IRole, IPermission } from '../types';

const API_ENDPOINT = '/role-permissions';

/**
 * Fetches a simple list of all available roles (ID and Name).
 * Used for populating dropdowns in forms.
 * @returns A promise that resolves to an array of roles.
 */
export const fetchAllRolesApi = async (): Promise<IRole[]> => {
    const response = await apiClient.get<IRole[]>(`${API_ENDPOINT}/roles`);
    return response.data;
};

/**
 * Fetches all roles along with their assigned permission IDs.
 * Used for the main Role & Permission settings page.
 * @returns A promise that resolves to an array of roles with permission details.
 */
export const fetchRolesAndPermissions = async (): Promise<IRole[]> => {
    const response = await apiClient.get<IRole[]>(`${API_ENDPOINT}/roles-with-permissions`);
    return response.data;
};

/**
 * Fetches all available permissions in the system.
 * @returns A promise that resolves to an array of permissions.
 */
export const fetchAllPermissions = async (): Promise<IPermission[]> => {
    const response = await apiClient.get<IPermission[]>(`${API_ENDPOINT}/permissions`);
    return response.data;
};

/**
 * Updates the permissions for a specific role.
 * @param roleId - The ID of the role to update.
 * @param permissionIds - An array of numbers representing the new set of permission IDs.
 * @returns A promise that resolves with the backend's success response.
 */
export const updatePermissionsForRole = async (roleId: number, permissionIds: number[]): Promise<any> => {
    const payload = { permissionIds };
    const response = await apiClient.put(`${API_ENDPOINT}/roles/${roleId}/permissions`, payload);
    return response.data;
};