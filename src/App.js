import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import "react-datepicker/dist/react-datepicker.css"; // Datepicker CSS
import CurrentRep from './components/CurrentRep';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import RepList from './components/RepList';
import RetrospectiveModal from './components/RetrospectiveModal';
import Dashboard from './components/Dashboard';
import CalendarSection from './components/CalendarSection'; // Import CalendarSection
import Statistics from './components/Statistics/Statistics'; // 대시보드(주간/월간/연간) 컴포넌트 추가
import supabase from './supabaseClient';
import { useAuth } from './contexts/AuthContext';
import AuthModal from './components/Auth/AuthModal';
import UserProfile from './components/Auth/UserProfile';
import ConfirmModal from './components/ConfirmModal'; // 확인 모달 컴포넌트 추가
import RepDetailModal from './components/RepDetailModal'; // Rep 상세 정보 모달 컴포넌트 추가

// App component (the overall structure of our website) is defined here.
function App() {
  const [selectedDate, setSelectedDate] = useState(new Date()); // State for the selected date
  const [currentRep, setCurrentRep] = useState(null);
  const [repList, setRepList] = useState([]);
  const [isRetroModalOpen, setRetroModalOpen] = useState(false);
  const [repToReview, setRepToReview] = useState(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' 또는 'dashboard'
  const [showConfirmModal, setShowConfirmModal] = useState(false); // 확인 모달 표시 상태
  const [selectedRep, setSelectedRep] = useState(null); // 선택된 Rep 상태 추가
  const [isDetailModalOpen, setDetailModalOpen] = useState(false); // 상세 정보 모달 표시 상태 추가
  const [currentPage, setCurrentPage] = useState(1); // 페이지네이션을 위한 현재 페이지 상태
  const itemsPerPage = 10; // 한 페이지에 보여줄 아이템 개수
  
  const { user, isAuthenticated } = useAuth();

  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(true); // Start as paused
  const [endTime, setEndTime] = useState(null); // State to store the target end time
  const [lastSuccessfulRepMinutes, setLastSuccessfulRepMinutes] = useState(15); // 마지막으로 성공한 렙의 타이머 길이 (기본값 15분)

  // 앱이 시작될 때 데이터를 가져옵니다 (로그인 상태에 따라 다른 소스에서 가져옴)
  const fetchReps = async () => {
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
      }
    } catch (error) {
      console.error('데이터 가져오기 중 오류 발생:', error);
    }
  };
  
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchReps();
      fetchLastSuccessfulRepMinutes(); // 로그인 사용자의 마지막 성공 렙 시간 불러오기
    } else if (!isAuthenticated) {
      // 비로그인 상태일 때 로컬스토리지에서 가져오기
      try {
        const savedReps = localStorage.getItem('repList');
        if (savedReps) {
          setRepList(JSON.parse(savedReps));
        }
        
        // 마지막 성공 렙 시간 불러오기
        const savedLastSuccessfulRepMinutes = localStorage.getItem('lastSuccessfulRepMinutes');
        if (savedLastSuccessfulRepMinutes) {
          setLastSuccessfulRepMinutes(Number(savedLastSuccessfulRepMinutes));
        }
      } catch (error) {
        console.error('로컬스토리지에서 데이터 가져오기 실패:', error);
      }
    }
  }, [isAuthenticated, user]);
  
  // 비로그인 상태일 때만 로컬스토리지에 저장
  useEffect(() => {
    if (!isAuthenticated && repList.length > 0) {
      try {
        localStorage.setItem('repList', JSON.stringify(repList));
      } catch (error) {
        console.error('로컬스토리지에 저장 실패:', error);
      }
    }
  }, [repList, isAuthenticated]);

  const isToday = (date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  }

  // 마지막 성공 렙 시간 불러오기 함수
  const fetchLastSuccessfulRepMinutes = async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      // user_settings 테이블에서 사용자 설정 불러오기
      const { data, error } = await supabase
        .from('user_settings')
        .select('last_successful_rep_minutes')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('사용자 설정 불러오기 실패:', error);
        return;
      }
      
      if (data && data.last_successful_rep_minutes) {
        console.log('마지막 성공 렙 시간 불러오기 성공:', data.last_successful_rep_minutes);
        setLastSuccessfulRepMinutes(data.last_successful_rep_minutes);
      }
    } catch (error) {
      console.error('마지막 성공 렙 시간 불러오기 중 오류 발생:', error);
    }
  };
  
  // 마지막 성공 렙 시간 저장 함수
  const saveLastSuccessfulRepMinutes = async (minutes) => {
    console.log('마지막 성공 렙 시간 저장:', minutes);
    
    if (isAuthenticated && user) {
      try {
        // user_settings 테이블에 사용자 설정 저장/업데이트
        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            last_successful_rep_minutes: minutes,
            updated_at: new Date().toISOString()
          });
        
        if (error) {
          console.error('사용자 설정 저장 실패:', error);
        }
      } catch (error) {
        console.error('마지막 성공 렙 시간 저장 중 오류 발생:', error);
      }
    } else {
      // 비로그인 상태: 로컬스토리지에 저장
      try {
        localStorage.setItem('lastSuccessfulRepMinutes', minutes.toString());
      } catch (error) {
        console.error('로컬스토리지에 마지막 성공 렙 시간 저장 실패:', error);
      }
    }
  };

  // 새로운 Rep 시작 함수
  const handleStartRep = (goal, minutes) => {
    // 렙 생성은 오늘 날짜에서만 가능
    if (!isToday(selectedDate)) {
      alert("렙 생성은 오늘 날짜에서만 가능합니다.");
      return;
    }
    
    const newInitialSeconds = minutes * 60; // 분을 초로 변환
    
    const newRep = {
      id: Date.now(),
      goal: goal,
      initialSeconds: newInitialSeconds
    };
    
    setCurrentRep(newRep);
    setRemainingSeconds(newInitialSeconds);
    setEndTime(Date.now() + newInitialSeconds * 1000);
    setIsPaused(false);
  };

  const handleCompleteRep = useCallback((completedRep, finalSeconds) => {
    console.log('Rep 완료 처리:', completedRep, '최종 시간:', finalSeconds);
    new Audio('/alert.mp3').play().catch(() => console.log('Failed to play alert sound'));
    
    // 현재 Rep 초기화 및 회고 모달 표시
    setCurrentRep(null);
    
    // finalSeconds 값을 포함하여 repToReview 설정
    const reviewRep = {
      ...completedRep,
      finalSeconds: finalSeconds // 최종 시간 추가
    };
    
    setRepToReview(reviewRep);
    
    // 메인 스레드에서 모달 표시를 보장하기 위해 setTimeout 사용
    setTimeout(() => {
      console.log('회고 모달 표시 시도');
      setRetroModalOpen(true);
    }, 0);
  }, []);
  
  // 중간에 Rep을 완료하는 함수 (드래그 앤 드롭으로 호출) - 이제는 확인 모달을 표시하는 역할만 함
  const handleEarlyCompleteRep = () => {
    console.log('handleEarlyCompleteRep 함수 실행됨!', currentRep);
    if (!currentRep) {
      console.error('조기 완료할 Rep이 없습니다.');
      return;
    }
    
    // 확인 모달 표시
    setShowConfirmModal(true);
  };

  // 실제로 Rep을 완료시키는 함수 (확인 모달에서 '확인' 버튼 클릭 시 호출)
  const confirmEarlyComplete = () => {
    if (!currentRep) {
      console.error('완료할 Rep이 없습니다.');
      return;
    }
    
    // 실제 경과 시간 계산
    const elapsedSeconds = currentRep.initialSeconds - remainingSeconds;
    
    // 완료된 Rep 정보 설정
    const completedRep = {
      ...currentRep,
      completed_at: new Date().toISOString()
    };
    
    // 확인 모달 닫기
    setShowConfirmModal(false);
    
    // handleCompleteRep 호출하여 회고 모달 표시
    handleCompleteRep(completedRep, elapsedSeconds);
  };

  // More robust timer logic
  useEffect(() => {
    if (!currentRep || isPaused) {
      return;
    }

    const timerId = setInterval(() => {
      const newRemaining = Math.round((endTime - Date.now()) / 1000);

      if (newRemaining <= 0) {
        console.log('타이머 종료! Rep 완료 처리 시작');
        clearInterval(timerId); // 타이머 즉시 중지
        setRemainingSeconds(0);
        
        // 완료된 Rep 정보 설정
        const completedRep = {
          ...currentRep,
          completed_at: new Date().toISOString()
        };
        
        // 타이머 종료 후 즉시 모달 표시
        // 타이머가 정상적으로 종료된 경우 초기 설정 시간 그대로 전달
        handleCompleteRep(completedRep, currentRep.initialSeconds);
      } else {
        setRemainingSeconds(newRemaining);
      }
    }, 500); // Check more frequently for better accuracy

    return () => clearInterval(timerId);
  }, [isPaused, currentRep, endTime, handleCompleteRep]);



  const handleDeleteRep = () => {
    if (window.confirm('Are you sure you want to delete this Rep?')) {
      setCurrentRep(null);
    }
  };

  // 이전 handleDropRep 함수는 삭제 - handleEarlyCompleteRep로 대체됨

  const handleTogglePause = () => {
    setIsPaused(prevIsPaused => {
      const nowPaused = !prevIsPaused;
      if (!nowPaused) {
        // Resuming
        setEndTime(Date.now() + remainingSeconds * 1000);
      }
      return nowPaused;
    });
  };

  const handleRetroSubmit = async (notes) => {
    if (!repToReview) {
      console.error('repToReview가 없습니다.');
      return;
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
            return;
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
          return;
        }
        
        // 저장 성공 확인
        if (insertData && insertData.length > 0) {
          console.log('데이터 저장 성공!', insertData);
          
          // 성공적으로 저장되면 목록에 추가 (fetchReps 호출 전에)
          setRepList(prevList => [insertData[0], ...prevList]);
        } else {
          console.log('데이터 저장은 성공했지만 반환된 데이터가 없습니다.');
        }
        
        // 성공적으로 저장되면 목록 새로고침
        await fetchReps(); // 추출된 fetchReps 함수 호출
        
        // 오늘 날짜로 선택 변경 (데이터가 보이도록)
        setSelectedDate(new Date());
      } catch (err) {
        console.error('데이터 처리 중 오류 발생:', err);
        alert('제출 중 오류가 발생했습니다: ' + err.message);
      }
    } else {
      // 비로그인 상태: 로컬스토리지에 저장
      const localRep = {
        ...reviewedRep,
        id: Date.now(), // 로컬에서 사용할 임시 ID
        completedAt: reviewedRep.completed_at // 기존 코드와 호환성 유지
      };
      
      setRepList(prevList => [localRep, ...prevList]);
    }
    
    // 모달 닫기
    setRetroModalOpen(false);
    setRepToReview(null);
  };

  // 선택된 날짜에 해당하는 렙만 필터링
  const filteredReps = repList.filter(rep => {
    // 데이터베이스와 로컬스토리지의 필드명 차이를 처리
    const completionDate = rep.completedAt || rep.completed_at;
    if (!completionDate) return false;
    
    const repDate = new Date(completionDate);
    return repDate.getFullYear() === selectedDate.getFullYear() &&
           repDate.getMonth() === selectedDate.getMonth() &&
           repDate.getDate() === selectedDate.getDate();
  });
  
  // 페이지네이션을 위한 데이터 계산
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReps.slice(indexOfFirstItem, indexOfLastItem);
  
  const totalPages = Math.ceil(filteredReps.length / itemsPerPage);

  // 로그인/회원가입 모달 열기
  const handleOpenAuthModal = () => {
    setAuthModalOpen(true);
  };
  
  // 로그인/회원가입 모달 닫기
  const handleCloseAuthModal = () => {
    setAuthModalOpen(false);
  };
  
  // Rep 카드 클릭 시 실행될 함수
  const handleRepCardClick = (rep) => {
    setSelectedRep(rep);
    setDetailModalOpen(true);
  };
  
  // 페이지 변경 함수
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  
  // 날짜가 변경될 때 페이지를 1로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate]);

  return (
    // Container for the entire app
    <DndProvider backend={HTML5Backend}>
      <div className="app-container">
      {/* 헤더 영역에 로그인/회원가입 버튼 추가 */}
      <div className="app-header">
        <h1>Rep</h1>
        <div className="auth-section">
          {isAuthenticated ? (
            <UserProfile />
          ) : (
            <button onClick={handleOpenAuthModal} className="auth-button">로그인 / 회원가입</button>
          )}
        </div>
      </div>
      
      {/* 탭에 따라 다른 콘텐츠 표시 */}
      {activeTab === 'daily' ? (
        <div className="main-content">
        <div className="left-panel">
          {/* Calendar area */}
          <CalendarSection 
            selectedDate={selectedDate} 
            setSelectedDate={setSelectedDate} 
          />
          {/* List area (core feature implementation target) */}
          <RepList 
            reps={currentItems} 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onDropRep={handleEarlyCompleteRep} 
            onRepCardClick={handleRepCardClick} 
          />
        </div>
        <div className="right-panel">
          {/* Current Rep area (core feature implementation target) */}
          <CurrentRep
          key={lastSuccessfulRepMinutes} // 이 key가 변경될 때마다 컴포넌트가 리셋됩니다.
          rep={currentRep}
          remainingSeconds={remainingSeconds}
          isPaused={isPaused}
          onTogglePause={handleTogglePause}
          onStart={handleStartRep}
          onDelete={handleDeleteRep}
          defaultMinutes={lastSuccessfulRepMinutes}
        />  
          {/* Dashboard area */}
          <Dashboard reps={filteredReps} setActiveTab={setActiveTab} />
        </div>
      </div>
      ) : (
        <Statistics setActiveTab={setActiveTab} />
      )}
      
      {/* 회고 모달 - z-index를 높게 설정하여 항상 다른 요소들 위에 표시되도록 함 */}
      <RetrospectiveModal 
        isOpen={isRetroModalOpen}
        onSubmit={handleRetroSubmit}
      />
      
      {/* 로그인/회원가입 모달 */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuthModal}
      />
      
      {/* 확인 모달 */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onConfirm={confirmEarlyComplete}
        onCancel={() => setShowConfirmModal(false)}
      />
      
      {/* Rep 상세 정보 모달 */}
      <RepDetailModal 
        isOpen={isDetailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        rep={selectedRep}
      />
    </div>
    </DndProvider>
  );
}

// Export the App component so it can be used in other files.
export default App;
