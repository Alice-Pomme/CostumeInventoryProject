/** Safe public barrel — do not re-export service-role helpers here. */
export { createClient as createBrowserClient } from "./client";
export {
  getSupabaseAnonKey,
  getSupabaseUrl,
  hasSupabaseEnv,
} from "./env";
