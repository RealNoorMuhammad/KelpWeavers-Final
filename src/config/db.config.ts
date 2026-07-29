import { assertSupabaseReady } from "./supabase";

export const connectDB = async (): Promise<void> => {
  try {
    await assertSupabaseReady();
  } catch (err) {
    console.error(
      "⚠️ Supabase unavailable — page will still load; auth needs Supabase credentials.",
      err,
    );
  }
};
