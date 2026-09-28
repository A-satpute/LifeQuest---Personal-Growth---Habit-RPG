import { request } from './api';
import type { GamificationProfile } from '../types/gamification';

export const gamificationService = {
  async getProfile(): Promise<GamificationProfile> {
    const res = await request<{ success: boolean; data: GamificationProfile }>('/gamification/profile');
    return res.data;
  },

  async getXP() {
    const res = await request<{ success: boolean; data: any }>('/gamification/xp');
    return res.data;
  },

  async getStats() {
    const res = await request<{ success: boolean; data: any }>('/gamification/stats');
    return res.data;
  },

  async getStreak() {
    const res = await request<{ success: boolean; data: any }>('/gamification/streak');
    return res.data;
  },

  async getCharacter() {
    const res = await request<{ success: boolean; data: any }>('/character');
    return res.data;
  },

  async updateGender(gender: 'MALE' | 'FEMALE') {
    const res = await request<{ success: boolean; message: string; data: { character: any } }>('/gamification/gender', {
      method: 'PATCH',
      body: JSON.stringify({ gender }),
    });
    return res.data;
  },
};
