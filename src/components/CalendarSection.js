import React from 'react';
import DatePicker from 'react-datepicker';
import { IoCalendarClearOutline } from "react-icons/io5";
import './CalendarSection.css';

// 날짜를 'yy.mm.dd' 형식으로 변환하는 유틸리티 함수
const formatDate = (date) => {
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}.${month}.${day}`;
};

const CalendarSection = ({ selectedDate, setSelectedDate }) => {

    // DatePicker에 표시될 커스텀 버튼
    const CustomDateButton = React.forwardRef(({ onClick }, ref) => (
        <button onClick={onClick} ref={ref} className="date-select-button">
            <IoCalendarClearOutline />
            <span>날짜 선택</span>
        </button>
    ));

    return (
        <div className="calendar-section">
            <span className="date-display">
                {formatDate(selectedDate)}
            </span>
            <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                customInput={<CustomDateButton />}
                popperPlacement="bottom-end"
            />
        </div>
    );
};

export default CalendarSection;
