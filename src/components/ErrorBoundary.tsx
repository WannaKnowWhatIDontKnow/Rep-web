// src/components/ErrorBoundary.tsx
import React from 'react';
import logger from '../utils/logger';

// ErrorBoundary의 props와 state에 대한 인터페이스 정의
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 다음 렌더링에서 폴백 UI가 보이도록 상태를 업데이트
    return { hasError: true, error: error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // 에러를 중앙 로거에 기록
    logger.error('ErrorBoundary에서 에러를 잡았습니다:', { error, errorInfo });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      // 직접 만든 폴백 UI를 렌더링
      return (
        <div style={{ padding: 20, backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8 }}>
          <h2>앗, 무언가 잘못되었어요.</h2>
          <p>이 영역을 표시하는 데 문제가 발생했습니다. 새로고침을 시도하거나 관리자에게 문의해주세요.</p>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: 10 }}>
            <summary>에러 상세 정보</summary>
            {this.state.error && this.state.error.toString()}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
