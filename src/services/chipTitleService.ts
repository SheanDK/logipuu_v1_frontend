//frontend/src/services/chipTitleService.ts

import apiClient from './apiClient';

export const chipTitleService = {
    getAll: async () => {
        const response = await apiClient.get('/chip-titles');
        return response.data;
    },
    create: async (data: any) => {
        const response = await apiClient.post('/chip-titles', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await apiClient.patch(`/chip-titles/${id}`, data);
        return response.data;
    }
};