import React from 'react';
import { WeeklyScheduleSlot } from '../types';

interface RecurringScheduleBadgeProps {
    schedule: WeeklyScheduleSlot[];
    onEdit: () => void;
}

const RecurringScheduleBadge: React.FC<RecurringScheduleBadgeProps> = ({ schedule, onEdit }) => {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    const formatTime = (startTime: number) => {
        const hour = Math.floor(startTime);
        const minutes = Math.round((startTime % 1) * 60);
        const period = hour >= 12 ? 'pm' : 'am';
        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        return `${displayHour}:${minutes === 0 ? '00' : minutes}${period}`;
    };

    if (!schedule || schedule.length === 0) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400 italic">No recurring schedule</span>
                <button
                    onClick={onEdit}
                    className="size-6 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors focus:ring-2 focus:ring-primary/50 focus:outline-none"
                    aria-label="Add recurring schedule"
                >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                </button>
            </div>
        );
    }

    const scheduleText = schedule
        .sort((a, b) => a.day - b.day)
        .map(slot => {
            const dayName = dayNames[slot.day];
            const time = formatTime(slot.startTime);
            return `${dayName} ${time}`;
        })
        .join(', ');

    return (
        <div className="flex items-center gap-2 group">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-stone-50 border border-stone-200 hover:bg-stone-100 transition-colors">
                <span className="material-symbols-outlined text-[14px] text-stone-500">repeat</span>
                <span className="text-xs font-medium text-stone-700 max-w-[200px] truncate" title={scheduleText}>
                    {scheduleText}
                </span>
            </div>
            <button
                onClick={onEdit}
                className="size-6 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity focus:ring-2 focus:ring-primary/50 focus:outline-none"
                aria-label="Edit recurring schedule"
            >
                <span className="material-symbols-outlined text-[14px]">edit</span>
            </button>
        </div>
    );
};

export default RecurringScheduleBadge;



