import React from 'react';
import { useDrop } from 'react-dnd';
import RepCard from './RepCard';
import './RepList.css';

function RepList({ reps, onDropRep }) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'REP_CARD', // 'REP_CARD' 타입의 아이템만 받을 수 있음
    drop: (item, monitor) => {
      console.log('드래그 앤 드롭 발생!', item);
      if (onDropRep) {
        onDropRep();
      } else {
        console.error('onDropRep 함수가 없습니다!');
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [onDropRep]); // onDropRep이 변경될 때마다 훈 재실행

  // 드래그 상태에 따라 클래스 이름 동적 부여
  const listClassName = `list-area ${isOver && canDrop ? 'is-over' : ''}`;

  return (
    <div className={listClassName} ref={drop}>
      <h3 className="list-title">History</h3>
      <div className="rep-card-list">
        {reps.length === 0 ? (
          <p className="empty-list-message">No completed Reps yet.</p>
        ) : (
          reps.map(rep => <RepCard key={rep.id} rep={rep} />)
        )}
      </div>
    </div>
  );
}

export default RepList;
