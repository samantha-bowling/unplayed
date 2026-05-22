
import { supabase } from '@/integrations/supabase/client';
import { devLog, devWarn } from '../lib/dev-log';

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

  devLog('🔐 Auth Debug Info:', debugInfo);
  
  if (error) {
    console.error('🔐 Auth Session Error:', error);
  }

  return debugInfo;
}

/**
 * Test RLS policies for game_picks table
 */
export async function testGamePicksRLS(): Promise<void> {
  devLog('🔒 Testing game_picks RLS policies...');
  
  const authInfo = await getAuthDebugInfo();
  
  if (!authInfo.isAuthenticated) {
    devWarn('🔒 User not authenticated - RLS tests will fail');
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
      devLog('✅ RLS SELECT test passed:', data?.length || 0, 'records accessible');
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
      devLog('✅ RLS INSERT test passed:', data);
      
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
 * Test user's access to various tables with type-safe approach
 */
export async function testUserTableAccess(): Promise<void> {
  devLog('🔍 Testing user table access...');
  
  const authInfo = await getAuthDebugInfo();
  
  if (!authInfo.isAuthenticated) {
    devWarn('🔍 User not authenticated - skipping table access tests');
    return;
  }

  // Test access to users table
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.error(`❌ Access denied to users:`, {
        code: error.code,
        message: error.message
      });
    } else {
      devLog(`✅ Access granted to users:`, data?.length || 0, 'records');
    }
  } catch (err) {
    console.error(`💥 Exception accessing users:`, err);
  }

  // Test access to user_games table
  try {
    const { data, error } = await supabase
      .from('user_games')
      .select('*')
      .limit(1);

    if (error) {
      console.error(`❌ Access denied to user_games:`, {
        code: error.code,
        message: error.message
      });
    } else {
      devLog(`✅ Access granted to user_games:`, data?.length || 0, 'records');
    }
  } catch (err) {
    console.error(`💥 Exception accessing user_games:`, err);
  }

  // Test access to games table
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .limit(1);

    if (error) {
      console.error(`❌ Access denied to games:`, {
        code: error.code,
        message: error.message
      });
    } else {
      devLog(`✅ Access granted to games:`, data?.length || 0, 'records');
    }
  } catch (err) {
    console.error(`💥 Exception accessing games:`, err);
  }

  // Test access to game_picks table
  try {
    const { data, error } = await supabase
      .from('game_picks')
      .select('*')
      .limit(1);

    if (error) {
      console.error(`❌ Access denied to game_picks:`, {
        code: error.code,
        message: error.message
      });
    } else {
      devLog(`✅ Access granted to game_picks:`, data?.length || 0, 'records');
    }
  } catch (err) {
    console.error(`💥 Exception accessing game_picks:`, err);
  }
}
