// frontend/src/services/chipService.ts
import apiClient from './apiClient';

export const chipPlanningService = {
    getWeeklyPlanning: async (week: number, year: number) =>
        apiClient.get(`/chip-planning/weekly-view`, { params: { week, year } }).then(r => r.data),

    assignTitle: async (payload: any) => apiClient.post(`/chip-planning/assign`, payload).then(r => r.data),

    moveLoad: async (payload: any) => apiClient.patch(`/chip-planning/move-load`, payload).then(r => r.data),

    dispatchRow: async (kalustoNro: number, week: number, year: number) =>
        apiClient.post(`/chip-planning/dispatch-row`, { kalustoNro, week, year }).then(r => r.data),

    updateLoad: async (loadId: number, data: any) => apiClient.put(`/chip-planning/load/${loadId}`, data).then(r => r.data),

    deleteLoad: async (loadId: number) => apiClient.delete(`/chip-planning/delete-load/${loadId}`).then(r => r.data),

    renameGroup: async (oldName: string, newName: string) => apiClient.put(`/chip-planning/rename-group`, { oldName, newName }).then(r => r.data),

    deleteGroup: async (groupName: string) => apiClient.delete(`/chip-planning/delete-group/${groupName}`).then(r => r.data),

    updateVehicleGroup: async (kalustoNro: number, groupName: string) => apiClient.put(`/chip-planning/update-vehicle-group`, { kalustoNro, groupName }).then(r => r.data),
};

export default chipPlanningService;
