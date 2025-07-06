import { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * 애플리케이션의 핵심 데이터 구조인 'Rep' 객체를 정의합니다.
 */
export interface Rep {
  id: number | string;
  goal: string;
  notes?: string;
  completed_at: string | null;
  initial_seconds: number;
  user_id?: string;

  // 클라이언트 측에서만 사용되거나, 호환성을 위한 필드들
  initialSeconds?: number;
  finalSeconds?: number;
}

/**
 * 애플리케이션에서 사용할 사용자(User) 객체를 정의합니다.
 * Supabase의 User 타입에서 id와 email만 선택하여 사용합니다.
 */
export type User = Pick<SupabaseUser, 'id' | 'email'>;
