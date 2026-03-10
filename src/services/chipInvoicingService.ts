// frontend/src/services/chipInvoicingService.ts

import apiClient from './apiClient';

const chipInvoicingService = {
    // Search for Invoicing
    search: async (params: any) => {
        const response = await apiClient.get('/chip-invoicing/search', { params });
        return response.data;
    },
    // Mark selected Loads as Billed
    markAsBilled: async (loadIds: number[]) => {
        const response = await apiClient.post('/chip-invoicing/invoice-selected', { loadIds });
        return response.data;
    }
};

export default chipInvoicingService;