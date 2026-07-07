import { createClient, SupabaseClient } from "@supabase/supabase-js";

// 환경변수 (.env.local 그리고 Vercel 환경변수에 저장).
// NEXT_PUBLIC_ 접두사가 있어야 브라우저에서 읽을 수 있습니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 아직 Supabase 를 연결하지 않았어도 앱이 죽지 않도록 안전하게 처리합니다.
// (허브를 먼저 배포하고, 수업 중에 Supabase 를 연결하는 흐름을 위해)
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

// 작업물 한 개의 데이터 형태.
export type Work = {
  id: string;
  member_slug: string;
  title: string;
  description: string | null;
  link: string | null;
  image_url: string | null;
  created_at: string;
};
