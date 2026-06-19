import { User } from '../../types';

export const loginApi = async (email: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email === 'admin@smartbill.com' && password === 'admin') {
        resolve({
          name: 'Sarah Jenkins',
          email: 'admin@smartbill.com',
          role: 'Platform Owner',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150'
        });
      } else {
        reject(new Error('Invalid email or password'));
      }
    }, 1000);
  });
};
