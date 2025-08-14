import SteamLoader from '@/components/SteamLoader';

interface LoadingFallbackProps {
  message?: string;
}

const LoadingFallback = ({ message = "Loading..." }: LoadingFallbackProps) => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SteamLoader message={message} size="md" variant="secondary" />
    </div>
  );
};

export default LoadingFallback;