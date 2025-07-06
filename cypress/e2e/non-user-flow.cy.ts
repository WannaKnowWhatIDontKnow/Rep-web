/// <reference types="cypress" />

describe('비회원 사용자 핵심 기능 테스트', () => {
  // 각 테스트 케이스가 실행되기 전에 항상 먼저 실행되는 코드
  beforeEach(() => {
    // 테스트를 시작하기 전에 로컬 스토리지를 깨끗하게 비운다
    cy.clearLocalStorage();
    // 우리 앱의 메인 페이지에 접속한다
    cy.visit('http://localhost:3000');
  });

  it('접속 시 기본 화면이 올바르게 표시되어야 한다', () => {
    // 'Rep'이라는 제목이 화면에 보이는지 확인
    cy.contains('h1', 'Rep').should('be.visible');
    // '+' 버튼이 화면에 보이는지 확인
    cy.get('.plus-icon').should('be.visible');
  });

  it('첫 Rep을 성공적으로 생성하고 완료한 후, 새로고침해도 데이터가 유지되어야 한다', () => {
    const goalText = '나의 첫 E2E 테스트 Rep';
    const noteText = 'Cypress가 작성한 회고 노트';

    // 1. CurrentRep 영역의 '+' 버튼을 찾아서 클릭한다
    cy.get('.plus-icon').click();

    // 2. 목표 입력창을 찾아서 목표를 타이핑한다
    cy.get('.initial-goal-input').type(goalText);

    // 3. '시작하기' 버튼을 클릭한다
    cy.get('.start-rep-button').click();

    // 4. 타이머가 화면에 보이는지 확인한다
    cy.get('.rep-timer').should('be.visible');

    // 5. '중단' 버튼을 클릭해서 즉시 완료시킨다
    cy.get('.interrupt-button').click();

    // 6. 확인 모달의 '확인' 버튼을 클릭한다
    cy.contains('button', '확인').click();

    // 7. 회고 모달이 나타났는지 확인한다
    cy.contains('h2', 'Rep을 완료했습니다!').should('be.visible');

    // 8. 회고 노트에 텍스트를 입력한다
    cy.get('.notes-input-content textarea').type(noteText);

    // 9. '기록하기' 버튼을 클릭한다
    cy.get('.retro-submit-button').click();

    // 10. 왼쪽 Rep 리스트에 방금 만든 Rep 카드가 보이는지 확인한다
    cy.get('.rep-card-list').contains(goalText).should('be.visible');

    // 11. 페이지를 새로고침한다
    cy.reload();

    // 12. 새로고침 후에도 Rep 카드가 여전히 리스트에 남아있는지 확인한다
    cy.get('.rep-card-list').contains(goalText).should('be.visible');
  });
});