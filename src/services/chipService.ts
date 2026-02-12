// frontend/src/services/chipService.ts
import apiClient from './apiClient';

const chipService = {
    // get weekly plan
    getWeeklyPlan: async (week: number, year: number) => {
        const response = await apiClient.get(`/chip-orders/weekly-plan`, {
            params: { week, year }
        });
        return response.data;
    },

    // create new order
    createOrder: async (orderData: any) => {
        const response = await apiClient.post(`/chip-orders/orders`, orderData);
        return response.data;
    },

    // Load delete
    deleteLoad: async (loadId: number) => {
        const response = await apiClient.delete(`/chip-planning/delete-load/${loadId}`);
        return response.data;
    },
    // Load update
    updateLoad: async (loadId: number, data: any) => {
        const response = await apiClient.patch(`/chip-planning/update-load/${loadId}`, data);
        return response.data;
    },

    // get active orders
    getActiveOrders: async () => {
        const response = await apiClient.get(`/chip-orders/active-orders`);
        return response.data;
    },

    // schedule load
    scheduleLoad: async (loadData: any) => {
        const response = await apiClient.post(`/chip-orders/schedule-load`, loadData);
        return response.data;
    },

    // get weekly planning data
    getWeeklyPlanning: async (week: number, year: number, shift: string) => {
        const response = await apiClient.get(`/chip-planning/weekly-view`, {
            params: { week, year, shift }
        });
        return response.data;
    },
    // assign vehicle to title 
    assignTitle: async (payload: { program_id: number, title_id: number, order_id?: number | null, pvm: string, shift_type: string }) => {
        const response = await apiClient.post(`/chip-planning/assign`, payload);
        return response.data;
    },

    //  update program driver
    dispatchRow: async (programId: number) => {
        const response = await apiClient.post(`/chip-planning/dispatch-row`, { programId });
        return response.data;
    },
    updateProgramDriver: async (programId: number, driverId: number) => {
        const response = await apiClient.patch(`/chip-planning/update-driver`, { programId, driverId });
        return response.data;
    },
    addVehicleToPlan: async (payload: { vehicleId: number, week: number, year: number }) => {
        const response = await apiClient.post(`/chip-planning/add-vehicle`, payload);
        return response.data;
    },
    moveLoad: async (payload: { loadId: number, newProgramId: number, newDate: string }) => {
        const response = await apiClient.patch(`/chip-planning/move-load`, payload);
        return response.data;
    }
};

export default chipService;