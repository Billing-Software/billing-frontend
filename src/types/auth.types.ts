import { User } from './user.types';

export interface AuthState {
  currentUser: User | null;
  currentBranch: 'Main' | 'Downtown';
  isLoading: boolean;
  error: string | null;
}
