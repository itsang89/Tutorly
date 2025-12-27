import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Modal from '../components/Modal';
import AddSessionModal from '../components/AddSessionModal';
import { ToastContainer, createToast } from '../components/Toast';
import { useSchedule } from '../contexts/ScheduleContext';
import { useStudents } from '../contexts/StudentsContext';

type ViewType = 'week' | 'month' | 'day';

const Schedule: React.FC = () => {
    const { currentDate, setCurrentDate, allScheduleItems, addScheduleItem } = useSchedule();
    const [searchTerm, setSearchTerm] = useState('');
    const [viewType, setViewType] = useState<ViewType>('week');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showNewEventModal, setShowNewEventModal] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' | 'warning' }>>([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    const handleNewEvent = useCallback((data: {
        studentId: string;
        student: any;
        date: string;
        time: string;
        duration: number;
    }) => {
        // Convert date and time to schedule item
        const [hours, minutes] = data.time.split(':').map(Number);
        const dateObj = new Date(data.date);
        const dayOfWeek = (dateObj.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
        const startTime = hours + (minutes / 60);
        const durationHours = data.duration / 60;

        const scheduleItem = {
            id: `event-${data.studentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: data.student.name,
            subtitle: data.student.subject,
            day: dayOfWeek,
            startTime: startTime,
            duration: durationHours,
            color: (data.student.color as 'amber' | 'blue' | 'stone' | 'accent') || 'stone',
            isGroup: false,
            date: data.date, // Store the actual date
            studentId: data.studentId, // Store student ID for price lookup
        };

        addScheduleItem(scheduleItem);
        createToast('Event created successfully!', 'success', setToasts);
    }, [addScheduleItem]);

    const handleAcceptRequest = useCallback(() => {
        createToast('Session request accepted!', 'success', setToasts);
        setShowRequestModal(false);
    }, []);

    const handleDeclineRequest = useCallback(() => {
        createToast('Session request declined', 'info', setToasts);
        setShowRequestModal(false);
    }, []);

    const handleNavigateWeek = useCallback((direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
            return newDate;
        });
    }, [setCurrentDate]);

    const handleNavigateMonth = useCallback((direction: 'prev' | 'next') => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
            return newDate;
        });
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const getWeekDates = useCallback(() => {
        const start = new Date(currentDate);
        start.setDate(currentDate.getDate() - currentDate.getDay() + 1);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return { start, end };
    }, [currentDate]);

    const getWeekDayDates = useCallback(() => {
        const { start } = getWeekDates();
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            return { day, date: date.getDate() };
        });
    }, [getWeekDates]);

    // Calculate sessions this week
    const sessionsThisWeek = useMemo(() => {
        const { start, end } = getWeekDates();
        // Count all schedule items (they're displayed weekly, so all items count)
        return allScheduleItems.length;
    }, [allScheduleItems, getWeekDates]);

    // Calculate total hours
    const totalHours = useMemo(() => {
        const total = allScheduleItems.reduce((sum, item) => sum + item.duration, 0);
        return Math.round(total * 10) / 10; // Round to 1 decimal place
    }, [allScheduleItems]);

    const getWeekNumber = useCallback(() => {
        const d = new Date(currentDate);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
        const week1 = new Date(d.getFullYear(), 0, 4);
        return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    }, [currentDate]);

    const getCalendarDays = useCallback(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        const days = [];
        
        // Previous month's days
        const prevMonth = new Date(year, month - 1, 0);
        const prevMonthDays = prevMonth.getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            days.push({ date: prevMonthDays - i, isCurrentMonth: false, isToday: false });
        }
        
        // Current month's days
        const today = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
            days.push({ date: i, isCurrentMonth: true, isToday });
        }
        
        // Next month's days to fill the grid
        const remainingDays = 42 - days.length; // 6 rows * 7 days
        for (let i = 1; i <= remainingDays; i++) {
            days.push({ date: i, isCurrentMonth: false, isToday: false });
        }
        
        return days;
    }, [currentMonth]);

    const getCurrentTimePosition = useCallback(() => {
        const now = currentTime;
        const hour = now.getHours();
        const minutes = now.getMinutes();
        
        // Timetable shows 6 AM to 11 PM (17 hours)
        const startHour = 6;
        const endHour = 23;
        
        // Check if current time is within the visible range
        if (hour < startHour || hour >= endHour) {
            return null;
        }
        
        // Calculate position as percentage (0% = 6 AM, 100% = 11 PM)
        const totalMinutes = (hour - startHour) * 60 + minutes;
        const totalRangeMinutes = (endHour - startHour) * 60; // 17 hours = 1020 minutes
        const position = (totalMinutes / totalRangeMinutes) * 100;
        
        return position;
    }, [currentTime]);

    const isCurrentDayInWeek = useCallback(() => {
        const today = currentTime;
        const { start } = getWeekDates();
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        
        // Check if today is within the week range
        return today >= start && today <= end;
    }, [currentTime, getWeekDates]);

    // Update current time every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute
        
        return () => clearInterval(interval);
    }, []);

    const weekDates = getWeekDates();
    return (
        <>
            <header className="hidden lg:flex items-center justify-between px-10 py-8 shrink-0 z-20">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">Schedule</h1>
                    <div className="flex items-center gap-6 text-secondary text-sm font-medium mt-1">
                        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary animate-pulse"></span> {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        <span className="w-px h-3 bg-stone-300"></span>
                        <span>Week {getWeekNumber()}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-surface border border-white shadow-sm rounded-full px-5 h-12 w-64 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                        <span className="material-symbols-outlined text-stone-400 text-[20px]">search</span>
                        <input 
                            className="bg-transparent border-none text-sm text-stone-800 placeholder-stone-400 focus:ring-0 w-full h-full ml-2" 
                            placeholder="Search sessions..." 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                     <button 
                        onClick={() => setShowNewEventModal(true)}
                        className="px-5 h-12 rounded-full bg-accent text-white font-medium flex items-center gap-2 hover:bg-stone-800 transition-colors shadow-lg shadow-stone-800/20"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        <span>New Event</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 lg:px-10 pb-10">
                <div className="max-w-[1600px] mx-auto h-full flex flex-col">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full min-h-[600px]">
                        <div className="xl:col-span-9 flex flex-col gap-6">
                            {/* Controls */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-32">
                                <div className="md:col-span-2 bg-surface rounded-3xl p-6 bento-card shadow-card border border-white flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex flex-col text-center sm:text-left">
                                        <h2 className="text-xl font-bold text-stone-900">
                                            {weekDates.start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {weekDates.end.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                                        </h2>
                                        <p className="text-sm text-stone-400 font-medium">{sessionsThisWeek} {sessionsThisWeek === 1 ? 'active session' : 'active sessions'} this week</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-stone-100 rounded-full p-1">
                                        <button 
                                            onClick={() => setViewType('week')}
                                            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                                                viewType === 'week' 
                                                    ? 'bg-white text-stone-900 shadow-sm' 
                                                    : 'text-stone-500 hover:text-stone-900'
                                            }`}
                                        >
                                            Week
                                        </button>
                                        <button 
                                            onClick={() => setViewType('month')}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                                viewType === 'month' 
                                                    ? 'bg-white text-stone-900 shadow-sm' 
                                                    : 'text-stone-500 hover:text-stone-900'
                                            }`}
                                        >
                                            Month
                                        </button>
                                        <button 
                                            onClick={() => setViewType('day')}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                                viewType === 'day' 
                                                    ? 'bg-white text-stone-900 shadow-sm' 
                                                    : 'text-stone-500 hover:text-stone-900'
                                            }`}
                                        >
                                            Day
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleNavigateWeek('prev')}
                                            className="size-10 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 text-stone-600 transition-colors"
                                        >
                                            <span className="material-symbols-outlined">chevron_left</span>
                                        </button>
                                        <button 
                                            onClick={() => handleNavigateWeek('next')}
                                            className="size-10 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 text-stone-600 transition-colors"
                                        >
                                            <span className="material-symbols-outlined">chevron_right</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-primary rounded-3xl p-6 bento-card shadow-glow border border-primary/20 flex flex-col justify-center relative overflow-hidden group min-h-[100px]">
                                    <div className="absolute right-0 top-0 size-32 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/30 transition-colors"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-2 text-primary-content/70">
                                            <span className="material-symbols-outlined text-[20px]">schedule</span>
                                            <span className="text-xs font-bold uppercase tracking-wider">Total Hours</span>
                                        </div>
                                        <span className="text-4xl font-display font-bold text-primary-content">{totalHours}h</span>
                                        <span className="text-xs font-medium text-primary-content/80 mt-1">+0h from last week</span>
                                    </div>
                                </div>
                            </div>

                            {/* Calendar Grid */}
                            <div className="flex-1 bg-surface rounded-3xl p-0 bento-card shadow-card border border-white relative flex flex-col overflow-hidden min-h-[500px]">
                                {/* Header Row */}
                                <div className="grid grid-cols-[70px_1fr] border-b border-stone-100 bg-stone-50/50">
                                    <div className="border-r border-stone-100"></div>
                                    <div className="grid grid-cols-7 text-center py-4">
                                        {getWeekDayDates().map(({ day, date }, i) => {
                                            const today = new Date();
                                            const isToday = today.getDate() === date && today.getMonth() === getWeekDates().start.getMonth() && today.getFullYear() === getWeekDates().start.getFullYear();
                                            return (
                                                <div key={day} className="flex flex-col gap-1">
                                                    <span className={`text-xs font-bold ${isToday ? 'text-primary' : 'text-stone-400'} uppercase`}>{day}</span>
                                                    {isToday ? (
                                                        <div className="size-8 mx-auto bg-primary text-primary-content rounded-full flex items-center justify-center font-bold text-lg shadow-glow">{date}</div>
                                                    ) : (
                                                        <span className="text-lg font-bold text-stone-800">{date}</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                {/* Body */}
                                <div className="flex-1 overflow-hidden relative">
                                    <div className="grid grid-cols-[70px_1fr] h-[800px]">
                                        <div className="relative py-3 text-xs font-medium text-stone-400 text-right border-r border-stone-100 bg-stone-50/30 h-full overflow-hidden">
                                            {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((hour, i) => {
                                                // Position labels at correct hours (6 AM to 11 PM)
                                                // Container height is 800px, 17 hours total
                                                // Each hour position: (hour - 6) / 17 * 800px
                                                const CONTAINER_HEIGHT = 800;
                                                const HOURS_IN_RANGE = 17;
                                                const hourPosition = ((hour - 6) / HOURS_IN_RANGE) * CONTAINER_HEIGHT;
                                                const timeLabel = hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
                                                return (
                                                    <span 
                                                        key={i} 
                                                        className="absolute -translate-y-1/2 whitespace-nowrap font-semibold right-2"
                                                        style={{ top: `${hourPosition}px` }}
                                                    >
                                                        {timeLabel}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                        <div className="relative grid grid-cols-7 w-full h-full">
                                            {/* Grid Lines */}
                                            <div className="absolute inset-0 pointer-events-none z-0">
                                                {[...Array(18)].map((_, i) => {
                                                    // Position each line at the correct hour (6 AM to 11 PM = 18 time points for 17 hours)
                                                    const position = (i / 17) * 100;
                                                    return (
                                                        <div 
                                                            key={i} 
                                                            className="border-b border-stone-100 border-dashed w-full absolute"
                                                            style={{ top: `${position}%` }}
                                                        ></div>
                                                    );
                                                })}
                                            </div>
                                            <div className="absolute inset-0 grid grid-cols-7 pointer-events-none z-0">
                                                {[...Array(7)].map((_, i) => <div key={i} className="border-r border-stone-100 h-full"></div>)}
                                            </div>

                                            {/* Current Time Indicator */}
                                            {(() => {
                                                const timePosition = getCurrentTimePosition();
                                                const isTodayInWeek = isCurrentDayInWeek();
                                                if (timePosition !== null && isTodayInWeek) {
                                                    return (
                                                        <div 
                                                            className="absolute left-0 right-0 z-30 pointer-events-none"
                                                            style={{ top: `${timePosition}%` }}
                                                        >
                                                            <div className="flex items-center">
                                                                <div className="size-3 rounded-full bg-red-500 border-2 border-white shadow-lg -ml-1.5"></div>
                                                                <div className="flex-1 h-0.5 bg-red-500"></div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}

                                            {/* Day Columns with Events */}
                                            {allScheduleItems.length === 0 ? (
                                                <div className="col-start-1 col-span-7 flex items-center justify-center text-stone-400 py-8">
                                                    <div className="text-center">
                                                        <span className="material-symbols-outlined text-4xl mb-2">event</span>
                                                        <p className="text-sm">No sessions scheduled</p>
                                                    </div>
                                                </div>
                                            ) : (() => {
                                                const CONTAINER_HEIGHT = 800;
                                                const HOURS_IN_RANGE = 17;
                                                const HEIGHT_PER_HOUR = CONTAINER_HEIGHT / HOURS_IN_RANGE;
                                                
                                                // Group events by day
                                                const eventsByDay: { [day: number]: typeof allScheduleItems } = {};
                                                allScheduleItems.forEach(item => {
                                                    if (!eventsByDay[item.day]) {
                                                        eventsByDay[item.day] = [];
                                                    }
                                                    eventsByDay[item.day].push(item);
                                                });
                                                
                                                // Calculate overlapping positions for events on the same day
                                                const calculateEventLayout = (events: typeof allScheduleItems) => {
                                                    const sorted = [...events].sort((a, b) => a.startTime - b.startTime);
                                                    const eventLayouts = new Map<string, { column: number; totalColumns: number }>();
                                                    
                                                    // Build overlap groups
                                                    const groups: typeof sorted[] = [];
                                                    
                                                    sorted.forEach(event => {
                                                        const start = Math.max(6, Math.min(23, event.startTime));
                                                        const end = start + event.duration;
                                                        
                                                        // Find a group this event overlaps with
                                                        let addedToGroup = false;
                                                        for (const group of groups) {
                                                            const hasOverlap = group.some(other => {
                                                                const otherStart = Math.max(6, Math.min(23, other.startTime));
                                                                const otherEnd = otherStart + other.duration;
                                                                return !(end <= otherStart || start >= otherEnd);
                                                            });
                                                            
                                                            if (hasOverlap) {
                                                                group.push(event);
                                                                addedToGroup = true;
                                                                break;
                                                            }
                                                        }
                                                        
                                                        if (!addedToGroup) {
                                                            groups.push([event]);
                                                        }
                                                    });
                                                    
                                                    // Assign columns within each group
                                                    groups.forEach(group => {
                                                        const totalColumns = group.length;
                                                        group.forEach((event, index) => {
                                                            eventLayouts.set(event.id, {
                                                                column: index,
                                                                totalColumns: totalColumns
                                                            });
                                                        });
                                                    });
                                                    
                                                    return eventLayouts;
                                                };
                                                
                                                // Render day columns
                                                return Array.from({ length: 7 }, (_, dayIndex) => {
                                                    const dayEvents = eventsByDay[dayIndex] || [];
                                                    const layouts = calculateEventLayout(dayEvents);
                                                    
                                                    return (
                                                        <div 
                                                            key={dayIndex}
                                                            className="relative h-full"
                                                            style={{ gridColumn: dayIndex + 1 }}
                                                        >
                                                            {dayEvents.map((item) => {
                                                                const startHour = item.startTime;
                                                                const clampedStart = Math.max(6, Math.min(23, startHour));
                                                                const startPixels = ((clampedStart - 6) / HOURS_IN_RANGE) * CONTAINER_HEIGHT;
                                                                const heightPixels = HEIGHT_PER_HOUR * item.duration;
                                                                
                                                                const layout = layouts.get(item.id);
                                                                const column = layout?.column || 0;
                                                                const totalColumns = layout?.totalColumns || 1;
                                                                const widthPercent = 100 / totalColumns;
                                                                const leftPercent = column * widthPercent;
                                                                
                                                                const colorClasses = {
                                                                    amber: 'bg-amber-50 border-amber-400 text-amber-900',
                                                                    blue: 'bg-blue-50 border-blue-400 text-blue-900',
                                                                    stone: 'bg-stone-100 border-stone-200 text-stone-700',
                                                                    accent: 'bg-accent text-white border-accent'
                                                                };
                                                                
                                                                return (
                                                                        <div 
                                                                        key={item.id}
                                                                        className={`absolute ${colorClasses[item.color]} border-l-4 rounded-lg cursor-pointer hover:shadow-lg transition-all group overflow-hidden flex flex-col z-10`}
                                                                        style={{ 
                                                                            top: `${startPixels}px`,
                                                                            height: `${Math.max(heightPixels, 28)}px`,
                                                                            left: `${leftPercent}%`,
                                                                            width: `${widthPercent}%`,
                                                                            padding: '6px 8px',
                                                                            boxSizing: 'border-box',
                                                                            minHeight: '28px',
                                                                            marginLeft: column > 0 ? '3px' : '0px',
                                                                            marginRight: column < totalColumns - 1 ? '3px' : '0px'
                                                                        }}
                                                                    >
                                                                        <p className={`text-[11px] font-bold leading-[1.3] ${item.color === 'accent' ? 'text-white' : ''} break-words`} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                                                            {item.title}
                                                                        </p>
                                                                        {heightPixels > 32 && (
                                                                            <p className={`text-[10px] font-medium leading-[1.3] mt-0.5 ${item.color === 'accent' ? 'text-stone-200' : 'opacity-75'}`} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                                                                {item.subtitle}
                                                                            </p>
                                                                        )}
                                                                        {heightPixels > 48 && (
                                                                            <p className={`text-[9px] font-medium leading-[1.3] mt-0.5 ${item.color === 'accent' ? 'text-stone-300' : 'opacity-60'}`} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                                                                {Math.floor(item.startTime)}:{String(Math.round((item.startTime % 1) * 60)).padStart(2, '0')} - {Math.floor(item.startTime + item.duration)}:{String(Math.round(((item.startTime + item.duration) % 1) * 60)).padStart(2, '0')}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Right */}
                        <div className="xl:col-span-3 flex flex-col gap-6">
                            <div className="bg-surface rounded-3xl p-6 bento-card shadow-card border border-white">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="font-bold text-stone-900">
                                        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </span>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => handleNavigateMonth('prev')}
                                            className="size-6 flex items-center justify-center hover:bg-stone-100 rounded-full text-stone-500"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                                        </button>
                                        <button 
                                            onClick={() => handleNavigateMonth('next')}
                                            className="size-6 flex items-center justify-center hover:bg-stone-100 rounded-full text-stone-500"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-stone-400 mb-2">
                                    <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                                </div>
                                <div className="grid grid-cols-7 text-center text-xs gap-y-3">
                                    {getCalendarDays().map((day, i) => {
                                        const isInWeekRange = day.isCurrentMonth && getWeekDayDates().some(wd => wd.date === day.date);
                                        if (!day.isCurrentMonth) {
                                            return <span key={i} className="text-stone-300">{day.date}</span>;
                                        }
                                        if (day.isToday) {
                                            return (
                                                <span key={i} className="bg-primary text-primary-content font-bold rounded-full size-6 flex items-center justify-center mx-auto shadow-sm">
                                                    {day.date}
                                                </span>
                                            );
                                        }
                                        if (isInWeekRange) {
                                            return (
                                                <span key={i} className="bg-stone-100 rounded-full size-6 flex items-center justify-center mx-auto">
                                                    {day.date}
                                                </span>
                                            );
                                        }
                                        return <span key={i}>{day.date}</span>;
                                    })}
                                </div>
                            </div>
                            <div className="bg-surface rounded-3xl p-6 bento-card shadow-card border border-white flex-1 flex flex-col">
                                <h3 className="font-bold text-stone-800 mb-4">Upcoming</h3>
                                <div className="space-y-4 overflow-y-auto flex-1 custom-scrollbar pr-2">
                                    <div className="text-center py-8 text-stone-400">
                                        <span className="material-symbols-outlined text-4xl mb-2">event</span>
                                        <p className="text-sm">No upcoming sessions</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AddSessionModal
                isOpen={showNewEventModal}
                onClose={() => setShowNewEventModal(false)}
                onSubmit={handleNewEvent}
                title="Create New Event"
            />

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
};

export default Schedule;
