import { apiClient } from '../../services/api.client';
import { User } from '../../types';

export const loginApi = async (username: string, password: string): Promise<User> => {
  const response = await apiClient.post<User>('/auth/login', { username, password });
  return response.data;
};

export const registerApi = async (registerData: any): Promise<User> => {
  const response = await apiClient.post<User>('/auth/register', registerData);
  return response.data;
};
