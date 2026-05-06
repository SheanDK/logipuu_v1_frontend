// frontend/src/services/chipInvoicingService.ts
import apiClient from './apiClient';

const chipInvoicingService = {
    search: async (params: any) => {
        const { data } = await apiClient.get('/chip-invoicing/search', { params });
        return data;
    },
    confirm: async (loadIds: number[]) => {
        const { data } = await apiClient.post('/chip-invoicing/confirm', { loadIds });
        return data;
    },
    update: async (id: number, payload: any) => {
        const { data } = await apiClient.patch(`/chip-invoicing/load/${id}`, payload);
        return data;
    }
};

export default chipInvoicingService;