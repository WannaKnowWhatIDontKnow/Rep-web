import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RetrospectiveModal from './RetrospectiveModal';

describe('RetrospectiveModal 컴포넌트', () => {
  test('모달이 열렸을 때 올바르게 렌더링됩니다', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();
    
    render(
      <RetrospectiveModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSubmit={mockOnSubmit} 
      />
    );
    
    // 모달 제목이 표시되는지 확인
    expect(screen.getByText('Rep Complete!')).toBeInTheDocument();
  });
  

  
  test('제출하면 onSubmit이 notes 값과 함께 호출됩니다', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();
    
    render(
      <RetrospectiveModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSubmit={mockOnSubmit} 
      />
    );
    
    // 제출 버튼 클릭
    fireEvent.click(screen.getByText('Submit'));
    
    // onSubmit이 notes 값만 가지고 호출되는지 확인
    expect(mockOnSubmit).toHaveBeenCalledWith('');
  });
});
