import { useState, useEffect } from 'react';
import supabase from '../supabaseClient';

/**
 * 렙(Rep) 데이터를 관리하는 커스텀 훅
 * @param {Object} user - 현재 사용자 정보
 * @param {boolean} isAuthenticated - 사용자 인증 여부
 * @returns {Object} - reps 목록, 로딩 상태, 렙 추가/가져오기 함수 등
 */
export const useReps = (user, isAuthenticated) => {
  const [repList, setRepList] = useState([]);
  const [loading, setLoading] = useState(false);

  // 렙 데이터 가져오기 함수
  const fetchReps = async () => {
    setLoading(true);
    try {
      if (isAuthenticated && user) {
        console.log('데이터 가져오기 시도 - 사용자 ID:', user.id);
        
        // 로그인 상태: 데이터베이스에서 가져오기
        const { data, error } = await supabase
          .from('reps')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false });
          
        if (error) {
          console.error('데이터베이스에서 목표 가져오기 실패:', error);
          
          // 인증 오류인 경우 사용자에게 알림
          if (error.code === '403' || error.message.includes('JWT')) {
            console.log('인증 오류 발생, 세션 만료 가능성');
            
            try {
              // AuthContext의 refreshSession 함수를 호출하는 것이 좋지만, 여기서는 직접 구현
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              
              if (!refreshError && refreshData && refreshData.session) {
                console.log('세션 새로고침 성공, 데이터 다시 가져오기 시도');
                
                // 세션 새로고침 성공, 다시 시도
                const { data: retryData, error: retryError } = await supabase
                  .from('reps')
                  .select('*')
                  .eq('user_id', refreshData.session.user.id)
                  .order('completed_at', { ascending: false });
                  
                if (!retryError && retryData) {
                  console.log('세션 새로고침 후 데이터 가져오기 성공:', retryData.length, '개 항목');
                  setRepList(retryData);
                  setLoading(false);
                  return;
                } else if (retryError) {
                  console.error('새로고침 후 데이터 가져오기 실패:', retryError);
                }
              }
            } catch (refreshException) {
              console.error('세션 새로고침 중 예외 발생:', refreshException);
            }
            
            // 자동 새로고침 실패 시 사용자에게 알림
            alert('세션이 만료되었습니다. 다시 로그인해주세요.');
          }
          
          // 로컬스토리지에서 가져오기 시도
          try {
            const savedReps = localStorage.getItem('repList');
            if (savedReps) {
              console.log('로컬스토리지에서 데이터 가져오기 성공');
              setRepList(JSON.parse(savedReps));
            }
          } catch (error) {
            console.error('로컬스토리지에서 데이터 가져오기 실패:', error);
          }
        } else if (data) {
          console.log('가져온 데이터:', data.length, '개 항목');
          
          // 데이터 필드 일관성 유지 (DB와 프론트엔드 간)
          const normalizedData = data.map(rep => {
            // initial_seconds와 initialSeconds 필드 일관성 유지
            if (rep.initial_seconds !== undefined && rep.initialSeconds === undefined) {
              rep.initialSeconds = rep.initial_seconds;
            } else if (rep.initialSeconds !== undefined && rep.initial_seconds === undefined) {
              rep.initial_seconds = rep.initialSeconds;
            }
            
            // completed_at과 completedAt 필드 일관성 유지
            if (rep.completed_at !== undefined && rep.completedAt === undefined) {
              rep.completedAt = rep.completed_at;
            } else if (rep.completedAt !== undefined && rep.completed_at === undefined) {
              rep.completed_at = rep.completedAt;
            }
            
            return rep;
          });
          
          setRepList(normalizedData);
        }
      } else {
        console.log('사용자 정보가 없어 데이터를 가져올 수 없습니다.');
        // 로컬스토리지에서 가져오기 시도
        try {
          const savedReps = localStorage.getItem('repList');
          if (savedReps) {
            console.log('로컬스토리지에서 데이터 가져오기 성공');
            setRepList(JSON.parse(savedReps));
          }
        } catch (error) {
          console.error('로컬스토리지에서 데이터 가져오기 실패:', error);
        }
      }
    } catch (error) {
      console.error('데이터 가져오기 중 오류 발생:', error);
    }
    setLoading(false);
  };

  // 렙 추가 함수 (회고 제출 시 사용)
  const addRep = async (repToReview, notes) => {
    if (!repToReview) {
      console.error('repToReview가 없습니다.');
      return null;
    }
    
    console.log('회고 제출 시작:', notes, repToReview);
    
    // 이제 finalSeconds 값을 사용
    let seconds = 0;
    if (typeof repToReview.finalSeconds === 'number' && !isNaN(repToReview.finalSeconds)) {
      // 중간에 완료한 경우 또는 정상 완료된 경우 finalSeconds 사용
      seconds = repToReview.finalSeconds;
    } else if (typeof repToReview.initial_seconds === 'number' && !isNaN(repToReview.initial_seconds)) {
      seconds = repToReview.initial_seconds;
    } else if (typeof repToReview.initialSeconds === 'number' && !isNaN(repToReview.initialSeconds)) {
      seconds = repToReview.initialSeconds;
    }
    
    console.log('최종 시간 값 추출:', seconds, repToReview);
    
    // DB 스키마에 맞게 필드명 사용
    const reviewedRep = {
      goal: repToReview.goal,
      notes: notes,
      completed_at: new Date().toISOString(),
      initial_seconds: seconds, // DB에서 사용하는 필드명으로 통일
      user_id: repToReview.user_id // 사용자 ID 유지
    };
    
    // 클라이언트용 객체는 별도로 관리 (데이터베이스에 저장하지 않음)
    const clientRep = {
      ...reviewedRep,
      initialSeconds: seconds // 클라이언트에서 사용하는 필드명
    };
    
    if (isAuthenticated && user) {
      // 로그인 상태: 데이터베이스에 저장
      try {
        // 세션 확인 - 현재 세션이 유효한지 확인
        console.log('현재 세션 확인 중');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error('세션 확인 실패:', sessionError || '세션 없음');
          
          // 세션이 없으면 새로고침 시도
          console.log('세션 새로고침 시도');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData || !refreshData.session) {
            console.error('세션 새로고침 실패:', refreshError || '세션 없음');
            alert('세션이 만료되었습니다. 다시 로그인해주세요.');
            return null;
          }
          
          // 새로고침 성공 시 사용자 ID 업데이트
          reviewedRep.user_id = refreshData.session.user.id;
          console.log('세션 새로고침 성공:', refreshData.session.user.id);
        } else {
          // 현재 세션이 유효한 경우
          reviewedRep.user_id = session.user.id;
          console.log('현재 세션 유효:', session.user.id);
        }
        
        // 데이터 저장 시도
        console.log('데이터 저장 시도:', reviewedRep);
        
        // Supabase에 데이터 저장
        const { data: insertData, error } = await supabase
          .from('reps')
          .insert([reviewedRep])
          .select(); // 저장 후 데이터 반환 요청
          
        if (error) {
          console.error('데이터베이스 저장 실패:', error);
          
          // 오류 유형 확인
          if (error.code === 'PGRST301' || error.message.includes('policy')) {
            console.error('RLS 정책 오류:', error.message);
            alert('RLS 정책 오류: ' + error.message + '\n\nSupabase 대시보드에서 RLS 정책을 확인해주세요.');
          } else if (error.code === '403' || error.message.includes('JWT')) {
            console.error('인증 오류:', error.message);
            alert('인증 오류: ' + error.message + '\n\n다시 로그인해주세요.');
          } else {
            alert('제출 중 오류가 발생했습니다: ' + error.message);
          }
          return null;
        }
        
        // 저장 성공 확인
        if (insertData && insertData.length > 0) {
          console.log('데이터 저장 성공!', insertData);
          
          // 성공적으로 저장되면 목록에 추가 (클라이언트용 필드 추가)
          const newRep = {
            ...insertData[0],
            initialSeconds: insertData[0].initial_seconds // 클라이언트용 필드 추가
          };
          setRepList(prevList => [newRep, ...prevList]);
          return newRep;
        } else {
          console.log('데이터 저장은 성공했지만 반환된 데이터가 없습니다.');
          return reviewedRep;
        }
      } catch (err) {
        console.error('데이터 처리 중 오류 발생:', err);
        alert('제출 중 오류가 발생했습니다: ' + err.message);
        return null;
      }
    } else {
      // 비로그인 상태: 로컬스토리지에 저장
      const localRep = {
        ...reviewedRep,
        id: Date.now(), // 로컬에서 사용할 임시 ID
        completedAt: reviewedRep.completed_at, // 기존 코드와 호환성 유지
        initialSeconds: seconds // 프로그레스바 계산을 위해 필요
      };
      
      setRepList(prevList => [localRep, ...prevList]);
      return localRep;
    }
  };

  // 특정 날짜에 해당하는 렙 필터링 함수
  const getFilteredReps = (selectedDate) => {
    return repList.filter(rep => {
      if (!rep.completed_at) return false;
      const repDate = new Date(rep.completed_at);
      return repDate.getFullYear() === selectedDate.getFullYear() &&
             repDate.getMonth() === selectedDate.getMonth() &&
             repDate.getDate() === selectedDate.getDate();
    });
  };

  // 비로그인 상태일 때 로컬스토리지에 저장
  useEffect(() => {
    if (!isAuthenticated && repList.length > 0) {
      try {
        localStorage.setItem('repList', JSON.stringify(repList));
      } catch (error) {
        console.error('로컬스토리지에 저장 실패:', error);
      }
    }
  }, [repList, isAuthenticated]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchReps();
  }, [isAuthenticated, user]);

  return {
    repList,
    loading,
    fetchReps,
    addRep,
    getFilteredReps
  };
};

export default useReps;
