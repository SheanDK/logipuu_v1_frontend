// frontend/src/services/chatService.ts
import apiClient from './apiClient';

export const chatService = {
    getContacts: async () => {
        const { data } = await apiClient.get('/chat/contacts');
        return data;
    },
    getHistory: async (partnerId: number) => {
        const { data } = await apiClient.get(`/chat/history/${partnerId}`);
        return data;
    },
    getBroadcasts: async () => {
        const { data } = await apiClient.get('/chat/broadcasts');
        return data;
    },
    getDriverContacts: async () => {
        const { data } = await apiClient.get('/chat/driver-contacts');
        return data;
    },
    deleteMessages: async (messageIds: number[]) => {
        const { data } = await apiClient.post('/chat/delete-messages', { messageIds });
        return data;
    }
};