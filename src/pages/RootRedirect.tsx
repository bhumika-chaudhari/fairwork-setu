import { Navigate } from 'react-router-dom';
import { useProfile } from '../hooks/ProfileContext';

export default function RootRedirect() {
  const { ready, onboardingComplete } = useProfile();
  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primarySoft border-t-primary" />
      </div>
    );
  }
  return <Navigate to={onboardingComplete ? '/home' : '/welcome'} replace />;
}
