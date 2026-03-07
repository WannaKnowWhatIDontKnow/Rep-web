import React from 'react';
import DatePicker from 'react-datepicker';
import { IoCalendarClearOutline } from "react-icons/io5";
import './CalendarSection.css';

// 날짜를 포맷팅하는 유틸리티 함수
const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
};

interface CalendarSectionProps {
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    repDates?: Record<string, number>;
}

const CalendarSection: React.FC<CalendarSectionProps> = ({ selectedDate, setSelectedDate, repDates = {} }) => {

    const toKey = (date: Date): string =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const getDayClassName = (date: Date): string => {
        const mins = repDates[toKey(date)] || 0;
        if (mins < 10) return '';
        if (mins < 30) return 'rep-day-low';
        if (mins < 120) return 'rep-day-medium';
        return 'rep-day-high';
    };

    // DatePicker에 표시될 커스텀 버튼
    const CustomDateButton = React.forwardRef<HTMLButtonElement, { onClick?: () => void }>(({ onClick }, ref) => (
        <button onClick={onClick} ref={ref} className="date-select-button">
            <IoCalendarClearOutline />
            <span>날짜 선택</span>
        </button>
    ));
    
    // 표시 이름 설정
    CustomDateButton.displayName = 'CustomDateButton';

    return (
        <div className="calendar-section">
            <span className="date-display">
                {formatDate(selectedDate)}
            </span>
            {/* ✨ 이 부분이 핵심적인 변경사항입니다. */}
            <div className="datepicker-container">
                <DatePicker
                    selected={selectedDate}
                    onChange={(date: Date | null) => {
                      if (date) {
                        setSelectedDate(date);
                      }
                    }}
                    customInput={<CustomDateButton />}
                    dayClassName={getDayClassName}
                    popperPlacement="bottom-end"
                />
            </div>
        </div>
    );
};

export default CalendarSection;
