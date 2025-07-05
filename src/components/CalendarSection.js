import React from 'react';
import DatePicker from 'react-datepicker';
import { IoCalendarClearOutline } from "react-icons/io5";
import './CalendarSection.css';

// 날짜를 포맷팅하는 유틸리티 함수
const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
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
            {/* ✨ 이 부분이 핵심적인 변경사항입니다. */}
            <div className="datepicker-container">
                <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    customInput={<CustomDateButton />}
                    popperPlacement="bottom-end"
                />
            </div>
        </div>
    );
};

export default CalendarSection;
