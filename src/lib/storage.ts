import { Member, Synod, Pastorate, Congregation, AppUser } from '../types';

const STORAGE_KEYS = {
  MEMBERS: 'ieca_local_members',
  SYNODS: 'ieca_local_synods',
  PASTORATES: 'ieca_local_pastorates',
  CONGREGATIONS: 'ieca_local_congregations',
  USERS: 'ieca_local_users',
  MODE: 'ieca_data_mode' // 'cloud' | 'local'
};

export const localStore = {
  save: (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data)),
  get: (key: string) => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  
  // Sincronização em massa
  syncFromCloud: (data: { members: Member[], synods: Synod[], pastorates: Pastorate[], congregations: Congregation[] }) => {
    localStore.save(STORAGE_KEYS.MEMBERS, data.members);
    localStore.save(STORAGE_KEYS.SYNODS, data.synods);
    localStore.save(STORAGE_KEYS.PASTORATES, data.pastorates);
    localStore.save(STORAGE_KEYS.CONGREGATIONS, data.congregations);
  }
};

export { STORAGE_KEYS };
