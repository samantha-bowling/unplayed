
import { callSupabaseFunction } from '@/utils/supabase-functions';

export async function fixDatabaseSchema() {
  try {
    console.log('Calling fix-dust-calculation-function to update database schema...');
    
    const result = await callSupabaseFunction('fix-dust-calculation-function', {});
    
    console.log('Database schema fix result:', result);
    return result;
  } catch (error) {
    console.error('Error fixing database schema:', error);
    throw error;
  }
}
