// frontend/src/services/chipInvoicingService.ts

import apiClient from './apiClient';

const chipInvoicingService = {
    search: async (params: any) => {
        const response = await apiClient.get('/chip-planning/invoicing/search', { params });
        return response.data;
    },

    markAsBilled: async (loadIds: number[]) => {
        const response = await apiClient.post('/chip-planning/invoicing/confirm', { loadIds });
        return response.data;
    }
};

export default chipInvoicingService;