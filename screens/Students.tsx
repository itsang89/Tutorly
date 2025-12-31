import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Student, WeeklyScheduleSlot } from '../types';
import Modal from '../components/Modal';
import { ToastContainer, createToast } from '../components/Toast';
import { useDemoData } from '../contexts/DemoDataContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useStudents } from '../contexts/StudentsContext';
import { useSchedule } from '../contexts/ScheduleContext';

const Students: React.FC = () => {
    const { hasDemoData, getDemoData } = useDemoData();
    const { profile } = useUserProfile();
    const { students, addStudent, updateStudent, removeStudent } = useStudents();
    const { allScheduleItems } = useSchedule();
    const [searchTerm, setSearchTerm] = useState('');
    const [headerSearchTerm, setHeaderSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Paused' | 'Risk'>('all');
    const [subjectFilter, setSubjectFilter] = useState<string>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState<Student | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState<Student | null>(null);
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' | 'warning' }>>([]);
    const [newScheduleSlot, setNewScheduleSlot] = useState<Partial<WeeklyScheduleSlot>>({ day: 0, startTime: 9, duration: 1 });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const matchesSearch = (searchTerm || headerSearchTerm) 
                ? (student.name.toLowerCase().includes((searchTerm || headerSearchTerm).toLowerCase()) ||
                   student.subject.toLowerCase().includes((searchTerm || headerSearchTerm).toLowerCase()))
                : true;
            const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
            const matchesSubject = subjectFilter === 'all' || student.subject === subjectFilter;
            return matchesSearch && matchesStatus && matchesSubject;
        });
    }, [students, searchTerm, headerSearchTerm, statusFilter, subjectFilter]);

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const handleAddStudent = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const subject = formData.get('subject') as string;
        const pricePerHourStr = formData.get('pricePerHour') as string;
        const pricePerHour = pricePerHourStr ? parseFloat(pricePerHourStr) : undefined;
        
        const errors: Record<string, string> = {};
        if (!name || name.trim().length === 0) {
            errors.name = 'Name is required';
        }
        if (!subject) {
            errors.subject = 'Subject is required';
        }
        if (pricePerHour !== undefined && (isNaN(pricePerHour) || pricePerHour < 0)) {
            errors.pricePerHour = 'Price must be a positive number';
        }
        
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
        
        setFormErrors({});
        const newStudent: Student = {
            id: Date.now().toString(),
            initials: getInitials(name),
            name: name.trim(),
            subject,
            progress: '',
            nextSession: 'Not scheduled',
            status: 'Active',
            joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            color: 'stone',
            weeklySchedule: [],
            pricePerHour: pricePerHour || undefined,
        };
        addStudent(newStudent);
        createToast('Student added successfully!', 'success', setToasts);
        setShowAddModal(false);
    }, [addStudent]);

    const handleEditStudent = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!showEditModal) return;
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const subject = formData.get('subject') as string;
        const nextSession = formData.get('nextSession') as string;
        const progress = formData.get('progress') as string;
        const status = formData.get('status') as 'Active' | 'Paused' | 'Risk';
        const pricePerHourStr = formData.get('pricePerHour') as string;
        const pricePerHour = pricePerHourStr ? parseFloat(pricePerHourStr) : undefined;
        
        const errors: Record<string, string> = {};
        if (!name || name.trim().length === 0) {
            errors.name = 'Name is required';
        }
        if (!subject) {
            errors.subject = 'Subject is required';
        }
        if (pricePerHour !== undefined && (isNaN(pricePerHour) || pricePerHour < 0)) {
            errors.pricePerHour = 'Price must be a positive number';
        }
        
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
        
        setFormErrors({});
        updateStudent(showEditModal.id, {
            name: name.trim(),
            subject,
            nextSession,
            progress,
            status,
            initials: getInitials(name),
            pricePerHour: pricePerHour || undefined,
        });
        createToast('Student updated successfully!', 'success', setToasts);
        setShowEditModal(null);
    }, [showEditModal, updateStudent]);

    const handleDeleteStudent = useCallback(() => {
        if (!showDeleteModal) return;
        removeStudent(showDeleteModal.id);
        createToast('Student deleted successfully', 'success', setToasts);
        setShowDeleteModal(null);
    }, [showDeleteModal, removeStudent]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const handleAddScheduleSlot = useCallback(() => {
        if (!showEditModal) return;
        if (newScheduleSlot.day !== undefined && newScheduleSlot.startTime !== undefined && newScheduleSlot.duration !== undefined) {
            const slot: WeeklyScheduleSlot = {
                day: newScheduleSlot.day,
                startTime: newScheduleSlot.startTime,
                duration: newScheduleSlot.duration
            };
            const updatedSchedule = [...(showEditModal.weeklySchedule || []), slot];
            updateStudent(showEditModal.id, { weeklySchedule: updatedSchedule });
            setNewScheduleSlot({ day: 0, startTime: 9, duration: 1 });
        }
    }, [showEditModal, newScheduleSlot, updateStudent]);

    const handleRemoveScheduleSlot = useCallback((index: number) => {
        if (!showEditModal) return;
        const updatedSchedule = [...(showEditModal.weeklySchedule || [])];
        updatedSchedule.splice(index, 1);
        updateStudent(showEditModal.id, { weeklySchedule: updatedSchedule });
    }, [showEditModal, updateStudent]);

    // Helper function to get next session for a student
    const getNextSession = useCallback((student: Student) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Find all future sessions for this student
        const futureSessions = allScheduleItems
            .filter(item => item.studentId === student.id)
            .map(item => {
                if (item.date) {
                    // One-time session with specific date
                    const sessionDate = new Date(item.date);
                    const [hours, minutes] = [Math.floor(item.startTime), Math.round((item.startTime % 1) * 60)];
                    sessionDate.setHours(hours, minutes, 0, 0);
                    
                    if (sessionDate >= now) {
                        return {
                            date: sessionDate,
                            startTime: item.startTime,
                            duration: item.duration
                        };
                    }
                } else {
                    // Recurring session - find next occurrence
                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const targetDay = item.day === 0 ? 0 : item.day === 6 ? 6 : item.day + 1; // Convert Monday=0 to Sunday=0
                    
                    const daysUntilNext = (targetDay - now.getDay() + 7) % 7 || 7;
                    const nextDate = new Date(today);
                    nextDate.setDate(today.getDate() + daysUntilNext);
                    
                    const [hours, minutes] = [Math.floor(item.startTime), Math.round((item.startTime % 1) * 60)];
                    nextDate.setHours(hours, minutes, 0, 0);
                    
                    if (nextDate >= now) {
                        return {
                            date: nextDate,
                            startTime: item.startTime,
                            duration: item.duration
                        };
                    }
                }
                return null;
            })
            .filter((s): s is { date: Date; startTime: number; duration: number } => s !== null)
            .sort((a, b) => a.date.getTime() - b.date.getTime());
        
        if (futureSessions.length === 0) {
            return { text: student.nextSession || 'Not scheduled', time: null };
        }
        
        const nextSession = futureSessions[0];
        const formatTime = (hour: number, minute: number) => {
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
            return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
        };
        
        const startHour = Math.floor(nextSession.startTime);
        const startMinute = Math.round((nextSession.startTime % 1) * 60);
        const endTime = nextSession.startTime + nextSession.duration;
        const endHour = Math.floor(endTime);
        const endMinute = Math.round((endTime % 1) * 60);
        
        const timeStr = `${formatTime(startHour, startMinute)} - ${formatTime(endHour, endMinute)}`;
        
        // Format date text
        const daysDiff = Math.ceil((nextSession.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        let dateText = '';
        if (daysDiff === 0) {
            dateText = 'Today';
        } else if (daysDiff === 1) {
            dateText = 'Tomorrow';
        } else if (daysDiff <= 7) {
            dateText = nextSession.date.toLocaleDateString('en-US', { weekday: 'long' });
        } else {
            dateText = nextSession.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        
        return { text: dateText, time: timeStr };
    }, [allScheduleItems]);

    // Sync edit modal with latest student data when students change
    useEffect(() => {
        if (showEditModal) {
            const currentStudent = students.find(s => s.id === showEditModal.id);
            if (currentStudent && currentStudent !== showEditModal) {
                setShowEditModal(currentStudent);
            }
        }
    }, [students, showEditModal]);

    return (
        <>
            <header className="hidden lg:flex items-center justify-between px-10 py-8 shrink-0 z-20">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">Students Directory</h1>
                    <div className="flex items-center gap-6 text-secondary text-sm font-medium mt-1">
                        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary"></span> {students.filter(s => s.status === 'Active').length} Active Students</span>
                        <span className="w-px h-3 bg-stone-300"></span>
                        <span>Manage your class roster</span>
                    </div>
                </div>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center bg-surface border border-white shadow-sm rounded-full px-5 h-12 w-64 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                        <span className="material-symbols-outlined text-stone-400 text-[20px]">search</span>
                        <input 
                            className="bg-transparent border-none text-sm text-stone-800 placeholder-stone-400 focus:ring-0 w-full h-full ml-2" 
                            placeholder="Quick find..." 
                            type="text"
                            value={headerSearchTerm}
                            onChange={(e) => setHeaderSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        aria-label="Add new student"
                        className="px-5 h-12 rounded-full bg-accent text-white font-medium flex items-center gap-2 hover:bg-stone-800 transition-colors shadow-lg shadow-stone-800/20 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                    >
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">add</span>
                        <span>Add Student</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 lg:px-10 pb-10">
                <div className="max-w-[1400px] mx-auto space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-surface p-6 rounded-3xl border border-white shadow-card flex items-center justify-between bento-card">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-600">
                                    <span className="material-symbols-outlined">group</span>
                                </div>
                                <div>
                                    <p className="text-secondary text-xs font-bold uppercase tracking-wider mb-1">Total Students</p>
                                    <h3 className="text-3xl font-display font-light text-stone-800">{students.length}</h3>
                                </div>
                            </div>
                            <div className="flex items-center text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
                                <span className="material-symbols-outlined text-[14px] mr-1">trending_up</span> +0
                            </div>
                        </div>
                        <div className="bg-surface p-6 rounded-3xl border border-white shadow-card flex items-center justify-between bento-card">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary-content">
                                    <span className="material-symbols-outlined">school</span>
                                </div>
                                <div>
                                    <p className="text-secondary text-xs font-bold uppercase tracking-wider mb-1">Active Subjects</p>
                                    <h3 className="text-3xl font-display font-light text-stone-800">{new Set(students.map(s => s.subject)).size}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="bg-surface p-6 rounded-3xl border border-white shadow-card flex items-center justify-between bento-card">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-accent flex items-center justify-center text-white">
                                    <span className="material-symbols-outlined">schedule</span>
                                </div>
                                <div>
                                    <p className="text-secondary text-xs font-bold uppercase tracking-wider mb-1">Sessions This Week</p>
                                    <h3 className="text-3xl font-display font-light text-stone-800">{allScheduleItems.length}</h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Add Student Button */}
                    <div className="lg:hidden">
                        <button 
                            onClick={() => setShowAddModal(true)}
                            aria-label="Add new student"
                            className="w-full px-5 h-12 rounded-full bg-accent text-white font-medium flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors shadow-lg shadow-stone-800/20 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                        >
                            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">add</span>
                            <span>Add Student</span>
                        </button>
                    </div>

                    <div className="bg-surface border border-white shadow-card rounded-[2rem] overflow-hidden flex flex-col h-[calc(100vh-340px)] min-h-[500px]">
                        <div className="p-6 border-b border-stone-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-surface-secondary">
                            <div className="flex gap-2 bg-stone-100 p-1 rounded-full">
                                <button 
                                    onClick={() => setStatusFilter('all')}
                                    aria-label="Show all students"
                                    aria-pressed={statusFilter === 'all'}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors focus:ring-2 focus:ring-primary/50 focus:outline-none ${
                                        statusFilter === 'all' 
                                            ? 'bg-white text-stone-900 shadow-sm' 
                                            : 'text-stone-500 hover:text-stone-900'
                                    }`}
                                >
                                    All Students
                                </button>
                                <button 
                                    onClick={() => setStatusFilter('Active')}
                                    aria-label="Show active students"
                                    aria-pressed={statusFilter === 'Active'}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors focus:ring-2 focus:ring-primary/50 focus:outline-none ${
                                        statusFilter === 'Active' 
                                            ? 'bg-white text-stone-900 shadow-sm' 
                                            : 'text-stone-500 hover:text-stone-900'
                                    }`}
                                >
                                    Active
                                </button>
                                <button 
                                    onClick={() => setStatusFilter('Paused')}
                                    aria-label="Show paused students"
                                    aria-pressed={statusFilter === 'Paused'}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors focus:ring-2 focus:ring-primary/50 focus:outline-none ${
                                        statusFilter === 'Paused' 
                                            ? 'bg-white text-stone-900 shadow-sm' 
                                            : 'text-stone-500 hover:text-stone-900'
                                    }`}
                                >
                                    Paused
                                </button>
                            </div>
                             <div className="flex gap-3 w-full sm:w-auto">
                                <div className="relative flex-1 sm:flex-initial">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-[18px]">filter_list</span>
                                    <select 
                                        value={subjectFilter}
                                        onChange={(e) => setSubjectFilter(e.target.value)}
                                        className="pl-9 pr-8 py-2 rounded-full border border-stone-200 bg-white text-stone-600 text-sm focus:ring-primary focus:border-primary appearance-none cursor-pointer hover:bg-stone-50 transition-colors"
                                    >
                                        <option value="all">Filter by Subject</option>
                                        {profile.subjects.map((subject) => (
                                            <option key={subject} value={subject}>{subject}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="relative flex-1 sm:flex-initial">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-[18px]">search</span>
                                    <input 
                                        className="pl-9 pr-4 py-2 rounded-full border border-stone-200 bg-white text-sm focus:ring-primary focus:border-primary w-full sm:w-48 placeholder-stone-400" 
                                        placeholder="Search name..." 
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-auto flex-1 p-4 bg-surface custom-scrollbar">
                            <div className="overflow-x-auto -mx-4 px-4">
                                <table className="w-full text-left border-separate border-spacing-y-2 min-w-[800px]">
                                <thead className="text-[11px] font-bold text-stone-400 uppercase tracking-widest sticky top-0 bg-surface z-10">
                                    <tr>
                                        <th className="px-6 py-3 bg-surface">Student Info</th>
                                        <th className="px-6 py-3 bg-surface">Subject</th>
                                        <th className="px-6 py-3 bg-surface">Price/Hour</th>
                                        <th className="px-6 py-3 bg-surface">Progress</th>
                                        <th className="px-6 py-3 bg-surface">Next Session</th>
                                        <th className="px-6 py-3 bg-surface text-center">Status</th>
                                        <th className="px-6 py-3 bg-surface text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                                        <tr key={student.id} className="group hover:bg-[#FDFCF8] transition-all duration-200">
                                            <td className="px-6 py-4 rounded-l-2xl border-l border-y border-transparent bg-white group-hover:border-border">
                                                <div className="flex items-center gap-4">
                                                    <div className={`size-10 rounded-full ${student.id === '2' ? 'bg-primary/20 text-primary-content' : 'bg-stone-100 text-stone-600'} flex items-center justify-center font-bold text-sm`}>{student.initials}</div>
                                                    <div>
                                                        <p className="font-bold text-stone-800 text-sm">{student.name}</p>
                                                        <p className="text-stone-400 text-[11px] font-medium">Joined {student.joined}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 border-y border-transparent bg-white group-hover:border-border">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-${student.color}-50 text-${student.color}-700 text-xs font-bold border border-${student.color}-100`}>
                                                    <span className={`size-1.5 rounded-full bg-${student.color}-500`}></span>
                                                    {student.subject}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 border-y border-transparent bg-white group-hover:border-border">
                                                <span className="text-xs font-bold text-stone-600">
                                                    {student.pricePerHour ? `$${student.pricePerHour.toFixed(2)}/hr` : 'Not set'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 border-y border-transparent bg-white group-hover:border-border">
                                                <span className="text-xs font-bold text-stone-600">{student.progress || 'Not set'}</span>
                                            </td>
                                             <td className="px-6 py-4 border-y border-transparent bg-white group-hover:border-border">
                                                <div className="flex flex-col">
                                                    {(() => {
                                                        const nextSession = getNextSession(student);
                                                        return (
                                                            <>
                                                                <span className="text-stone-800 font-bold text-xs">{nextSession.text}</span>
                                                                {nextSession.time && (
                                                                    <span className="text-stone-400 text-[10px]">{nextSession.time}</span>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 border-y border-transparent bg-white group-hover:border-border text-center">
                                                 <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                                     student.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' :
                                                     student.status === 'Paused' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                                     'bg-rose-50 text-rose-700 border-rose-100'
                                                 }`}>
                                                    {student.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 rounded-r-2xl border-r border-y border-transparent bg-white group-hover:border-border text-right">
                                                <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => setShowEditModal(student)}
                                                        aria-label={`Edit ${student.name}`}
                                                        className="size-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-colors focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => setShowDeleteModal(student)}
                                                        aria-label={`Delete ${student.name}`}
                                                        className="size-8 rounded-full hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-stone-500 transition-colors focus:ring-2 focus:ring-red-500/50 focus:outline-none"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <span className="material-symbols-outlined text-5xl text-stone-300">group</span>
                                                    <div>
                                                        <p className="text-sm font-bold text-stone-600">No students found</p>
                                                        <p className="text-xs text-stone-400 mt-1">Load demo data or add your first student</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setFormErrors({}); }} title="Add New Student" size="md">
                <form onSubmit={handleAddStudent} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Full Name</label>
                        <input 
                            name="name" 
                            type="text" 
                            className={`w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all ${
                                formErrors.name ? 'border-red-300 bg-red-50' : ''
                            }`}
                            placeholder="e.g., John Doe" 
                            required 
                        />
                        {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Subject</label>
                        <select 
                            name="subject" 
                            className={`w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all ${
                                formErrors.subject ? 'border-red-300 bg-red-50' : ''
                            }`}
                            required
                        >
                            <option value="">Select a subject</option>
                            {profile.subjects.map((subject) => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                        {formErrors.subject && <p className="text-xs text-red-600 mt-1">{formErrors.subject}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Price per Hour ($)</label>
                        <input 
                            name="pricePerHour" 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            className={`w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all ${
                                formErrors.pricePerHour ? 'border-red-300 bg-red-50' : ''
                            }`}
                            placeholder="e.g., 65.00" 
                        />
                        {formErrors.pricePerHour && <p className="text-xs text-red-600 mt-1">{formErrors.pricePerHour}</p>}
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 rounded-full border border-stone-200 text-stone-600 font-bold text-sm hover:bg-stone-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 px-4 py-3 rounded-full bg-accent text-white font-bold text-sm hover:bg-stone-800 transition-colors">
                            Add Student
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={showEditModal !== null} onClose={() => { setShowEditModal(null); setFormErrors({}); }} title="Edit Student" size="md">
                {showEditModal && (
                    <form onSubmit={handleEditStudent} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Full Name</label>
                            <input 
                                name="name" 
                                type="text" 
                                defaultValue={showEditModal.name} 
                                className={`w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-primary/20 transition-all ${
                                    formErrors.name ? 'border-red-300 bg-red-50' : ''
                                }`}
                                required 
                            />
                            {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Subject</label>
                            <select 
                                name="subject" 
                                defaultValue={showEditModal.subject} 
                                className={`w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all ${
                                    formErrors.subject ? 'border-red-300 bg-red-50' : ''
                                }`}
                                required
                            >
                                {profile.subjects.map((subject) => (
                                    <option key={subject} value={subject}>{subject}</option>
                                ))}
                            </select>
                            {formErrors.subject && <p className="text-xs text-red-600 mt-1">{formErrors.subject}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Price per Hour ($)</label>
                            <input 
                                name="pricePerHour" 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                defaultValue={showEditModal.pricePerHour || ''} 
                                className={`w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all ${
                                    formErrors.pricePerHour ? 'border-red-300 bg-red-50' : ''
                                }`}
                                placeholder="e.g., 65.00" 
                            />
                            {formErrors.pricePerHour && <p className="text-xs text-red-600 mt-1">{formErrors.pricePerHour}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Progress</label>
                            <input 
                                name="progress" 
                                type="text" 
                                defaultValue={showEditModal.progress} 
                                className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all" 
                                placeholder="e.g., Excellent, Good, Needs Improvement, Not started"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Next Session</label>
                            <input 
                                name="nextSession" 
                                type="text" 
                                defaultValue={showEditModal.nextSession} 
                                className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all" 
                                placeholder="e.g., Tomorrow, Friday, Sep 20, Not scheduled"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Status</label>
                            <select 
                                name="status" 
                                defaultValue={showEditModal.status} 
                                className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all" 
                                required
                            >
                                <option value="Active">Active</option>
                                <option value="Paused">Paused</option>
                                <option value="Risk">Risk</option>
                            </select>
                        </div>
                        
                        {/* Weekly Schedule */}
                        <div className="space-y-3 pt-4 border-t border-stone-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Weekly Recurring Schedule</label>
                                    <p className="text-xs text-stone-500">Set recurring lessons that appear every week</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {(showEditModal.weeklySchedule || []).map((slot, index) => {
                                    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                                    const hour = Math.floor(slot.startTime);
                                    const minutes = (slot.startTime % 1) * 60;
                                    const timeStr = `${hour}:${minutes === 0 ? '00' : minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
                                    return (
                                        <div key={index} className="flex items-center gap-2 p-3 rounded-xl bg-stone-50 border border-stone-200">
                                            <div className="flex-1">
                                                <span className="text-sm font-bold text-stone-800">{dayNames[slot.day]}</span>
                                                <span className="text-xs text-stone-600 ml-2">{timeStr}</span>
                                                <span className="text-xs text-stone-600 ml-2">({slot.duration}h)</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveScheduleSlot(index)}
                                                aria-label={`Remove schedule slot for ${dayNames[slot.day]}`}
                                                className="text-red-600 hover:text-red-700 transition-colors focus:ring-2 focus:ring-red-500/50 focus:outline-none rounded"
                                            >
                                                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                                            </button>
                                        </div>
                                    );
                                })}
                                {(!showEditModal.weeklySchedule || showEditModal.weeklySchedule.length === 0) && (
                                    <p className="text-xs text-stone-400 italic text-center py-2">No recurring schedule set</p>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-2 pt-2">
                                <select
                                    value={newScheduleSlot.day ?? 0}
                                    onChange={(e) => setNewScheduleSlot({ ...newScheduleSlot, day: parseInt(e.target.value) })}
                                    className="rounded-xl border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-800 focus:border-primary focus:ring-primary/20 transition-all"
                                >
                                    <option value={0}>Monday</option>
                                    <option value={1}>Tuesday</option>
                                    <option value={2}>Wednesday</option>
                                    <option value={3}>Thursday</option>
                                    <option value={4}>Friday</option>
                                    <option value={5}>Saturday</option>
                                    <option value={6}>Sunday</option>
                                </select>
                                <input
                                    type="time"
                                    value={newScheduleSlot.startTime !== undefined ? (() => {
                                        const hour = Math.floor(newScheduleSlot.startTime);
                                        const minutes = Math.round((newScheduleSlot.startTime % 1) * 60);
                                        return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                                    })() : ''}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const [hours, minutes] = e.target.value.split(':').map(Number);
                                            setNewScheduleSlot({ ...newScheduleSlot, startTime: hours + (minutes / 60) });
                                        }
                                    }}
                                    className="rounded-xl border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-800 focus:border-primary focus:ring-primary/20 transition-all"
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min="0.5"
                                        max="4"
                                        step="0.5"
                                        value={newScheduleSlot.duration ?? 1}
                                        onChange={(e) => setNewScheduleSlot({ ...newScheduleSlot, duration: parseFloat(e.target.value) })}
                                        placeholder="Duration (h)"
                                        className="flex-1 rounded-xl border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-800 focus:border-primary focus:ring-primary/20 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddScheduleSlot}
                                        aria-label="Add schedule slot"
                                        className="px-3 py-2 rounded-xl bg-accent text-white text-sm font-bold hover:bg-stone-800 transition-colors focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setShowEditModal(null)} className="flex-1 px-4 py-3 rounded-full border border-stone-200 text-stone-600 font-bold text-sm hover:bg-stone-50 transition-colors">
                                Cancel
                            </button>
                            <button type="submit" className="flex-1 px-4 py-3 rounded-full bg-accent text-white font-bold text-sm hover:bg-stone-800 transition-colors">
                                Save Changes
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            <Modal isOpen={showDeleteModal !== null} onClose={() => setShowDeleteModal(null)} title="Delete Student" size="sm">
                {showDeleteModal && (
                    <div className="space-y-4">
                        <p className="text-sm text-stone-600">Are you sure you want to delete <strong>{showDeleteModal.name}</strong>? This action cannot be undone.</p>
                        <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                            <p className="text-xs font-bold text-red-900 mb-1">Warning</p>
                            <p className="text-xs text-red-700">All student data, progress, and session history will be permanently deleted.</p>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setShowDeleteModal(null)} className="flex-1 px-4 py-3 rounded-full border border-stone-200 text-stone-600 font-bold text-sm hover:bg-stone-50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleDeleteStudent} className="flex-1 px-4 py-3 rounded-full bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors">
                                Delete
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
};

export default Students;
