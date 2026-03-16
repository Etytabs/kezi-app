
import { api } from './api';

export const journalApi = {
  getAllJournalEntries: async () => {
    return api.get('/journal');
  },
  getJournalEntry: async (id: string) => {
    return api.get(`/journal/${id}`);
  },
  createJournalEntry: async (data: any) => {
    return api.post('/journal', data);
  },
  updateJournalEntry: async (id: string, data: any) => {
    return api.patch(`/journal/${id}`, data);
  },
  deleteJournalEntry: async (id: string) => {
    return api.delete(`/journal/${id}`);
  },
};
