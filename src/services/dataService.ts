import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  deleteDoc, 
  doc, 
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { localStore, STORAGE_KEYS } from '../lib/storage';
import { Member, Synod, Pastorate, Congregation, AppUser } from '../types';
import fallbackData from '../data/fallback_data.json';

export const dataService = {
  // Detector de Quota
  isQuotaExceeded: (error: any) => {
    return error?.message?.includes('quota') || error?.code === 'resource-exhausted';
  },

  async getMembers(): Promise<Member[]> {
    try {
      const snap = await getDocs(collection(db, 'members'));
      const cloudMembers = snap.docs.map(d => ({ id: d.id, ...d.data() } as Member));
      localStore.save(STORAGE_KEYS.MEMBERS, cloudMembers);
      
      // Combina dados da nuvem com os do JSON (removendo duplicados por segurança)
      const combined = [...cloudMembers];
      (fallbackData.members as Member[]).forEach(fm => {
        if (!combined.find(m => m.id === fm.id)) {
          combined.push(fm);
        }
      });
      return combined;
    } catch (error) {
      console.warn("Firebase offline/quota. Usando fallback.");
      return [...(localStore.get(STORAGE_KEYS.MEMBERS) || []), ...(fallbackData.members as Member[])];
    }
  },

  async getSynods(): Promise<Synod[]> {
    try {
      const snap = await getDocs(collection(db, 'synods'));
      const cloudData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Synod));
      
      const combined = [...cloudData];
      (fallbackData.synods as Synod[]).forEach(fs => {
        if (!combined.find(s => s.id === fs.id)) {
          combined.push(fs);
        }
      });
      return combined;
    } catch (error) {
      return [...(localStore.get(STORAGE_KEYS.SYNODS) || []), ...(fallbackData.synods as Synod[])];
    }
  },

  async getPastorates(): Promise<Pastorate[]> {
    try {
      const snap = await getDocs(collection(db, 'pastorates'));
      const cloudData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Pastorate));
      
      const combined = [...cloudData];
      (fallbackData.pastorates as Pastorate[]).forEach(fp => {
        if (!combined.find(p => p.id === fp.id)) {
          combined.push(fp);
        }
      });
      return combined;
    } catch (error) {
      return [...(localStore.get(STORAGE_KEYS.PASTORATES) || []), ...(fallbackData.pastorates as Pastorate[])];
    }
  },

  async getCongregations(): Promise<Congregation[]> {
    try {
      const snap = await getDocs(collection(db, 'congregations'));
      const cloudData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Congregation));
      
      const combined = [...cloudData];
      (fallbackData.congregations as Congregation[]).forEach(fc => {
        if (!combined.find(c => c.id === fc.id)) {
          combined.push(fc);
        }
      });
      return combined;
    } catch (error) {
      return [...(localStore.get(STORAGE_KEYS.CONGREGATIONS) || []), ...(fallbackData.congregations as Congregation[])];
    }
  },

  async addMember(member: Omit<Member, 'id'>) {
    try {
      return await addDoc(collection(db, 'members'), member);
    } catch (error) {
      if (this.isQuotaExceeded(error)) {
        const localMembers = localStore.get(STORAGE_KEYS.MEMBERS) || [];
        const newMember = { ...member, id: `local_${Date.now()}` };
        localStore.save(STORAGE_KEYS.MEMBERS, [...localMembers, newMember]);
        return { id: newMember.id };
      }
      throw error;
    }
  }
};
