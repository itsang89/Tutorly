import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import { useStudents } from '../contexts/StudentsContext';
import { Student } from '../types';

interface AddSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        studentId: string;
        student: Student;
        date: string;
        time: string;
        duration: number;
    }) => void;
    title?: string;
}

const AddSessionModal: React.FC<AddSessionModalProps> = ({ 
    isOpen, 
    onClose, 
    onSubmit,
    title = "Add Session"
}) => {
    const { students } = useStudents();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState(60);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const selectedStudent = useMemo(() => {
        return students.find(s => s.id === selectedStudentId);
    }, [students, selectedStudentId]);

    const filteredStudents = useMemo(() => {
        if (!searchTerm) return students;
        return students.filter(student => 
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.subject.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        
        if (!selectedStudentId) {
            newErrors.student = 'Please select a student';
        }
        
        if (!date) {
            newErrors.date = 'Please select a date';
        } else {
            const selectedDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
                newErrors.date = 'Date cannot be in the past';
            }
        }
        
        if (!time) {
            newErrors.time = 'Please select a time';
        }
        
        if (!duration || duration <= 0) {
            newErrors.duration = 'Duration must be greater than 0';
        } else if (duration < 30) {
            newErrors.duration = 'Duration must be at least 30 minutes';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateForm() || !selectedStudent) return;
        
        onSubmit({
            studentId: selectedStudentId,
            student: selectedStudent,
            date,
            time,
            duration
        });
        
        // Reset form
        setSelectedStudentId('');
        setDate('');
        setTime('');
        setDuration(60);
        setSearchTerm('');
        setErrors({});
        onClose();
    };

    const handleClose = () => {
        setSelectedStudentId('');
        setDate('');
        setTime('');
        setDuration(60);
        setSearchTerm('');
        setErrors({});
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={title} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Student Selection */}
                <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">
                        Select Student
                    </label>
                    <div className="relative mb-2">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-[18px]">search</span>
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 bg-stone-50 text-sm font-medium text-stone-800 focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all"
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto rounded-xl border border-stone-200 bg-white custom-scrollbar">
                        {filteredStudents.length === 0 ? (
                            <div className="p-8 text-center text-stone-400">
                                <span className="material-symbols-outlined text-4xl mb-2">group</span>
                                <p className="text-sm">No students found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-stone-100">
                                {filteredStudents.map((student) => (
                                    <button
                                        key={student.id}
                                        type="button"
                                        onClick={() => setSelectedStudentId(student.id)}
                                        className={`w-full p-4 text-left hover:bg-stone-50 transition-colors ${
                                            selectedStudentId === student.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`size-10 rounded-full ${
                                                selectedStudentId === student.id 
                                                    ? 'bg-primary/20 text-primary-content' 
                                                    : 'bg-stone-100 text-stone-600'
                                            } flex items-center justify-center font-bold text-sm`}>
                                                {student.initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="text-sm font-bold text-stone-800 truncate">{student.name}</h4>
                                                    <span className={`
                                                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border
                                                        ${student.color === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-100' : ''}
                                                        ${student.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-100' : ''}
                                                        ${student.color === 'stone' ? 'bg-stone-50 text-stone-700 border-stone-100' : ''}
                                                        ${student.color === 'accent' ? 'bg-accent/10 text-accent border-accent/20' : ''}
                                                        ${!['amber', 'blue', 'stone', 'accent'].includes(student.color) ? 'bg-stone-50 text-stone-700 border-stone-100' : ''}
                                                    `}>
                                                        <span className={`
                                                            size-1.5 rounded-full
                                                            ${student.color === 'amber' ? 'bg-amber-500' : ''}
                                                            ${student.color === 'blue' ? 'bg-blue-500' : ''}
                                                            ${student.color === 'stone' ? 'bg-stone-500' : ''}
                                                            ${student.color === 'accent' ? 'bg-accent' : ''}
                                                            ${!['amber', 'blue', 'stone', 'accent'].includes(student.color) ? 'bg-stone-500' : ''}
                                                        `}></span>
                                                        {student.subject}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-stone-500 mt-1">Status: {student.status}</p>
                                            </div>
                                            {selectedStudentId === student.id && (
                                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Selected Student Info */}
                {selectedStudent && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-primary/20 text-primary-content flex items-center justify-center font-bold text-sm">
                                {selectedStudent.initials}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-stone-800">{selectedStudent.name}</p>
                                <p className="text-xs text-stone-600">Subject: <span className="font-bold">{selectedStudent.subject}</span></p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => {
                                setDate(e.target.value);
                                if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
                            }}
                            className={`w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all ${
                                errors.date ? 'border-red-300 bg-red-50' : ''
                            }`}
                            required
                        />
                        {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Time</label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => {
                                setTime(e.target.value);
                                if (errors.time) setErrors(prev => ({ ...prev, time: '' }));
                            }}
                            className={`w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all ${
                                errors.time ? 'border-red-300 bg-red-50' : ''
                            }`}
                            required
                        />
                        {errors.time && <p className="text-xs text-red-600 mt-1">{errors.time}</p>}
                    </div>
                </div>

                {/* Duration */}
                <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Duration (minutes)</label>
                    <input
                        type="number"
                        min="30"
                        step="30"
                        value={duration}
                        onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setDuration(value);
                            if (errors.duration) setErrors(prev => ({ ...prev, duration: '' }));
                        }}
                        className={`w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all ${
                            errors.duration ? 'border-red-300 bg-red-50' : ''
                        }`}
                        required
                    />
                    {errors.duration && <p className="text-xs text-red-600 mt-1">{errors.duration}</p>}
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 px-4 py-3 rounded-full border border-stone-200 text-stone-600 font-bold text-sm hover:bg-stone-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!selectedStudent || !date || !time}
                        className="flex-1 px-4 py-3 rounded-full bg-accent text-white font-bold text-sm hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Create Session
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddSessionModal;

