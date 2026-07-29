import { createClient, SupabaseClient } from "@supabase/supabase-js";
import "dotenv/config";
import ws from "ws";
import { IUser } from "../types/user";

export type DbUser = {
  id: string;
  email: string;
  wallet_address: string;
  x_username: string;
  referral: string;
  score: number;
  created_at: string;
};

type ClientOptions = NonNullable<Parameters<typeof createClient>[2]>;
type RealtimeOptions = NonNullable<ClientOptions["realtime"]>;
type RealtimeTransport = NonNullable<RealtimeOptions["transport"]>;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.",
    );
  }

  // supabase-js expects an explicit transport on Node < 22, which has no native WebSocket
  const realtime: RealtimeOptions | undefined =
    typeof globalThis.WebSocket === "undefined"
      ? { transport: ws as unknown as RealtimeTransport }
      : undefined;

  client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    ...(realtime ? { realtime } : {}),
  });

  return client;
}

export function mapDbUser(row: DbUser): IUser {
  return {
    email: row.email,
    walletAddress: row.wallet_address,
    xUsername: row.x_username,
    referral: row.referral,
    score: row.score,
  };
}

export async function assertSupabaseReady(): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("users").select("id").limit(1);

  if (error) {
    throw new Error(`Supabase connection failed: ${error.message}`);
  }

  console.log("✅ Connected to Supabase");
}
