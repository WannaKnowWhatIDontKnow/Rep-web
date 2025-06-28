import { render, screen } from '@testing-library/react';
import RepCard from './RepCard';

describe('RepCard 컴포넌트', () => {
  test('렙 카드가 올바르게 렌더링됩니다', () => {
    const mockRep = {
      goal: '테스트 목표',
      initialSeconds: 1800, // 30분
      status: 'Achieved'
    };
    
    render(<RepCard rep={mockRep} />);
    
    // 목표 텍스트가 화면에 표시되는지 확인
    expect(screen.getByText('테스트 목표')).toBeInTheDocument();
    
    // 시간이 올바르게 표시되는지 확인
    expect(screen.getByText('30min')).toBeInTheDocument();
  });
  
  test('initialSeconds가 유효하지 않을 때 0min으로 표시됩니다', () => {
    const mockRep = {
      goal: '테스트 목표',
      initialSeconds: NaN,
      status: 'Achieved'
    };
    
    render(<RepCard rep={mockRep} />);
    
    // NaN일 때 0min으로 표시되는지 확인
    expect(screen.getByText('0min')).toBeInTheDocument();
  });
});
