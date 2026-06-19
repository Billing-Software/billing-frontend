import { useAuth } from '../../hooks/useAuth';

export const useAuthFeature = () => {
  const { currentUser, currentBranch, setCurrentBranch, setCurrentUser } = useAuth();
  
  const handleLogoutFeature = () => {
    setCurrentUser(null);
  };

  return {
    user: currentUser,
    branch: currentBranch,
    setBranch: setCurrentBranch,
    logout: handleLogoutFeature,
    login: setCurrentUser
  };
};
