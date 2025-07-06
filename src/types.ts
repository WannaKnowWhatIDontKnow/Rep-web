// Rep 프로젝트에서 사용되는 타입 정의

/**
 * Rep 타입 - 사용자의 집중 세션을 나타냅니다.
 */
export interface Rep {
  id: number;
  goal: string;
  initial_seconds: number;
  completed_at: string | null;
  notes?: string;
  final_seconds?: number;
  created_at?: string;
  user_id?: string;
  initialSeconds?: number; // 이전 코드와의 호환성을 위해 추가
  finalSeconds?: number; // 이전 코드와의 호환성을 위해 추가
}
