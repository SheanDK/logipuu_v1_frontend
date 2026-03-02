// frontend/src/services/chipTitleService.ts
import apiClient from './apiClient';

export const chipTitleService = {
    getAll: async () => apiClient.get('/chip-titles').then(r => r.data),
    create: async (data: any) => apiClient.post('/chip-titles', data).then(r => r.data),
    update: async (id: number, data: any) => apiClient.patch(`/chip-titles/${id}`, data).then(r => r.data),
};

export default chipTitleService;
