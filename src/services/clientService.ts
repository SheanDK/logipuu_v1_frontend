// frontend/src/services/clientService.ts
import apiClient from './apiClient';
import { IBackendClient, ICreateClientDto, IUpdateClientDto, IClient, IClientBasicInfo } from '../types';

const API_ENDPOINT = '/clients';

export const fetchAllClients = async (): Promise<IBackendClient[]> => {
    const response = await apiClient.get<IBackendClient[]>(API_ENDPOINT);
    return response.data;
};

export const createClient = async (data: ICreateClientDto): Promise<IBackendClient> => {
    const response = await apiClient.post<IBackendClient>(API_ENDPOINT, data);
    return response.data;
};

export const updateClient = async (clientId: string, data: IUpdateClientDto): Promise<IBackendClient> => {
    const response = await apiClient.put<IBackendClient>(`${API_ENDPOINT}/${clientId}`, data);
    return response.data;
};

export const deleteClient = async (clientId: string): Promise<{ deletedClientId: number; message: string } | null> => {
    const response = await apiClient.delete<{ deletedClientId: number; message: string }>(`${API_ENDPOINT}/${clientId}`);
    return response.data;
};

// --- KEY CORRECTION IS HERE ---
export const checkTargetColorExists = async (color: string, clientId?: string): Promise<boolean> => {
    try {
        const response = await apiClient.get<boolean>(`${API_ENDPOINT}/check-color`, {
            params: {
                color: color,
                // Axios will omit the `clientId` param if it is undefined, which is what we want.
                clientId: clientId, 
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error checking color existence:", error);
        return false; 
    }
};

export const fetchClientsListApi = async (): Promise<IClientBasicInfo[]> => {
    const allBackendClients: IBackendClient[] = await fetchAllClients();
    return allBackendClients.map(client => ({
        id: String(client.asiakkaanId),
        name: client.asiakkaanNimi,
        clientId: String(client.asiakkaanId),
        clientName: client.asiakkaanNimi,
        targetColor: client.kohteenVari,
    }));
};