import React from 'react';
import { useDrop } from 'react-dnd';
import RepCard from './RepCard';
import './RepList.css';

function RepList({ reps, onDropRep }) {
  // useDrop 훈을 부모 div에 적용
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
    hover: (item, monitor) => {
      const isHovering = monitor.isOver({ shallow: false });
      if (isHovering) {
        // 필요한 추가 로직 구현 가능
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver({ shallow: false }),
      canDrop: !!monitor.canDrop(),
    }),
  }), [onDropRep]);

  // 드래그 상태에 따라 클래스 이름 동적 부여
  const dropZoneClassName = `drop-zone-wrapper ${isOver && canDrop ? 'is-over' : ''}`;
  const listClassName = 'list-area';

  return (
    // 드롭 존으로 사용할 부모 div 추가
    <div className={dropZoneClassName} ref={drop}>
      <div className={listClassName}>
        <h3 className="list-title">History</h3>
        <div className="rep-card-list">
          {reps.length === 0 ? (
            <p className="empty-list-message">No completed Reps yet.</p>
          ) : (
            reps.map(rep => <RepCard key={rep.id} rep={rep} />)
          )}
        </div>
      </div>
    </div>
  );
}

export default RepList;
