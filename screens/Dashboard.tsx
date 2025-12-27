import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, ResponsiveContainer, Cell, XAxis, YAxis } from 'recharts';
import Modal from '../components/Modal';
import AddSessionModal from '../components/AddSessionModal';
import { ToastContainer, createToast } from '../components/Toast';
import { useDemoData } from '../contexts/DemoDataContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useSchedule } from '../contexts/ScheduleContext';
import { useStudents } from '../contexts/StudentsContext';
import { TodoItem } from '../data/demoData';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { hasDemoData, getDemoData } = useDemoData();
    const { profile } = useUserProfile();
    const { allScheduleItems, currentDate, setCurrentDate, addScheduleItem } = useSchedule();
    const { students } = useStudents();
    const [searchTerm, setSearchTerm] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [showNewClassModal, setShowNewClassModal] = useState(false);
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [showAddSessionModal, setShowAddSessionModal] = useState(false);
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [chartPeriod, setChartPeriod] = useState<'weekly' | 'monthly'>('weekly');
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' | 'warning' }>>([]);

    useEffect(() => {
        if (hasDemoData) {
            const demo = getDemoData();
            setTodos(demo.todos);
        } else {
            setTodos([]);
        }
    }, [hasDemoData, getDemoData]);

    const chartData = hasDemoData 
        ? (chartPeriod === 'weekly' ? getDemoData().weeklyChartData : getDemoData().monthlyChartData)
        : (chartPeriod === 'weekly' 
            ? [{ name: 'Mon', value: 0 }, { name: 'Tue', value: 0 }, { name: 'Wed', value: 0 }, { name: 'Thu', value: 0 }, { name: 'Fri', value: 0 }, { name: 'Sat', value: 0 }, { name: 'Sun', value: 0 }]
            : [{ name: 'Jan', value: 0 }, { name: 'Feb', value: 0 }, { name: 'Mar', value: 0 }, { name: 'Apr', value: 0 }, { name: 'May', value: 0 }, { name: 'Jun', value: 0 }]);

    const handleTodoToggle = useCallback((id: string) => {
        setTodos(prev => prev.map(todo => 
            todo.id === id ? { ...todo, done: !todo.done } : todo
        ));
    }, []);

    const handleNewClass = useCallback((data: {
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
            id: `class-${data.studentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
        createToast('New class created successfully!', 'success', setToasts);
    }, [addScheduleItem]);

    const handleAddStudent = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        createToast('Student added successfully!', 'success', setToasts);
        setShowAddStudentModal(false);
    }, []);

    const handleAddSession = useCallback((data: {
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
            id: `session-${data.studentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
        createToast('Session added successfully!', 'success', setToasts);
    }, [addScheduleItem]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const getWeekDates = useCallback(() => {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return { weekStart, weekEnd };
    }, [currentDate]);

    const getWeekDayDates = useCallback(() => {
        const { weekStart } = getWeekDates();
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            return { day, date: date.getDate() };
        });
    }, [getWeekDates]);

    // Calculate classes today
    const classesToday = useMemo(() => {
        const today = new Date();
        const todayDayOfWeek = (today.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
        return allScheduleItems.filter(item => item.day === todayDayOfWeek).length;
    }, [allScheduleItems]);

    // Calculate total sessions count
    const totalSessions = useMemo(() => {
        return allScheduleItems.length;
    }, [allScheduleItems]);

    // Calculate active students
    const activeStudents = useMemo(() => {
        return students.filter(s => s.status === 'Active').length;
    }, [students]);

    // Calculate sessions completed this month
    const sessionsThisMonth = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        // For now, we'll count all schedule items as completed sessions
        // In a real app, you'd track which sessions were actually completed
        return allScheduleItems.length;
    }, [allScheduleItems]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (showNotifications && !(e.target as Element).closest('.notifications-dropdown')) {
                setShowNotifications(false);
            }
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [showNotifications]);
    return (
        <>
            <header className="hidden lg:flex items-center justify-between px-10 py-8 shrink-0 z-20">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">Welcome back, Alex</h1>
                    <div className="flex items-center gap-6 text-secondary text-sm font-medium mt-1">
                        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-green-500"></span> Online</span>
                        <span className="w-px h-3 bg-stone-300"></span>
                        <span>{classesToday} {classesToday === 1 ? 'class' : 'classes'} today</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-surface border border-white shadow-sm rounded-full px-5 h-12 w-64 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                        <span className="material-symbols-outlined text-stone-400 text-[20px]">search</span>
                        <input 
                            id="search" 
                            name="search" 
                            className="bg-transparent border-none text-sm text-stone-800 placeholder-stone-400 focus:ring-0 w-full h-full ml-2" 
                            placeholder="Search..." 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative notifications-dropdown">
                        <button 
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="size-12 rounded-full bg-surface border border-white flex items-center justify-center text-stone-600 hover:text-stone-900 hover:shadow-md transition-all shadow-sm relative"
                        >
                            <span className="material-symbols-outlined text-[24px]">notifications</span>
                            <span className="absolute top-1 right-1 size-2 bg-red-500 rounded-full"></span>
                        </button>
                        {showNotifications && (
                            <div className="absolute right-0 top-14 w-80 bg-surface rounded-2xl shadow-xl border border-white p-4 z-50">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-stone-900">Notifications</h3>
                                    <button className="text-xs text-primary hover:text-primary-content">Mark all read</button>
                                </div>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    <div className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors">
                                        <p className="text-sm font-bold text-stone-900">New student request</p>
                                        <p className="text-xs text-stone-500">John Doe wants to join your class</p>
                                        <p className="text-[10px] text-stone-400 mt-1">2 minutes ago</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors">
                                        <p className="text-sm font-bold text-stone-900">Payment received</p>
                                        <p className="text-xs text-stone-500">$65 from James Smith</p>
                                        <p className="text-[10px] text-stone-400 mt-1">1 hour ago</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={() => setShowNewClassModal(true)}
                        className="px-5 h-12 rounded-full bg-accent text-white font-medium flex items-center gap-2 hover:bg-stone-800 transition-colors shadow-lg shadow-stone-800/20"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        <span>New Class</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 lg:px-10 pb-10 custom-scrollbar">
                <div className="max-w-[1400px] mx-auto">
                    {/* Stats Row */}
                    <div className="flex flex-wrap items-center justify-between mb-8 gap-8 px-2">
                        <div className="flex items-baseline gap-2">
                            <span className="text-xs font-bold text-secondary uppercase tracking-widest">Students</span>
                            <span className="text-3xl font-light text-stone-800">{students.length}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xs font-bold text-secondary uppercase tracking-widest">Sessions</span>
                            <span className="text-3xl font-light text-stone-800">{totalSessions}</span>
                        </div>
                        <div className="flex items-center gap-4 flex-1 max-w-md hidden md:flex">
                            <span className="text-xs font-bold text-secondary uppercase tracking-widest whitespace-nowrap">Monthly Goal</span>
                            <div className="h-10 flex-1 bg-white rounded-full p-1 flex items-center relative overflow-hidden shadow-inner">
                                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ccc 0, #ccc 1px, transparent 0, transparent 10px)' }}></div>
                                <div className="h-full bg-accent rounded-full text-white text-xs font-bold flex items-center justify-center relative z-10 w-[0%]">
                                    0%
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="size-10 rounded-full border border-stone-300 flex items-center justify-center bg-white shadow-sm">
                                <span className="material-symbols-outlined text-stone-600 text-[20px]">payments</span>
                            </span>
                            <div className="flex flex-col">
                                <span className="text-2xl font-light text-stone-800">$0</span>
                                <span className="text-[10px] uppercase font-bold text-secondary">Earned</span>
                            </div>
                        </div>
                    </div>

                    {/* Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">
                        {/* Profile Card */}
                        <div className="md:col-span-4 xl:col-span-3 bg-gradient-to-b from-stone-200 to-stone-300 rounded-3xl p-1 relative overflow-hidden bento-card h-[340px]">
                            <div className="absolute inset-0 bg-stone-300 mix-blend-multiply opacity-20"></div>
                            <div className="w-full h-full rounded-[1.25rem] overflow-hidden relative group">
                                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: 'url("https://picsum.photos/400/500?random=2")' }}></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white border border-white/30 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1">
                                    <span className="size-1.5 bg-primary rounded-full animate-pulse"></span>
                                    Available
                                </div>
                                <div className="absolute bottom-6 left-6 right-6">
                                    <h3 className="text-2xl font-bold text-white mb-1">{profile.firstName} {profile.lastName}</h3>
                                    <p className="text-stone-300 text-sm mb-4">{profile.title}</p>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center justify-between text-xs text-stone-200">
                                            <span>Total Students</span>
                                            <span className="font-bold text-white">{activeStudents} Active</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-stone-200">
                                            <span>Rating</span>
                                            <span className="font-bold text-white flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-primary">star</span> 4.9</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/settings')}
                                        className="w-full h-10 rounded-full bg-white text-stone-900 font-bold text-sm hover:bg-primary transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                        Edit Profile
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Earnings Chart */}
                        <div className="md:col-span-8 xl:col-span-6 bg-surface rounded-3xl p-6 bento-card shadow-card border border-white h-[340px] flex flex-col relative">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-stone-800">Earnings Summary</h3>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-4xl font-light text-stone-800">$0 <span className="text-sm text-stone-400 font-medium">this week</span></span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setChartPeriod('weekly')}
                                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                                            chartPeriod === 'weekly' 
                                                ? 'bg-stone-100 text-stone-600 hover:bg-stone-200' 
                                                : 'bg-white border border-stone-200 text-stone-400 hover:text-stone-600'
                                        }`}
                                    >
                                        Weekly
                                    </button>
                                    <button 
                                        onClick={() => setChartPeriod('monthly')}
                                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                                            chartPeriod === 'monthly' 
                                                ? 'bg-stone-100 text-stone-600 hover:bg-stone-200' 
                                                : 'bg-white border border-stone-200 text-stone-400 hover:text-stone-600'
                                        }`}
                                    >
                                        Monthly
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 w-full relative -ml-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} barSize={40} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={false} />
                                        <YAxis axisLine={false} tickLine={false} tick={false} />
                                        <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                                            {chartData.map((entry, index) => {
                                                const isHighlight = chartPeriod === 'weekly' 
                                                    ? (entry.name === 'Fri' || entry.name === 'Wed')
                                                    : index === chartData.length - 1;
                                                return (
                                                    <Cell 
                                                        key={`cell-${index}`} 
                                                        fill={isHighlight ? (entry.name === 'Fri' || index === chartData.length - 1 ? '#FACC15' : '#292524') : '#E5E5E5'} 
                                                    />
                                                );
                                            })}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                                <div className="flex justify-between px-4 text-[10px] font-bold text-stone-400 uppercase mt-2">
                                    {chartPeriod === 'weekly' ? (
                                        <>
                                            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                                        </>
                                    ) : (
                                        chartData.map(entry => <span key={entry.name}>{entry.name}</span>)
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Top Students */}
                        <div className="md:col-span-12 xl:col-span-3 bg-[#FFFBF0] rounded-3xl p-0 bento-card shadow-card border border-white h-[340px] flex flex-col relative overflow-hidden">
                            <div className="p-6 pb-2 flex justify-between items-center z-10 bg-gradient-to-b from-[#FFFBF0] to-[#FFFBF0]/95">
                                <h3 className="text-lg font-bold text-stone-800">Top Students</h3>
                                <button 
                                    onClick={() => setShowAddStudentModal(true)}
                                    className="size-8 rounded-full bg-white flex items-center justify-center hover:bg-stone-50 transition-colors shadow-sm border border-stone-100"
                                >
                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                </button>
                            </div>
                            <div className="overflow-y-auto px-4 pb-4 flex-1 space-y-3 custom-scrollbar">
                                {students.length > 0 ? students.slice(0, 4).map((student, i) => (
                                    <div key={student.id} className="bg-white p-3 rounded-2xl border border-stone-100 shadow-sm flex items-center gap-3 group hover:border-primary/50 transition-all">
                                        <div className={`size-10 rounded-full ${i === 1 ? 'bg-primary/20 text-primary-content' : 'bg-stone-100 text-stone-600'} flex items-center justify-center font-bold text-sm`}>{student.initials}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between">
                                                <h4 className="text-sm font-bold text-stone-800 truncate">{student.name}</h4>
                                                <span className="text-[10px] font-bold text-stone-600 bg-stone-50 px-1.5 py-0.5 rounded">{student.progress || 'Not set'}</span>
                                            </div>
                                            <p className="text-[10px] text-stone-500 truncate">{student.subject} • Next: {student.nextSession}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-8 text-stone-400">
                                        <span className="material-symbols-outlined text-4xl mb-2">group</span>
                                        <p className="text-sm">No students yet</p>
                                        <p className="text-xs mt-1">Add your first student to get started</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Weekly Schedule */}
                        <div className="md:col-span-12 xl:col-span-9 bg-surface rounded-3xl p-8 bento-card shadow-card border border-white relative overflow-hidden flex flex-col h-[400px]">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-lg font-bold text-stone-800">Weekly Schedule</h3>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => {
                                                const newDate = new Date(currentDate);
                                                newDate.setDate(currentDate.getDate() - 7);
                                                setCurrentDate(newDate);
                                            }}
                                            className="size-8 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 text-stone-500"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                                        </button>
                                        <button 
                                            onClick={() => {
                                                const newDate = new Date(currentDate);
                                                newDate.setDate(currentDate.getDate() + 7);
                                                setCurrentDate(newDate);
                                            }}
                                            className="size-8 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 text-stone-500"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                                        </button>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowAddSessionModal(true)}
                                    className="px-4 py-1.5 rounded-full bg-accent text-white text-xs font-bold shadow-lg hover:bg-stone-800 flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-[14px]">add</span> Add Session
                                </button>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="min-w-[800px] grid grid-cols-[60px_1fr] h-full">
                                    <div className="relative py-3 text-[10px] font-bold text-stone-400 text-right pr-4 border-r border-stone-100 border-dashed h-full">
                                        {[6, 8, 10, 12, 14, 16, 18, 20, 22].map((hour, i) => {
                                            // Position labels at correct hours: 6, 8, 10, 12, 14, 16, 18, 20, 22
                                            const position = ((hour - 6) / 17) * 100;
                                            const timeLabel = hour === 12 ? '12:00 pm' : hour < 12 ? `${hour}:00 am` : `${hour - 12}:00 pm`;
                                            return (
                                                <span 
                                                    key={i} 
                                                    className="absolute -translate-y-1/2 whitespace-nowrap"
                                                    style={{ top: `${position}%` }}
                                                >
                                                    {timeLabel}
                                                </span>
                                            );
                                        })}
                                    </div>
                                    <div className="grid grid-cols-7 flex-1 relative pl-4">
                                        <div className="absolute inset-0 flex flex-col justify-between py-3 pointer-events-none z-0 pl-4">
                                            {[...Array(18)].map((_, i) => {
                                                // Position each line at the correct hour (6 AM to 11 PM = 18 time points for 17 hours)
                                                const hour = 6 + i;
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
                                        <div className="contents text-center">
                                            {getWeekDayDates().map(({ day, date }, i) => {
                                                const today = new Date();
                                                const isToday = today.getDate() === date && today.getMonth() === getWeekDates().weekStart.getMonth() && today.getFullYear() === getWeekDates().weekStart.getFullYear();
                                                return (
                                                    <div key={day} className="flex flex-col items-center gap-1 pb-4">
                                                        <span className={`text-[10px] font-bold ${isToday ? 'text-stone-800' : 'text-stone-400'}`}>{day}</span>
                                                        <span className={`text-sm font-bold ${isToday ? 'text-stone-800' : 'text-stone-300'}`}>{date}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {/* Events overlay */}
                                        {allScheduleItems.length === 0 ? (
                                            <div className="col-start-1 col-span-7 row-start-2 flex items-center justify-center text-stone-400">
                                                <div className="text-center">
                                                    <span className="material-symbols-outlined text-3xl mb-2">event</span>
                                                    <p className="text-xs">No sessions scheduled</p>
                                                </div>
                                            </div>
                                        ) : (
                                            allScheduleItems.map((item) => {
                                                // Calculate position based on startTime (6 AM = 0%, 11 PM = 100%)
                                                // Time range: 6 AM (6.0) to 11 PM (23.0) = 17 hours
                                                const startHour = item.startTime;
                                                // Clamp to visible range (6 AM to 11 PM)
                                                const clampedStart = Math.max(6, Math.min(23, startHour));
                                                const startPercent = ((clampedStart - 6) / 17) * 100;
                                                // Duration in percentage of the 17-hour range
                                                const durationPercent = (item.duration / 17) * 100;
                                                
                                                const colorClasses = {
                                                    amber: 'bg-amber-100 border-amber-400 text-amber-900',
                                                    blue: 'bg-blue-50 border-blue-400 text-blue-900',
                                                    stone: 'bg-stone-100 border-stone-200 text-stone-700',
                                                    accent: 'bg-accent text-white border-accent'
                                                };
                                                
                                                return (
                                                    <div 
                                                        key={item.id}
                                                        className="col-span-1 row-start-2 relative h-full z-10"
                                                        style={{ gridColumnStart: item.day + 1 }}
                                                    >
                                                        <div 
                                                            className={`absolute left-1 right-1 ${colorClasses[item.color]} ${item.isGroup ? 'rounded-lg p-2' : 'border-l-2 rounded p-1.5'} cursor-pointer hover:shadow-md transition-shadow`}
                                                            style={{ 
                                                                top: `${startPercent}%`,
                                                                height: `${durationPercent}%`
                                                            }}
                                                        >
                                                            <p className={`text-[9px] font-bold truncate ${item.color === 'accent' ? 'text-white' : ''}`}>
                                                                {item.title}
                                                            </p>
                                                            <p className={`text-[8px] truncate ${item.color === 'accent' ? 'text-stone-300' : 'opacity-80'}`}>
                                                                {item.subtitle}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Todo List / Badge */}
                        <div className="md:col-span-12 xl:col-span-3 flex flex-col md:flex-row xl:flex-col gap-6 h-[400px]">
                            <div className="flex-1 bg-surface rounded-3xl p-6 bento-card shadow-card border border-white flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-bold text-stone-800">To-Do List</h3>
                                    <button 
                                        onClick={() => createToast('Viewing all todos', 'info', setToasts)}
                                        className="text-xs font-bold text-primary hover:text-primary-content transition-colors"
                                    >
                                        View All
                                    </button>
                                </div>
                                <div className="space-y-3 mt-2 overflow-y-auto pr-1 custom-scrollbar">
                                    {todos.length > 0 ? todos.map((item) => (
                                        <div key={item.id} className={`flex items-start gap-3 group ${item.done ? 'opacity-60' : ''}`}>
                                            <input 
                                                id={`todo-${item.id}`} 
                                                name={`todo-${item.id}`} 
                                                type="checkbox" 
                                                checked={item.done}
                                                onChange={() => handleTodoToggle(item.id)}
                                                className="mt-1 rounded border-stone-300 text-primary focus:ring-primary/20 cursor-pointer" 
                                            />
                                            <div className="flex-1">
                                                <p className={`text-xs font-bold ${item.done ? 'text-stone-400 line-through' : 'text-stone-800 group-hover:text-primary'} transition-colors`}>{item.text}</p>
                                                <p className="text-[10px] text-stone-400">{item.due}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8 text-stone-400">
                                            <span className="material-symbols-outlined text-3xl mb-2">checklist</span>
                                            <p className="text-xs">No todos yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 bg-accent rounded-3xl p-6 bento-card shadow-xl shadow-stone-900/10 border border-stone-800 text-white relative overflow-hidden flex flex-col justify-center items-center text-center">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
                                <div className="relative z-10">
                                    <div className="size-12 rounded-full bg-stone-700 flex items-center justify-center mx-auto mb-3">
                                        <span className="material-symbols-outlined text-primary">emoji_events</span>
                                    </div>
                                    <h3 className="text-lg font-bold mb-1">Super Tutor!</h3>
                                    <p className="text-xs text-stone-400 mb-4">You've completed {sessionsThisMonth} {sessionsThisMonth === 1 ? 'session' : 'sessions'} this month.</p>
                                    <button 
                                        onClick={() => setShowBadgeModal(true)}
                                        className="px-4 py-2 rounded-full bg-white text-stone-900 text-xs font-bold hover:bg-primary transition-colors"
                                    >
                                        View Badge
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AddSessionModal
                isOpen={showNewClassModal}
                onClose={() => setShowNewClassModal(false)}
                onSubmit={handleNewClass}
                title="Create New Class"
            />

            <Modal isOpen={showAddStudentModal} onClose={() => setShowAddStudentModal(false)} title="Add New Student" size="md">
                <form onSubmit={handleAddStudent} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Full Name</label>
                        <input name="name" type="text" className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-primary/20 transition-all" placeholder="e.g., John Doe" required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Email</label>
                        <input name="email" type="email" className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-primary/20 transition-all" placeholder="john@example.com" required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Subject</label>
                        <select name="subject" className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-primary/20 transition-all" required>
                            <option value="">Select a subject</option>
                            {profile.subjects.map((subject) => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setShowAddStudentModal(false)} className="flex-1 px-4 py-3 rounded-full border border-stone-200 text-stone-600 font-bold text-sm hover:bg-stone-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 px-4 py-3 rounded-full bg-accent text-white font-bold text-sm hover:bg-stone-800 transition-colors">
                            Add Student
                        </button>
                    </div>
                </form>
            </Modal>

            <AddSessionModal
                isOpen={showAddSessionModal}
                onClose={() => setShowAddSessionModal(false)}
                onSubmit={handleAddSession}
                title="Add New Session"
            />

            <Modal isOpen={showBadgeModal} onClose={() => setShowBadgeModal(false)} title="Super Tutor Badge" size="sm">
                <div className="text-center space-y-4">
                    <div className="size-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                        <span className="material-symbols-outlined text-primary text-5xl">emoji_events</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-stone-900 mb-2">Super Tutor!</h3>
                        <p className="text-sm text-stone-600">You've completed {sessionsThisMonth} {sessionsThisMonth === 1 ? 'session' : 'sessions'} this month.</p>
                    </div>
                    <div className="pt-4">
                        <button 
                            onClick={() => setShowBadgeModal(false)}
                            className="w-full px-4 py-3 rounded-full bg-accent text-white font-bold text-sm hover:bg-stone-800 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
};

export default Dashboard;

