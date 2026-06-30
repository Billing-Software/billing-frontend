import { apiClient } from '../../services/api.client';
import { User } from '../../types';

export const loginApi = async (email: string, password: string, businessId?: number): Promise<User> => {
  const response = await apiClient.post<User>('/auth/login', { email, password, businessId });
  return response.data;
};

export const registerApi = async (registerData: any): Promise<User> => {
  const response = await apiClient.post<User>('/auth/register', registerData);
  return response.data;
};

export const forgotPasswordApi = async (email: string): Promise<any> => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPasswordApi = async (payload: any): Promise<any> => {
  const response = await apiClient.post('/auth/reset-password', payload);
  return response.data;
};

export const changePasswordApi = async (payload: any): Promise<any> => {
  const response = await apiClient.post('/auth/change-password', payload);
  return response.data;
};
