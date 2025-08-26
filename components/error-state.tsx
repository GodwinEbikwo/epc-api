import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  error: Error | { message: string; stack?: string };
  onRetry: () => void;
  isRetrying?: boolean;
}

export function ErrorState({ error, onRetry, isRetrying }: ErrorStateProps) {
  const getErrorMessage = (error: Error | { message: string; stack?: string }) => {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return {
        title: 'Connection Error',
        description: 'Unable to connect to the server. Please check your internet connection and try again.',
        suggestions: ['Check your internet connection', 'Try refreshing the page']
      };
    }
    
    if (message.includes('timeout')) {
      return {
        title: 'Request Timeout',
        description: 'The search is taking longer than expected. This might happen with broad searches.',
        suggestions: ['Try a more specific postcode', 'Use fewer filters', 'Try again in a moment']
      };
    }
    
    if (message.includes('cors') || message.includes('blocked')) {
      return {
        title: 'Access Error',
        description: 'There was an issue accessing the property data.',
        suggestions: ['This appears to be a technical issue', 'Please try again or contact support']
      };
    }

    return {
      title: 'Something went wrong',
      description: error.message || 'An unexpected error occurred while searching for properties.',
      suggestions: ['Try refreshing the page', 'Check your search criteria', 'Try again in a few moments']
    };
  };

  const { title, description, suggestions } = getErrorMessage(error);

  return (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 mb-6 text-red-400">
        <AlertTriangle className="w-full h-full" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      
      <p className="text-gray-500 max-w-md mx-auto mb-6">
        {description}
      </p>

      <Button 
        onClick={onRetry} 
        disabled={isRetrying}
        className="mb-6"
      >
        {isRetrying ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Retrying...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </>
        )}
      </Button>

      <div className="text-sm text-gray-400 space-y-1">
        {suggestions.map((suggestion, index) => (
          <p key={index}>• {suggestion}</p>
        ))}
      </div>

      <details className="mt-6 text-left max-w-md mx-auto">
        <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-600">
          Technical details
        </summary>
        <pre className="mt-2 text-xs bg-gray-100 p-3 rounded text-gray-600 overflow-x-auto">
          {error.stack || error.message}
        </pre>
      </details>
    </div>
  );
}