// Unified Steam API client with standardized error handling and retries

export type SteamClientOptions = { 
  apiKey: string; 
  baseUrl?: string; 
  maxRetries?: number;
  timeout?: number;
};

export interface SteamCallLog {
  endpoint: string;
  status: number;
  err_code: string | null;
  duration_ms: number;
  attempts: number;
  user_id?: string | null;
}

/**
 * Unified Steam API client with proper retry logic and error handling
 */
export async function steamFetch<T>(
  path: string,
  params: Record<string, unknown>,
  opts: SteamClientOptions,
  userId?: string | null
): Promise<T> {
  const url = new URL((opts.baseUrl ?? "https://api.steampowered.com") + path);
  
  // Add all params except API key
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  
  // Append key last for security
  url.searchParams.set("key", opts.apiKey);

  let attempt = 0;
  const maxRetries = opts.maxRetries ?? 4;
  const timeout = opts.timeout ?? 30000;
  const startTime = Date.now();

  while (true) {
    let response: Response;
    let status = 0;
    let errorCode: string | null = null;
    
    try {
      console.log(`Steam API call: ${path} (attempt ${attempt + 1}/${maxRetries})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      response = await fetch(url.toString(), { 
        headers: { Accept: "application/json" },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      status = response.status;

      if (response.status === 401) {
        errorCode = "STEAM_AUTH_401";
        await logSteamCall(path, status, errorCode, Date.now() - startTime, attempt + 1, userId);
        throw new Error("STEAM_AUTH_401");
      }
      
      if (response.ok) {
        const data = await response.json() as T;
        await logSteamCall(path, status, null, Date.now() - startTime, attempt + 1, userId);
        return data;
      }

      // Retry for 429/5xx only
      if (response.status !== 429 && (response.status < 500 || response.status >= 600)) {
        const body = await response.text().catch(() => "");
        errorCode = `STEAM_ERROR_${response.status}`;
        await logSteamCall(path, status, errorCode, Date.now() - startTime, attempt + 1, userId);
        throw new Error(`${errorCode}:${body.slice(0, 200)}`);
      }
      
      if (attempt >= maxRetries) {
        errorCode = `STEAM_RETRY_EXHAUSTED_${response.status}`;
        await logSteamCall(path, status, errorCode, Date.now() - startTime, attempt + 1, userId);
        throw new Error(errorCode);
      }

      // Calculate backoff with jitter
      const backoff = 300 * Math.pow(2, attempt) + Math.random() * 150;
      console.log(`Steam API rate limited (${response.status}), waiting ${backoff}ms before retry ${attempt + 1}`);
      await new Promise(r => setTimeout(r, backoff));

    } catch (error) {
      if (error.name === 'AbortError') {
        errorCode = "STEAM_TIMEOUT";
        await logSteamCall(path, 0, errorCode, Date.now() - startTime, attempt + 1, userId);
        throw new Error("STEAM_TIMEOUT");
      }
      
      if (error.message.includes("STEAM_")) {
        throw error; // Re-throw our custom errors
      }
      
      // Network errors - retry if we have attempts left
      if (attempt >= maxRetries) {
        errorCode = "STEAM_NETWORK_ERROR";
        await logSteamCall(path, 0, errorCode, Date.now() - startTime, attempt + 1, userId);
        throw new Error(`STEAM_NETWORK_ERROR: ${error.message}`);
      }
      
      const backoff = 300 * Math.pow(2, attempt) + Math.random() * 150;
      await new Promise(r => setTimeout(r, backoff));
    }
    
    attempt++;
  }
}

/**
 * Log Steam API calls for monitoring
 */
async function logSteamCall(
  endpoint: string,
  status: number,
  errCode: string | null,
  durationMs: number,
  attempts: number,
  userId?: string | null
): Promise<void> {
  try {
    console.log(`Steam call log: ${endpoint} - ${status} - ${errCode} - ${durationMs}ms - ${attempts} attempts`);
    
    // Import Supabase client dynamically to avoid circular dependencies
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.49.4");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { error } = await supabase
        .from('steam_call_logs')
        .insert({
          endpoint,
          status,
          err_code: errCode,
          duration_ms: Math.round(durationMs),
          attempts,
          user_id: userId
        });
        
      if (error) {
        console.warn("Failed to insert Steam call log:", error);
      }
    }
    
  } catch (logError) {
    console.warn("Failed to log Steam API call:", logError);
  }
}

/**
 * Common Steam API endpoints with type safety
 */
export const STEAM_ENDPOINTS = {
  GET_OWNED_GAMES: "/IPlayerService/GetOwnedGames/v0001/",
  GET_PLAYER_SUMMARIES: "/ISteamUser/GetPlayerSummaries/v0002/",
  GET_APP_LIST: "/ISteamApps/GetAppList/v2/",
  GET_APP_DETAILS: "/api/appdetails/",
  GET_REVIEWS: "/api/reviews/",
} as const;