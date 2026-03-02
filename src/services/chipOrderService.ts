// frontend/src/services/chipOrderService.ts

import apiClient from './apiClient';

export const chipOrderService = {
    getActive: async () => apiClient.get('/chip-orders/active-orders').then(r => r.data),
    getActiveOrders: async () => apiClient.get('/chip-orders/active-orders').then(r => r.data),
    create: async (data: any) => apiClient.post('/chip-orders/orders', data).then(r => r.data),
    update: async (id: number, data: any) => apiClient.put(`/chip-orders/orders/${id}`, data).then(r => r.data),
    delete: async (id: number) => apiClient.delete(`/chip-orders/orders/${id}`).then(r => r.data),
    scheduleLoad: async (payload: any) => apiClient.post('/chip-orders/schedule-load', payload).then(r => r.data),
};

export default chipOrderService;