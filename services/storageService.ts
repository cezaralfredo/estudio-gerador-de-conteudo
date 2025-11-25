
import { CalendarEntry, ContentStatus } from '../types';

// O prefixo base. O ID do usuário será anexado a isso.
const DB_BASE_KEY = 'NEXUS_CALENDAR_DATA_'; 

export const StorageService = {
  // Carregar dados do usuário específico
  loadEntries: (userId: string): CalendarEntry[] => {
    if (!userId) return [];
    
    try {
      const key = `${DB_BASE_KEY}${userId}`;
      const data = localStorage.getItem(key);
      if (!data) return [];

      const parsed = JSON.parse(data);
      
      // Migration Logic
      return parsed.map((entry: any) => {
        let status: ContentStatus = 'idea';
        if (entry.status === 'completed') status = 'published';
        else if (entry.status === 'planned') status = 'planned';
        else if (['idea', 'writing', 'review', 'published'].includes(entry.status)) status = entry.status;
        
        return {
            ...entry,
            status
        };
      });

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      return [];
    }
  },

  // Salvar dados para o usuário específico
  saveEntries: (userId: string, entries: CalendarEntry[]) => {
    if (!userId) return;

    try {
      const key = `${DB_BASE_KEY}${userId}`;
      localStorage.setItem(key, JSON.stringify(entries));
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
    }
  },

  // Verificar duplicidade (agora no contexto do usuário)
  checkDuplicity: (userId: string, subject: string, topic: string, currentId: string | null) => {
    if (!userId) return undefined;
    
    const entries = StorageService.loadEntries(userId);
    
    const normalize = (str: string) => str.toLowerCase().trim();
    const targetSubject = normalize(subject);
    const targetTopic = normalize(topic);

    const duplicate = entries.find(entry => {
      if (currentId && entry.id === currentId) return false;
      const entrySubject = normalize(entry.subject);
      const entryTopic = normalize(entry.topic);
      return entrySubject === targetSubject && entryTopic === targetTopic;
    });

    return duplicate;
  }
};