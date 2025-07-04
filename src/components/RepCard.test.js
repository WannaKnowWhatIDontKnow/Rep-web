import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RepCard from './RepCard';

describe('RepCard 컴포넌트', () => {
  test('렙 카드가 올바르게 렌더링됩니다', () => {
    const mockRep = {
      id: 1, // id 추가
      goal: '테스트 목표',
      initialSeconds: 1800, // 30분
      status: 'Achieved'
    };
    
    render(<RepCard rep={mockRep} onClick={() => {}} />); // onClick prop 추가
    
    // 목표 텍스트가 화면에 표시되는지 확인
    expect(screen.getByText('테스트 목표')).toBeInTheDocument();
    
    // 프로그레스 바가 존재하는지 확인
    const progressBar = document.querySelector('.rep-card-progress-bar');
    expect(progressBar).toBeInTheDocument();
  });
  
  test('initialSeconds가 유효하지 않을 때도 카드가 정상적으로 렌더링됩니다', () => {
    const mockRep = {
      id: 2, // id 추가
      goal: '테스트 목표',
      initialSeconds: NaN,
      status: 'Achieved'
    };
    
    render(<RepCard rep={mockRep} onClick={() => {}} />); // onClick prop 추가
    
    // 목표 텍스트가 화면에 표시되는지 확인
    expect(screen.getByText('테스트 목표')).toBeInTheDocument();
    
    // 프로그레스 바가 존재하는지 확인
    const progressBar = document.querySelector('.rep-card-progress-bar');
    expect(progressBar).toBeInTheDocument();
  });
});
