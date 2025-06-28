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
    
    // 상태 버튼들이 표시되는지 확인
    expect(screen.getByText('Achieved')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Goal Changed')).toBeInTheDocument();
  });
  
  test('상태를 선택하지 않고 제출하면 경고가 표시됩니다', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();
    
    // alert 모의 함수 생성
    const originalAlert = window.alert;
    window.alert = jest.fn();
    
    render(
      <RetrospectiveModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSubmit={mockOnSubmit} 
      />
    );
    
    // 제출 버튼 클릭
    fireEvent.click(screen.getByText('Submit'));
    
    // 경고 메시지가 표시되었는지 확인
    expect(window.alert).toHaveBeenCalledWith('Please select a status for the Rep!');
    
    // onSubmit이 호출되지 않았는지 확인
    expect(mockOnSubmit).not.toHaveBeenCalled();
    
    // 원래 alert 함수 복원
    window.alert = originalAlert;
  });
  
  test('상태를 선택하고 제출하면 onSubmit이 호출됩니다', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();
    
    render(
      <RetrospectiveModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSubmit={mockOnSubmit} 
      />
    );
    
    // 상태 선택
    fireEvent.click(screen.getByText('Achieved'));
    
    // 제출 버튼 클릭
    fireEvent.click(screen.getByText('Submit'));
    
    // onSubmit이 올바른 인자와 함께 호출되었는지 확인
    expect(mockOnSubmit).toHaveBeenCalledWith('Achieved', '');
  });
});
