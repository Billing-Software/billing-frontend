import { loginApi, registerApi, forgotPasswordApi, resetPasswordApi, changePasswordApi } from './api';
import { User } from '../../types';

export const authService = {
  login: async (email: string, password: string, businessId?: number): Promise<User> => {
    return loginApi(email, password, businessId);
  },

  register: async (registerData: any): Promise<User> => {
    return registerApi(registerData);
  },

  forgotPassword: async (email: string): Promise<any> => {
    return forgotPasswordApi(email);
  },

  resetPassword: async (payload: any): Promise<any> => {
    return resetPasswordApi(payload);
  },

  changePassword: async (payload: any): Promise<any> => {
    return changePasswordApi(payload);
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
