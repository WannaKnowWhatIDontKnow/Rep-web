import { useState, useEffect, useCallback } from 'react';
import supabase from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger'; // logger 임포트
import { Rep } from '../types'; // Rep 타입 임포트

export function useReps() {
  const { user, isAuthenticated } = useAuth();
  const [repList, setRepList] = useState<Rep[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. 데이터 로딩 로직 (user 객체가 변경될 때만 실행)
  useEffect(() => {
    // 이 함수는 user 상태가 확정된 후에만 호출된다.
    const loadReps = async () => {
      setLoading(true);
      let rawData: any[] = [];

      try {
        if (user && isAuthenticated) {
          // 회원 데이터 로드
          logger.info(`회원(${user.id}) 데이터를 DB에서 로드합니다.`);
          const { data, error } = await supabase
            .from('reps')
            .select('*')
            .eq('user_id', user.id)
            .order('completed_at', { ascending: false });

          if (error) throw error;
          rawData = data || [];
        } else {
          // 비회원 데이터 로드
          logger.info('비회원 데이터를 로컬스토리지에서 로드합니다.');
          const localData = localStorage.getItem('repList');
          rawData = localData ? JSON.parse(localData) : [];
        }
      } catch (error) {
        logger.error('데이터 로드 중 에러 발생:', error);
        rawData = [];
      }

      // 🔥 핵심: 데이터 정제 파이프라인
      // 어떤 데이터가 들어오든 항상 일관된 형식으로 변환한다.
      const normalizedData: Rep[] = rawData.map(rep => {
        const seconds = rep.initialSeconds ?? rep.initial_seconds ?? 0; // 1순위 initialSeconds, 2순위 initial_seconds, 없으면 0
        return {
          ...rep,
          initialSeconds: seconds, // 클라이언트용 필드 보장
          initial_seconds: seconds, // DB/저장용 필드 보장
        };
      });

      setRepList(normalizedData);
      setLoading(false);
    };

    loadReps();
  }, [user, isAuthenticated]); // user 객체와 isAuthenticated 자체를 의존성으로 사용

  // 2. 비회원 데이터 저장 로직
  useEffect(() => {
    // 로딩이 끝났고, 비회원 상태일 때만 실행
    if (!loading && !isAuthenticated) {
      logger.info('비회원 데이터를 로컬스토리지에 저장합니다.');
      localStorage.setItem('repList', JSON.stringify(repList));
    }
  }, [repList, isAuthenticated, loading]); // repList가 바뀔 때마다 저장 시도

  // 렛 추가 함수 (App.js에서 사용)
  const addRep = async (completedRepData: Omit<Rep, 'id' | 'user_id'>) => {
    // 1. 전달받은 데이터에서 '초' 값을 안전하게 추출
    const seconds = completedRepData.finalSeconds ?? completedRepData.initialSeconds ?? completedRepData.initial_seconds ?? 0;

    // 2. DB에 저장할 데이터 객체 생성 (항상 initial_seconds 사용)
    const repForDB = {
      goal: completedRepData.goal,
      notes: completedRepData.notes,
      completed_at: new Date().toISOString(),
      initial_seconds: seconds,
    };

    if (isAuthenticated && user) {
      // DB에 저장
      const { data, error } = await supabase
        .from('reps')
        .insert({ ...repForDB, user_id: user.id })
        .select()
        .single();
      
      if (error) {
        logger.error('DB에 rep 저장 실패:', error);
        return;
      }

      // 3. 상태(repList)에 추가할 때는 두 필드를 모두 포함하여 형식을 통일
      const newRep = { ...data, initialSeconds: data.initial_seconds };
      setRepList(prev => [newRep, ...prev]);

    } else {
      // 3. 로컬스토리지용 데이터도 두 필드를 모두 포함하여 형식을 통일
      const localRep = { ...repForDB, id: Date.now(), initialSeconds: seconds };
      setRepList(prev => [localRep, ...prev]);
    }
  };

  const getFilteredReps = (selectedDate: Date): Rep[] => {
    return repList.filter(rep => {
      if (!rep.completed_at) return false;
      const repDate = new Date(rep.completed_at);
      return repDate.getFullYear() === selectedDate.getFullYear() &&
             repDate.getMonth() === selectedDate.getMonth() &&
             repDate.getDate() === selectedDate.getDate();
    });
  };

  // Rep 삭제 함수
  const deleteRep = async (repId: Rep['id']) => {
    if (!repId) {
      logger.error('삭제할 Rep의 ID가 없습니다.');
      return;
    }

    try {
      if (isAuthenticated && user) {
        // 회원: Supabase DB에서 삭제
        const { error } = await supabase
          .from('reps')
          .delete()
          .eq('id', repId);

        if (error) throw error;
        logger.info(`DB에서 Rep(id: ${repId}) 삭제 성공`);
      } else {
        // 비회원: 로컬스토리지 데이터는 이미 repList state에 있으므로 별도 조치 필요 없음
        logger.info(`로컬스토리지용 Rep(id: ${repId}) 삭제 준비`);
      }

      // 공통 로직: 화면(state)에서 해당 Rep 제거
      setRepList(currentList => currentList.filter(rep => rep.id !== repId));

    } catch (error: any) {
      logger.error('Rep 삭제 중 에러 발생:', error);
    }
  };

  return { repList, loading, addRep, getFilteredReps, deleteRep };
}
