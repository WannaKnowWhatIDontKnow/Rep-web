import React, { createContext, useState, useEffect, useContext } from 'react';
import supabase from '../supabaseClient';

// 인증 정보를 관리하는 컨텍스트를 생성합니다
const AuthContext = createContext();

// 이 컴포넌트는 앱 전체를 감싸서 모든 곳에서 인증 정보에 접근할 수 있게 합니다
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 세션 갱신 함수 추가
  const refreshSession = async () => {
    try {
          // 먼저 현재 세션이 유효한지 확인
      const { data: { session: currentSession }, error: currentSessionError } = await supabase.auth.getSession();
      
      // 세션이 있고 만료되지 않았다면 그대로 사용
      if (currentSession && new Date(currentSession.expires_at * 1000) > new Date()) {
        console.log('현재 세션이 유효함, 새로고침 스킵');
        setUser(currentSession.user);
        return currentSession.user;
      }
      
      // 세션이 없거나 만료된 경우에만 새로고침 시도
      console.log('세션 새로고침 시도');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('세션 새로고침 실패:', error);
        setUser(null);
        return null;
      }
      
      if (data && data.session) {
        console.log('세션 새로고침 성공, 유효기간:', new Date(data.session.expires_at * 1000));
        setUser(data.session.user);
        return data.session.user;
      } else {
        console.error('세션 새로고침 후 세션이 없습니다');
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error('세션 갱신 중 예외 발생:', error);
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    // 현재 로그인된 사용자 정보를 확인합니다
    const checkUser = async () => {
      try {
        await refreshSession();
      } catch (error) {
        console.error('사용자 세션 확인 중 오류:', error);
        setUser(null);
      } finally {
        setLoading(false); // loading 상태를 한 번만 false로 설정
      }
    };

    // 초기 사용자 정보 확인
    checkUser();

    // 로그인 상태 변화를 감지하는 이벤트 리스너 설정
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('인증 상태 변경:', event);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user || null);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else {
          // 다른 이벤트의 경우 세션을 다시 확인
          await refreshSession();
        }
        setLoading(false); // 인증 상태 변경 후 loading 상태를 false로 설정
      }
    );

    // 컴포넌트가 언마운트될 때 이벤트 리스너 정리
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // 회원가입 함수
  const signUp = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 로그인 함수
  const signIn = async (email, password) => {
    try {
      console.log('로그인 시도:', email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('로그인 오류:', error);
        throw error;
      }
      
      if (data && data.session) {
        console.log('로그인 성공, 세션 설정:', data.session.user.id);
        // 세션 설정
        setUser(data.session.user);
        
        // 세션 새로고침 테스트
        setTimeout(async () => {
          console.log('세션 상태 확인 시도');
          await refreshSession();
        }, 1000);
      } else {
        console.error('로그인 후 세션이 없습니다');
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('로그인 예외 발생:', error);
      return { success: false, error: error.message };
    }
  };

  // 로그아웃 함수
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 컨텍스트를 통해 제공할 값들
  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };

  // 로딩 중일 때는 하위 컴포넌트를 렌더링하지 않음
  if (loading) {
    return null; // 또는 <LoadingSpinner />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 다른 컴포넌트에서 인증 컨텍스트를 쉽게 사용할 수 있게 해주는 훅
export function useAuth() {
  return useContext(AuthContext);
}
