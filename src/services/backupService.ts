// frontend/src/services/backupService.ts
import apiClient from './apiClient';

export const backupService = {
    downloadTemplate: async (module: string) => {
        const response = await apiClient.get(`/backup/template/${module}`, { responseType: 'blob' });
        return response.data;
    },

    exportData: async (module: string, password: string) => {
        const response = await apiClient.post(`/backup/export`, { module, password }, { responseType: 'blob' });
        return response.data;
    },

    // Validates the mapped JSON array directly instead of uploading multipart files
    validateImport: async (module: string, mappedData: any[]) => {
        const response = await apiClient.post(`/backup/import/validate`, { module, data: mappedData });
        return response.data;
    },

    executeImport: async (module: string, data: any[], conflictStrategy: string) => {
        const response = await apiClient.post(`/backup/import/execute`, { module, data, conflictStrategy });
        return response.data;
    }
};