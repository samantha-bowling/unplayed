
import { supabase } from '@/integrations/supabase/client';

/**
 * Debug utilities for Supabase authentication and RLS policy issues
 */

export interface AuthDebugInfo {
  isAuthenticated: boolean;
  userId: string | null;
  sessionExists: boolean;
  sessionValid: boolean;
  userMetadata: any;
  timestamp: string;
}

export interface RLSDebugInfo {
  tableName: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  userId: string | null;
  error: any;
  timestamp: string;
}

/**
 * Get comprehensive authentication debug information
 */
export async function getAuthDebugInfo(): Promise<AuthDebugInfo> {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  const debugInfo: AuthDebugInfo = {
    isAuthenticated: !!session?.user,
    userId: session?.user?.id || null,
    sessionExists: !!session,
    sessionValid: session ? Date.now() < (session.expires_at || 0) * 1000 : false,
    userMetadata: session?.user?.user_metadata || null,
    timestamp: new Date().toISOString()
  };

  console.log('🔐 Auth Debug Info:', debugInfo);
  
  if (error) {
    console.error('🔐 Auth Session Error:', error);
  }

  return debugInfo;
}

/**
 * Test RLS policies for game_picks table
 */
export async function testGamePicksRLS(): Promise<void> {
  console.log('🔒 Testing game_picks RLS policies...');
  
  const authInfo = await getAuthDebugInfo();
  
  if (!authInfo.isAuthenticated) {
    console.warn('🔒 User not authenticated - RLS tests will fail');
    return;
  }

  // Test SELECT permission
  try {
    const { data, error } = await supabase
      .from('game_picks')
      .select('*')
      .limit(1);

    if (error) {
      console.error('🔒 RLS SELECT test failed:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('✅ RLS SELECT test passed:', data?.length || 0, 'records accessible');
    }
  } catch (err) {
    console.error('🔒 RLS SELECT test exception:', err);
  }

  // Test INSERT permission with a test record
  try {
    const testGameId = 12345; // Use a test game ID
    const { data, error } = await supabase
      .from('game_picks')
      .insert({
        user_id: authInfo.userId!,
        game_id: testGameId,
        filters: { test: true },
        picked_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('🔒 RLS INSERT test failed:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('✅ RLS INSERT test passed:', data);
      
      // Clean up test record
      await supabase
        .from('game_picks')
        .delete()
        .eq('id', data.id);
    }
  } catch (err) {
    console.error('🔒 RLS INSERT test exception:', err);
  }
}

/**
 * Enhanced error logging for database operations
 */
export function logDatabaseError(operation: string, tableName: string, error: any, context?: any): void {
  const errorInfo = {
    operation,
    tableName,
    timestamp: new Date().toISOString(),
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    },
    context
  };

  console.error(`💥 Database ${operation} Error on ${tableName}:`, errorInfo);

  // Provide specific guidance for common RLS errors
  if (error.code === '42501') {
    console.error('💡 RLS Error Guidance: This is a Row Level Security permission error.');
    console.error('   - Check if user is properly authenticated');
    console.error('   - Verify RLS policies exist for this table');
    console.error('   - Ensure policies allow this operation for this user');
  } else if (error.code === 'PGRST301') {
    console.error('💡 Policy Error Guidance: No matching RLS policy found.');
    console.error('   - Check if RLS is enabled on the table');
    console.error('   - Verify policies exist for the attempted operation');
  } else if (error.code === '23505') {
    console.error('💡 Constraint Error Guidance: Unique constraint violation.');
    console.error('   - This might be expected behavior with upserts');
  }
}

/**
 * Test user's access to various tables
 */
export async function testUserTableAccess(): Promise<void> {
  console.log('🔍 Testing user table access...');
  
  const authInfo = await getAuthDebugInfo();
  
  if (!authInfo.isAuthenticated) {
    console.warn('🔍 User not authenticated - skipping table access tests');
    return;
  }

  const tables = ['users', 'user_games', 'games', 'game_picks'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.error(`❌ Access denied to ${table}:`, {
          code: error.code,
          message: error.message
        });
      } else {
        console.log(`✅ Access granted to ${table}:`, data?.length || 0, 'records');
      }
    } catch (err) {
      console.error(`💥 Exception accessing ${table}:`, err);
    }
  }
}

/**
 * Enhanced wrapper for Supabase operations with debugging
 */
export async function debugSupabaseOperation<T>(
  operation: () => Promise<{ data: T; error: any }>,
  context: { operation: string; table: string; details?: any }
): Promise<{ data: T | null; error: any }> {
  console.log(`🔍 Starting ${context.operation} on ${context.table}`, context.details);
  
  try {
    const result = await operation();
    
    if (result.error) {
      logDatabaseError(context.operation, context.table, result.error, context.details);
      return { data: null, error: result.error };
    }
    
    console.log(`✅ ${context.operation} on ${context.table} succeeded:`, result.data);
    return result;
  } catch (err) {
    console.error(`💥 Exception in ${context.operation} on ${context.table}:`, err);
    return { data: null, error: err };
  }
}
