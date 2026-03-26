// frontend/src/services/chipPlanningService.ts
import apiClient from './apiClient';

export const chipPlanningService = {
    // 1. weekly planning
    getWeeklyPlanning: async (week: number, year: number) =>
        apiClient.get(`/chip-planning/weekly-view`, { params: { week, year } }).then(r => r.data),

    // 2. assign title to vehicle
    assignTitle: async (payload: any) =>
        apiClient.post(`/chip-planning/assign`, payload).then(r => r.data),

    // 3. move load
    moveLoad: async (payload: any) =>
        apiClient.patch(`/chip-planning/move-load`, payload).then(r => r.data),

    // 4. dispatch row
    dispatchRow: async (kalustoNro: number, week: number, year: number) =>
        apiClient.post(`/chip-planning/dispatch-row`, { kalustoNro, week, year }).then(r => r.data),

    // 5. update load
    updateLoad: async (loadId: number, data: any) =>
        apiClient.put(`/chip-planning/load/${loadId}`, data).then(r => r.data),

    // 6. delete load
    deleteLoad: async (loadId: number) =>
        apiClient.delete(`/chip-planning/delete-load/${loadId}`).then(r => r.data),

    // 7. rename group
    renameGroup: async (oldName: string, newName: string) =>
        apiClient.put(`/chip-planning/rename-group`, { oldName, newName }).then(r => r.data),

    // 8. delete group
    deleteGroup: async (groupName: string) =>
        apiClient.delete(`/chip-planning/delete-group/${groupName}`).then(r => r.data),

    // 9. update vehicle group
    updateVehicleGroup: async (kalustoNro: number, groupName: string) =>
        apiClient.put(`/chip-planning/update-vehicle-group`, { kalustoNro, groupName }).then(r => r.data),

    // 10. update load metrics
    updateLoadMetrics: async (loadId: number, data: any) => {
        const response = await apiClient.post(`/chip-planning/set-metrics`, { loadId, ...data });
        return response.data;
    },

    // 11. set load
    setLoad: async (payload: any) => {
        const response = await apiClient.post(`/chip-planning/set-load`, payload);
        return response.data;
    },

    // 12. get driver loads
    getDriverLoads: async (params?: {
        vehicleNumber?: number;
        startDate?: string;
        endDate?: string;
        week?: number;
        year?: number;
        ts?: number;
    }) => {
        const response = await apiClient.get(`/chip-planning/driver-loads`, {
            params: params || undefined
        });
        return response.data;
    },

    // 13. schedule load
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

    // 14. search loads
    searchLoads: async (params: any) => {
        const response = await apiClient.get(`/chip-planning/search`, { params });
        return response.data;
    },

    // 15. approve load transfer
    approveTransfer: async (loadId: number, approve: boolean, notificationId?: number | null) => {
        const response = await apiClient.post(`/chip-planning/approve-transfer-request`, {
            loadId,
            approve,
            notificationId
        });
        return response.data;
    },

    // 16. request load transfer
    requestTransfer: async (loadId: number, newVehicleNumber: number) => {
        const response = await apiClient.post(`/chip-planning/request-transfer`, {
            loadId,
            newVehicleNumber
        });
        return response.data;
    },

    // 17. get notifications
    getNotifications: async (userId: number) => {
        const response = await apiClient.get(`/chip-planning/notifications/${userId}`);
        return response.data;
    },

    // 18. mark notification as read
    markNotificationAsRead: async (notificationId: number) => {
        const response = await apiClient.put(`/chip-planning/notifications/${notificationId}/read`);
        return response.data;
    },

    // 19. mark all notifications as read
    markAllNotificationsAsRead: async (userId: number) => {
        const response = await apiClient.put(`/chip-planning/notifications/mark-all-read/${userId}`);
        return response.data;
    },
    // 20. clear read notifications
    clearReadNotifications: async (userId: number) => {
        const response = await apiClient.delete(`/chip-planning/notifications/clear-read/${userId}`);
        return response.data;
    },
};

export default chipPlanningService;