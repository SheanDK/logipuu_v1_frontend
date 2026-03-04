// frontend/src/services/chipService.ts
import apiClient from './apiClient';

const chipService = {
    // Unified create/update for chip loads
    setLoad: async (payload: any) => {
        const response = await apiClient.post(`/chip-planning/set-load`, payload);
        return response.data;
    },

    // Driver chip loads
    getDriverLoads: async (params?: {
        vehicleNumber?: number;
        startDate?: string;
        endDate?: string;
        week?: number;
        year?: number;
        ts?: number;
    }) => {
        const response = await apiClient.get(`/chip-planning/loads`, {
            params: params || undefined
        });
        return response.data;
    },

    // 1. Get Weekly Plan
    getWeeklyPlanning: async (week: number, year: number) => {
        const response = await apiClient.get(`/chip-planning/weekly-view`, {
            params: { week, year }
        });
        return response.data;
    },

    // 2. Assign Title
    assignTitle: async (payload: { kalusto_nro: number, title_id: number, order_id?: number | null, pvm: string }) => {
        const response = await apiClient.post(`/chip-planning/assign`, payload);
        return response.data;
    },

    // 2b. Schedule Load
    scheduleLoad: async (payload: {
        kalusto_nro: number;
        order_id: number;
        pvm: string;
        lahto_paikka: number;
        purku_paikka: number;
        planned_m3: number;
    }) => {
        const response = await apiClient.post(`/chip-planning/schedule-load`, payload);
        return response.data;
    },

    // 3. Move Load
    moveLoad: async (payload: { loadId: number, newKalustoNro: number, newDate: string }) => {
        const response = await apiClient.patch(`/chip-planning/move-load`, payload);
        return response.data;
    },

    // 4. Dispatch Row
    dispatchRow: async (kalustoNro: number, week: number, year: number) => {
        const response = await apiClient.post(`/chip-planning/dispatch-row`, {
            kalustoNro,
            week,
            year
        });
        return response.data;
    },
    // 5. Load update
    updateLoad: async (loadId: number, data: any) => {
        const response = await apiClient.put(`/chip-planning/load/${loadId}`, data);
        return response.data;
    },

    // 6. Load delete
    deleteLoad: async (loadId: number) => {
        const response = await apiClient.delete(`/chip-planning/delete-load/${loadId}`);
        return response.data;
    },

    // --- Subscriptions (Orders) ---
    getActiveOrders: async () => apiClient.get(`/chip-orders/active-orders`).then(r => r.data),
    createOrder: async (orderData: any) => apiClient.post(`/chip-orders/orders`, orderData).then(r => r.data),
    updateOrder: async (id: number, data: any) => apiClient.put(`/chip-orders/orders/${id}`, data).then(r => r.data),
    deleteOrder: async (id: number) => apiClient.delete(`/chip-orders/orders/${id}`).then(r => r.data),
};

export default chipService;
