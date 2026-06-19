import { loginApi, registerApi } from './api';
import { User } from '../../types';

export const authService = {
  login: async (username: string, password: string): Promise<User> => {
    return loginApi(username, password);
  },

  register: async (registerData: any): Promise<User> => {
    return registerApi(registerData);
  },
  
  getCurrentSessionUser: (): User | null => {
    const data = localStorage.getItem('auth_data');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  logout: (): void => {
    localStorage.removeItem('auth_data');
  }
};
