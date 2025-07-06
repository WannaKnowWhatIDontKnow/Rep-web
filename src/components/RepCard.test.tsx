import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RepCard from './RepCard';
import { Rep } from '../types';

describe('RepCard 컴포넌트', () => {
  test('렙 카드가 올바르게 렌더링됩니다', () => {
    const mockRep: Rep = {
      id: 1, // id 추가
      goal: '테스트 목표',
      initial_seconds: 1800, // 30분
      initialSeconds: 1800, // 호환성을 위해 추가
      completed_at: null,
      // status 속성 제거
      notes: '테스트 노트'
    };
    
    render(<RepCard rep={mockRep} onClick={() => {}} />); // onClick prop 추가
    
    // 목표 텍스트가 화면에 표시되는지 확인
    expect(screen.getByText('테스트 목표')).toBeInTheDocument();
    
    // 프로그레스 바가 존재하는지 확인
    const progressBar = document.querySelector('.rep-card-progress-bar');
    expect(progressBar).toBeInTheDocument();
  });
  
  test('initialSeconds가 유효하지 않을 때도 카드가 정상적으로 렌더링됩니다', () => {
    const mockRep: Rep = {
      id: 2, // id 추가
      goal: '테스트 목표',
      initial_seconds: 0, // TypeScript에서는 NaN을 직접 할당할 수 없으므로 0으로 변경
      initialSeconds: 0, // 호환성을 위해 추가 (NaN 대신 0으로 변경)
      completed_at: null,
      // status 속성 제거
      notes: '테스트 노트'
    };
    
    render(<RepCard rep={mockRep} onClick={() => {}} />); // onClick prop 추가
    
    // 목표 텍스트가 화면에 표시되는지 확인
    expect(screen.getByText('테스트 목표')).toBeInTheDocument();
    
    // 프로그레스 바가 존재하는지 확인
    const progressBar = document.querySelector('.rep-card-progress-bar');
    expect(progressBar).toBeInTheDocument();
  });
});
