import { loginApi } from './api';
import { User } from '../../types';

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    return loginApi(email, password);
  },
  
  getCurrentSessionUser: (): User | null => {
    // Simulated session check
    return null;
  }
};
