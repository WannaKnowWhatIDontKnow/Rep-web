// src/types/index.ts

/**
 * 애플리케이션의 핵심 데이터 구조인 'Rep' 객체를 정의합니다.
 */
export interface Rep {
  /**
   * Rep의 고유 식별자입니다.
   * 비회원(로컬스토리지)일 때는 숫자(Date.now()), 회원(DB)일 때는 문자열일 수 있습니다.
   */
  id: number | string;

  /**
   * 사용자가 설정한 Rep의 목표입니다. (필수)
   */
  goal: string;

  /**
   * Rep 완료 후 작성하는 회고 노트입니다. (선택적)
   * '?'는 이 속성이 없을 수도 있다는 것을 의미합니다.
   */
  notes?: string;

  /**
   * Rep이 완료된 시간의 ISO 문자열입니다.
   * null이면 아직 완료되지 않은 Rep을 의미합니다.
   */
  completed_at: string | null;

  /**
   * Supabase DB에 저장되는 시간 필드 (초 단위).
   */
  initial_seconds: number;

  /**
   * Supabase DB에 저장되는 사용자의 고유 ID.
   * 비회원 데이터에는 이 필드가 없을 수 있으므로 선택적으로 만듭니다.
   */
  user_id?: string;

  /**
   * 로컬스토리지와 클라이언트 측에서 사용되는 시간 필드 (초 단위).
   * DB에서 온 데이터에는 이 필드가 없을 수 있으므로 선택적으로 만듭니다.
   * useReps 훅에서 이 필드를 보장해주는 로직이 있습니다.
   */
  initialSeconds?: number;

  /**
   * (회고 모달 전용) 중도 완료 시 실제 경과 시간을 저장하기 위한 임시 필드.
   */
  finalSeconds?: number;
}

import { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * 애플리케이션에서 사용할 사용자(User) 객체를 정의합니다.
 * Supabase의 User 타입에서 id와 email만 선택하여 사용합니다.
 */
export type User = Pick<SupabaseUser, 'id' | 'email'>;
