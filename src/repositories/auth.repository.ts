import { IUser } from "../types/user";
import { DbUser, getSupabase, mapDbUser } from "../config/supabase";

function assertNoError(
  error: { message: string; code?: string } | null,
  action: string,
): void {
  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to ${action}: ${error.message}`);
  }
}

export class UserRepository {
  static async find(
    walletAddress: string,
    email: string,
    xUsername: string,
  ): Promise<IUser | null> {
    const supabase = getSupabase();

    const byWallet = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", walletAddress)
      .maybeSingle();
    assertNoError(byWallet.error, "find user");
    if (byWallet.data) return mapDbUser(byWallet.data as DbUser);

    const byX = await supabase
      .from("users")
      .select("*")
      .eq("x_username", xUsername)
      .maybeSingle();
    assertNoError(byX.error, "find user");
    if (byX.data) return mapDbUser(byX.data as DbUser);

    const byEmail = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();
    assertNoError(byEmail.error, "find user");
    if (byEmail.data) return mapDbUser(byEmail.data as DbUser);

    return null;
  }

  static async register(user: Omit<IUser, "score">): Promise<IUser | null> {
    const supabase = getSupabase();

    if (!user.referral) {
      throw new Error("Failed to create user: referral code is required.");
    }

    const { data, error } = await supabase
      .from("users")
      .insert({
        email: user.email,
        wallet_address: user.walletAddress,
        x_username: user.xUsername,
        referral: user.referral,
        score: 0,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data ? mapDbUser(data as DbUser) : null;
  }

  static async findReferral(referral: string): Promise<IUser | null> {
    const supabase = getSupabase();

    const { data, error } = await supabase.rpc("increment_referral_score", {
      ref_code: referral,
    });

    if (error) {
      throw new Error(`Failed to process referral: ${error.message}`);
    }

    const row = Array.isArray(data) ? data[0] : data;
    return row ? mapDbUser(row as DbUser) : null;
  }

  static async findOne(walletAddress: string): Promise<IUser | null> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    assertNoError(error, "find user");
    return data ? mapDbUser(data as DbUser) : null;
  }
}
