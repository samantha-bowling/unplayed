
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fixDatabaseSchema } from '@/utils/fix-database-schema';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const DatabaseSchemaFixer: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFixSchema = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const fixResult = await fixDatabaseSchema();
      setResult(fixResult);
      console.log('Schema fix completed:', fixResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Schema fix failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Database Schema Fixer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600">
          This will add the missing 5-factor dust score columns (quality_score, price_score, genre_score) 
          to the game_dust_breakdowns table.
        </p>
        
        <Button 
          onClick={handleFixSchema} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fixing Database Schema...
            </>
          ) : (
            'Fix Database Schema'
          )}
        </Button>

        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Success!</span>
            </div>
            <p className="text-green-700 mt-2">{result.message}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-2">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseSchemaFixer;
