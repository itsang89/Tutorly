import React, { useState, useCallback, useMemo } from 'react';
import { useSchedule } from '../contexts/ScheduleContext';
import { useStudents } from '../contexts/StudentsContext';
import { useEarnings } from '../contexts/EarningsContext';
import { ScheduleItem } from '../types';
import { ToastContainer, createToast } from '../components/Toast';
import Modal from '../components/Modal';
import AddSessionModal from '../components/AddSessionModal';

type FilterType = 'all' | 'past' | 'future';

interface LessonWithDate extends ScheduleItem {
    lessonDate: Date;
    lessonDateTime: Date;
}

const Lessons: React.FC = () => {
    const { scheduleItems, removeScheduleItem, addScheduleItem } = useSchedule();
    const { students } = useStudents();
    const { removeTransactionsByScheduleItemId } = useEarnings();
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' | 'warning' }>>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [lessonToDelete, setLessonToDelete] = useState<{ id: string; title: string; originalId?: string } | null>(null);
    const [showAddLessonModal, setShowAddLessonModal] = useState(false);

    // Helper function to get current date/time in Hong Kong timezone
    const getHKNow = useCallback(() => {
        const now = new Date();
        // Get current time in HK timezone
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Hong_Kong',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        const parts = formatter.formatToParts(now);
        const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
        const month = parseInt(parts.find(p => p.type === 'month')?.value || '0');
        const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
        const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
        const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
        const second = parseInt(parts.find(p => p.type === 'second')?.value || '0');
        
        return new Date(year, month - 1, day, hour, minute, second);
    }, []);

    // Convert schedule items to lessons with dates
    const lessonsWithDates = useMemo(() => {
        const lessons: LessonWithDate[] = [];

        scheduleItems.forEach((item) => {
            if (item.date) {
                // Item has a specific date - interpret it in HK timezone
                // The date string is in YYYY-MM-DD format, interpret it as HK date
                const [year, month, day] = item.date.split('-').map(Number);
                const lessonDate = new Date(year, month - 1, day);
                const [hours, minutes] = [Math.floor(item.startTime), Math.round((item.startTime % 1) * 60)];
                lessonDate.setHours(hours, minutes, 0, 0);
                
                lessons.push({
                    ...item,
                    lessonDate: new Date(lessonDate),
                    lessonDateTime: new Date(lessonDate),
                });
            } else {
                // Recurring item - generate instances for past 30 days and next 30 days
                // Use HK time to determine "today"
                const hkNow = getHKNow();
                for (let i = -30; i <= 30; i++) {
                    const date = new Date(hkNow);
                    date.setDate(hkNow.getDate() + i);
                    const dayOfWeek = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
                    
                    if (dayOfWeek === item.day) {
                        const [hours, minutes] = [Math.floor(item.startTime), Math.round((item.startTime % 1) * 60)];
                        date.setHours(hours, minutes, 0, 0);
                        
                        lessons.push({
                            ...item,
                            id: `${item.id}-${date.toISOString()}`,
                            lessonDate: new Date(date),
                            lessonDateTime: new Date(date),
                        });
                    }
                }
            }
        });

        return lessons.sort((a, b) => b.lessonDateTime.getTime() - a.lessonDateTime.getTime());
    }, [scheduleItems, getHKNow]);

    const filteredLessons = useMemo(() => {
        // Get current time in HK timezone (with full time, not just date)
        const hkNow = getHKNow();

        let filtered = lessonsWithDates;

        // Apply date filter using HK time
        // Compare full date and time, not just date
        if (filter === 'past') {
            filtered = filtered.filter(lesson => {
                const lessonDateTime = new Date(lesson.lessonDateTime);
                return lessonDateTime < hkNow;
            });
        } else if (filter === 'future') {
            filtered = filtered.filter(lesson => {
                const lessonDateTime = new Date(lesson.lessonDateTime);
                return lessonDateTime >= hkNow;
            });
        }

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(lesson =>
                lesson.title.toLowerCase().includes(term) ||
                lesson.subtitle.toLowerCase().includes(term)
            );
        }

        return filtered;
    }, [lessonsWithDates, filter, searchTerm, getHKNow]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const handleDeleteClick = useCallback((lesson: LessonWithDate) => {
        // Check if this is a recurring item (can't delete those)
        if (lesson.id.startsWith('recurring-')) {
            createToast('Cannot delete recurring sessions. Remove them from the student\'s schedule instead.', 'warning', setToasts);
            return;
        }
        
        // Extract the original schedule item ID (in case it has a date suffix for recurring instances)
        // For one-off items with dates, the ID is the original ID
        // For recurring items, the ID might be like: recurring-xxx-yyy-2024-01-01T...
        // But we already check for recurring above, so this should be a one-off item
        const originalId = lesson.id;
        
        setLessonToDelete({ id: lesson.id, title: lesson.title, originalId });
        setDeleteModalOpen(true);
    }, []);

    const handleConfirmDelete = useCallback(() => {
        if (lessonToDelete) {
            const scheduleItemId = lessonToDelete.originalId || lessonToDelete.id;
            
            // Remove the schedule item
            removeScheduleItem(scheduleItemId);
            
            // Remove related earnings transactions
            removeTransactionsByScheduleItemId(scheduleItemId);
            
            createToast('Session deleted successfully', 'success', setToasts);
            setDeleteModalOpen(false);
            setLessonToDelete(null);
        }
    }, [lessonToDelete, removeScheduleItem, removeTransactionsByScheduleItemId]);

    const handleCancelDelete = useCallback(() => {
        setDeleteModalOpen(false);
        setLessonToDelete(null);
    }, []);

    const handleAddLesson = useCallback((data: {
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
            id: `lesson-${data.studentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
        createToast('Lesson added successfully!', 'success', setToasts);
        setShowAddLessonModal(false);
    }, [addScheduleItem]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const isPast = useCallback((date: Date) => {
        // Get current time in HK timezone (with full time, not just date)
        const hkNow = getHKNow();
        
        // Compare lesson date and time with current HK time
        const lessonDateTime = new Date(date);
        return lessonDateTime < hkNow;
    }, [getHKNow]);

    const pastCount = useMemo(() => {
        return lessonsWithDates.filter(l => isPast(l.lessonDateTime)).length;
    }, [lessonsWithDates, isPast]);

    const futureCount = useMemo(() => {
        return lessonsWithDates.filter(l => !isPast(l.lessonDateTime)).length;
    }, [lessonsWithDates, isPast]);

    return (
        <>
            <header className="hidden lg:flex items-center justify-between px-10 py-8 shrink-0 z-20">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">All Lessons</h1>
                    <div className="flex items-center gap-6 text-secondary text-sm font-medium mt-1">
                        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary"></span> {lessonsWithDates.length} Total Lessons</span>
                        <span className="w-px h-3 bg-stone-300"></span>
                        <span>{pastCount} Past • {futureCount} Upcoming</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-surface border border-white shadow-sm rounded-full px-5 h-12 w-64 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                        <span className="material-symbols-outlined text-stone-400 text-[20px]">search</span>
                        <input 
                            className="bg-transparent border-none text-sm text-stone-800 placeholder-stone-400 focus:ring-0 w-full h-full ml-2" 
                            placeholder="Search lessons..." 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setShowAddLessonModal(true)}
                        className="px-5 h-12 rounded-full bg-accent text-white font-medium flex items-center gap-2 hover:bg-stone-800 transition-colors shadow-lg shadow-stone-800/20"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        <span>Add Lesson</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 lg:px-10 pb-10 custom-scrollbar">
                <div className="max-w-[1400px] mx-auto space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-surface p-6 rounded-3xl border border-white shadow-card flex items-center justify-between bento-card">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-600">
                                    <span className="material-symbols-outlined">event</span>
                                </div>
                                <div>
                                    <p className="text-secondary text-xs font-bold uppercase tracking-wider mb-1">Total Lessons</p>
                                    <h3 className="text-3xl font-display font-light text-stone-800">{lessonsWithDates.length}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="bg-surface p-6 rounded-3xl border border-white shadow-card flex items-center justify-between bento-card">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
                                    <span className="material-symbols-outlined">history</span>
                                </div>
                                <div>
                                    <p className="text-secondary text-xs font-bold uppercase tracking-wider mb-1">Past Lessons</p>
                                    <h3 className="text-3xl font-display font-light text-stone-800">{pastCount}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="bg-surface p-6 rounded-3xl border border-white shadow-card flex items-center justify-between bento-card">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                                    <span className="material-symbols-outlined">schedule</span>
                                </div>
                                <div>
                                    <p className="text-secondary text-xs font-bold uppercase tracking-wider mb-1">Upcoming</p>
                                    <h3 className="text-3xl font-display font-light text-stone-800">{futureCount}</h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-surface rounded-3xl p-6 bento-card shadow-card border border-white">
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                                    filter === 'all' 
                                        ? 'bg-accent text-white shadow-sm' 
                                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                }`}
                            >
                                All Lessons
                            </button>
                            <button 
                                onClick={() => setFilter('past')}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                                    filter === 'past' 
                                        ? 'bg-accent text-white shadow-sm' 
                                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                }`}
                            >
                                Past
                            </button>
                            <button 
                                onClick={() => setFilter('future')}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                                    filter === 'future' 
                                        ? 'bg-accent text-white shadow-sm' 
                                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                }`}
                            >
                                Upcoming
                            </button>
                        </div>
                    </div>

                    {/* Lessons List */}
                    <div className="bg-surface border border-white shadow-card rounded-[2rem] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-stone-100 bg-surface-secondary">
                            <h3 className="font-bold text-stone-900">Lessons ({filteredLessons.length})</h3>
                        </div>
                        <div className="overflow-auto flex-1 p-4 bg-surface custom-scrollbar">
                            {filteredLessons.length > 0 ? (
                                <div className="space-y-3">
                                    {filteredLessons.map((lesson) => {
                                        const isPastLesson = isPast(lesson.lessonDateTime);
                                        // Find student by ID or name to get price per hour
                                        const student = lesson.studentId 
                                            ? students.find(s => s.id === lesson.studentId)
                                            : students.find(s => s.name === lesson.title);
                                        const pricePerHour = student?.pricePerHour;
                                        const pricePerLesson = pricePerHour ? (pricePerHour * lesson.duration) : null;
                                        const colorClasses = {
                                            amber: 'bg-amber-50 border-amber-400 text-amber-900',
                                            blue: 'bg-blue-50 border-blue-400 text-blue-900',
                                            stone: 'bg-stone-100 border-stone-200 text-stone-700',
                                            accent: 'bg-accent text-white border-accent'
                                        };

                                        return (
                                            <div 
                                                key={lesson.id} 
                                                className={`p-4 rounded-2xl border-l-4 ${
                                                    isPastLesson 
                                                        ? 'bg-stone-50 border-stone-300 opacity-75' 
                                                        : colorClasses[lesson.color]
                                                } hover:shadow-md transition-all group`}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h4 className={`text-sm font-bold ${lesson.color === 'accent' && !isPastLesson ? 'text-white' : 'text-stone-800'}`}>
                                                                {lesson.title}
                                                            </h4>
                                                            {isPastLesson && (
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-200 text-stone-600 uppercase">
                                                                    Past
                                                                </span>
                                                            )}
                                                            {!isPastLesson && (
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase">
                                                                    Upcoming
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-xs mb-3 ${lesson.color === 'accent' && !isPastLesson ? 'text-stone-200' : 'text-stone-600'}`}>
                                                            {lesson.subtitle}
                                                        </p>
                                                        <div className="flex items-center gap-4 text-xs">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={`material-symbols-outlined text-[16px] ${lesson.color === 'accent' && !isPastLesson ? 'text-stone-300' : 'text-stone-400'}`}>
                                                                    calendar_today
                                                                </span>
                                                                <span className={lesson.color === 'accent' && !isPastLesson ? 'text-stone-200' : 'text-stone-600'}>
                                                                    {formatDate(lesson.lessonDate)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={`material-symbols-outlined text-[16px] ${lesson.color === 'accent' && !isPastLesson ? 'text-stone-300' : 'text-stone-400'}`}>
                                                                    schedule
                                                                </span>
                                                                <span className={lesson.color === 'accent' && !isPastLesson ? 'text-stone-200' : 'text-stone-600'}>
                                                                    {formatTime(lesson.lessonDateTime)} - {(() => {
                                                                        const endTime = new Date(lesson.lessonDateTime);
                                                                        endTime.setHours(endTime.getHours() + lesson.duration);
                                                                        return formatTime(endTime);
                                                                    })()}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={`material-symbols-outlined text-[16px] ${lesson.color === 'accent' && !isPastLesson ? 'text-stone-300' : 'text-stone-400'}`}>
                                                                    timer
                                                                </span>
                                                                <span className={lesson.color === 'accent' && !isPastLesson ? 'text-stone-200' : 'text-stone-600'}>
                                                                    {lesson.duration} {lesson.duration === 1 ? 'hour' : 'hours'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteClick(lesson);
                                                            }}
                                                            className={`opacity-0 group-hover:opacity-100 transition-opacity size-8 rounded-full flex items-center justify-center ${
                                                                lesson.color === 'accent' && !isPastLesson 
                                                                    ? 'bg-white/20 hover:bg-white/30 text-white' 
                                                                    : 'bg-stone-100 hover:bg-red-100 text-stone-600 hover:text-red-600'
                                                            }`}
                                                            title="Delete session"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                        {pricePerHour && (
                                                            <div className="text-right">
                                                                <span className={`text-xs ${lesson.color === 'accent' && !isPastLesson ? 'text-stone-300' : 'text-stone-500'}`}>
                                                                    ${pricePerHour.toFixed(2)}/hr
                                                                </span>
                                                            </div>
                                                        )}
                                                        {pricePerLesson && (
                                                            <div className="text-right">
                                                                <span className={`text-lg font-bold ${lesson.color === 'accent' && !isPastLesson ? 'text-white' : 'text-stone-800'}`}>
                                                                    ${pricePerLesson.toFixed(2)}
                                                                </span>
                                                                <span className={`text-xs block ${lesson.color === 'accent' && !isPastLesson ? 'text-stone-300' : 'text-stone-500'}`}>
                                                                    per lesson
                                                                </span>
                                                            </div>
                                                        )}
                                                        {!pricePerHour && (
                                                            <span className={`text-xs ${lesson.color === 'accent' && !isPastLesson ? 'text-stone-300' : 'text-stone-400'}`}>
                                                                No price set
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-stone-400">
                                    <span className="material-symbols-outlined text-5xl mb-2">event_busy</span>
                                    <p className="text-sm font-bold text-stone-600">No lessons found</p>
                                    <p className="text-xs text-stone-400 mt-1">
                                        {searchTerm ? 'Try adjusting your search' : 'Create your first lesson to get started'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ToastContainer toasts={toasts} removeToast={removeToast} />

            {/* Add Lesson Modal */}
            <AddSessionModal
                isOpen={showAddLessonModal}
                onClose={() => setShowAddLessonModal(false)}
                onSubmit={handleAddLesson}
                title="Add New Lesson"
            />

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={handleCancelDelete}
                title="Delete Session"
                size="sm"
            >
                <div className="flex flex-col gap-6">
                    <p className="text-stone-600">
                        Are you sure you want to delete the session <span className="font-bold text-stone-900">"{lessonToDelete?.title}"</span>? This action cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={handleCancelDelete}
                            className="px-4 py-2 rounded-full bg-stone-100 text-stone-700 font-medium hover:bg-stone-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            className="px-4 py-2 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default Lessons;

