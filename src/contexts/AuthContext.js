import React, { createContext, useState, useEffect, useContext } from 'react';
import supabase from '../supabaseClient';

// 인증 정보를 관리하는 컨텍스트를 생성합니다
const AuthContext = createContext();

// 이 컴포넌트는 앱 전체를 감싸서 모든 곳에서 인증 정보에 접근할 수 있게 합니다
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 현재 로그인된 사용자 정보를 확인합니다
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error('사용자 세션 확인 중 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    // 초기 사용자 정보 확인
    checkUser();

    // 로그인 상태 변화를 감지하는 이벤트 리스너 설정
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 다른 컴포넌트에서 인증 컨텍스트를 쉽게 사용할 수 있게 해주는 훅
export function useAuth() {
  return useContext(AuthContext);
}
