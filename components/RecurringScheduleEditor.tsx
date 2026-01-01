import React, { useState, useMemo } from 'react';
import { WeeklyScheduleSlot } from '../types';
import { useSchedule } from '../contexts/ScheduleContext';
import { detectConflicts, suggestAvailableSlots } from '../utils/recurringSessions';

interface RecurringScheduleEditorProps {
    schedule: WeeklyScheduleSlot[];
    onScheduleChange: (schedule: WeeklyScheduleSlot[]) => void;
    studentId?: string; // To exclude student's own sessions from conflict detection
}

interface RecurringTemplate {
    id: string;
    name: string;
    description: string;
    pattern: WeeklyScheduleSlot[];
}

const templates: RecurringTemplate[] = [
    {
        id: 'weekly-single',
        name: 'Weekly (Same Time)',
        description: 'One session per week at the same time',
        pattern: [{ day: 0, startTime: 14, duration: 1 }] // Monday 2pm, 1 hour
    },
    {
        id: 'twice-weekly',
        name: 'Twice Per Week',
        description: 'Two sessions per week at the same time',
        pattern: [
            { day: 0, startTime: 14, duration: 1 }, // Monday 2pm
            { day: 3, startTime: 14, duration: 1 } // Thursday 2pm
        ]
    },
    {
        id: 'mon-wed-fri',
        name: 'Mon/Wed/Fri',
        description: 'Three sessions per week',
        pattern: [
            { day: 0, startTime: 14, duration: 1 }, // Monday
            { day: 2, startTime: 14, duration: 1 }, // Wednesday
            { day: 4, startTime: 14, duration: 1 }  // Friday
        ]
    }
];

const RecurringScheduleEditor: React.FC<RecurringScheduleEditorProps> = ({ schedule, onScheduleChange, studentId }) => {
    const { allScheduleItems } = useSchedule();
    const [showConflictOverride, setShowConflictOverride] = useState(false);
    const [pendingSchedule, setPendingSchedule] = useState<WeeklyScheduleSlot[] | null>(null);
    const [newScheduleSlot, setNewScheduleSlot] = useState<Partial<WeeklyScheduleSlot>>({ 
        day: 0, 
        startTime: 14, 
        duration: 1 
    });

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayNamesShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const formatTime = (startTime: number) => {
        const hour = Math.floor(startTime);
        const minutes = Math.round((startTime % 1) * 60);
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        return `${displayHour}:${minutes === 0 ? '00' : minutes} ${period}`;
    };

    // Check for conflicts
    const conflicts = useMemo(() => {
        if (schedule.length === 0) return [];
        return detectConflicts(schedule, allScheduleItems, studentId);
    }, [schedule, allScheduleItems, studentId]);

    const handleAddSlot = () => {
        if (newScheduleSlot.day !== undefined && newScheduleSlot.startTime !== undefined && newScheduleSlot.duration !== undefined) {
            const slot: WeeklyScheduleSlot = {
                day: newScheduleSlot.day,
                startTime: newScheduleSlot.startTime,
                duration: newScheduleSlot.duration
            };
            const newSchedule = [...schedule, slot];
            
            // Check for conflicts
            const newConflicts = detectConflicts(newSchedule, allScheduleItems, studentId);
            if (newConflicts.length > 0) {
                setPendingSchedule(newSchedule);
                setShowConflictOverride(true);
            } else {
                onScheduleChange(newSchedule);
                setNewScheduleSlot({ day: 0, startTime: 14, duration: 1 });
            }
        }
    };

    const handleConfirmWithConflicts = () => {
        if (pendingSchedule) {
            onScheduleChange(pendingSchedule);
            setPendingSchedule(null);
            setShowConflictOverride(false);
            setNewScheduleSlot({ day: 0, startTime: 14, duration: 1 });
        }
    };

    const handleCancelConflict = () => {
        setPendingSchedule(null);
        setShowConflictOverride(false);
    };

    const handleRemoveSlot = (index: number) => {
        const updatedSchedule = [...schedule];
        updatedSchedule.splice(index, 1);
        onScheduleChange(updatedSchedule);
    };

    const handleApplyTemplate = (template: RecurringTemplate) => {
        // Apply template but keep existing time if user wants to customize
        const templateWithCustomTime = template.pattern.map(slot => ({
            ...slot,
            startTime: newScheduleSlot.startTime ?? slot.startTime,
            duration: newScheduleSlot.duration ?? slot.duration
        }));
        
        // Check for conflicts
        const newConflicts = detectConflicts(templateWithCustomTime, allScheduleItems, studentId);
        if (newConflicts.length > 0) {
            setPendingSchedule(templateWithCustomTime);
            setShowConflictOverride(true);
        } else {
            onScheduleChange(templateWithCustomTime);
        }
    };

    // Calculate preview of sessions
    const sessionPreview = useMemo(() => {
        if (schedule.length === 0) return null;
        
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0);
        
        let sessionCount = 0;
        const daysInMonth = endOfMonth.getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayOfWeek = (date.getDay() + 6) % 7; // Convert to Monday=0
            
            if (schedule.some(slot => slot.day === dayOfWeek)) {
                sessionCount++;
            }
        }
        
        return {
            thisMonth: sessionCount,
            perWeek: schedule.length,
            estimatedYearly: schedule.length * 52
        };
    }, [schedule]);

    // Get suggestions for conflicted slots
    const conflictSuggestions = useMemo(() => {
        if (conflicts.length === 0) return [];
        const suggestions: Record<number, Array<{ startTime: number; endTime: number }>> = {};
        conflicts.forEach(conflict => {
            if (!suggestions[conflict.day]) {
                suggestions[conflict.day] = suggestAvailableSlots(conflict.day, allScheduleItems, conflict.duration);
            }
        });
        return suggestions;
    }, [conflicts, allScheduleItems]);

    return (
        <div className="space-y-4">
            {/* Conflict Warning */}
            {conflicts.length > 0 && !showConflictOverride && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="flex items-start gap-2 mb-2">
                        <span className="material-symbols-outlined text-amber-600 text-[18px]">warning</span>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-amber-900 mb-1">Schedule Conflicts Detected</p>
                            <div className="space-y-1">
                                {conflicts.map((conflict, index) => {
                                    const dayName = dayNamesShort[conflict.day];
                                    const timeStr = formatTime(conflict.time);
                                    return (
                                        <p key={index} className="text-[10px] text-amber-800">
                                            {dayName} {timeStr} conflicts with {conflict.conflictingItem.title}'s {conflict.conflictingItem.subtitle} session
                                        </p>
                                    );
                                })}
                            </div>
                            {Object.keys(conflictSuggestions).length > 0 && (
                                <div className="mt-2 pt-2 border-t border-amber-200">
                                    <p className="text-[10px] font-bold text-amber-900 mb-1">Suggested available times:</p>
                                    {Object.entries(conflictSuggestions).map(([day, slots]) => (
                                        <p key={day} className="text-[10px] text-amber-800">
                                            {dayNamesShort[parseInt(day)]}: {slots.slice(0, 3).map(s => formatTime(s.startTime)).join(', ')}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Conflict Override Confirmation */}
            {showConflictOverride && pendingSchedule && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                    <div className="flex items-start gap-2 mb-2">
                        <span className="material-symbols-outlined text-red-600 text-[18px]">error</span>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-red-900 mb-1">Confirm Schedule with Conflicts</p>
                            <p className="text-[10px] text-red-800 mb-3">
                                This schedule has conflicts with existing sessions. Do you want to proceed?
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleConfirmWithConflicts}
                                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
                                >
                                    Proceed Anyway
                                </button>
                                <button
                                    onClick={handleCancelConflict}
                                    className="px-3 py-1.5 rounded-lg bg-stone-100 text-stone-700 text-xs font-bold hover:bg-stone-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Templates */}
            <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">
                    Quick Templates
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {templates.map(template => (
                        <button
                            key={template.id}
                            onClick={() => handleApplyTemplate(template)}
                            className="p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-stone-300 transition-colors text-left"
                        >
                            <p className="text-xs font-bold text-stone-800 mb-1">{template.name}</p>
                            <p className="text-[10px] text-stone-500">{template.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Current Schedule */}
            <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">
                    Current Schedule
                </label>
                <div className="space-y-2">
                    {schedule.length === 0 ? (
                        <p className="text-xs text-stone-400 italic text-center py-3">No recurring schedule set</p>
                    ) : (
                        schedule.map((slot, index) => {
                            const hour = Math.floor(slot.startTime);
                            const minutes = Math.round((slot.startTime % 1) * 60);
                            const timeStr = `${hour}:${minutes === 0 ? '00' : minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
                            return (
                                <div key={index} className="flex items-center gap-2 p-3 rounded-xl bg-stone-50 border border-stone-200">
                                    <div className="flex-1">
                                        <span className="text-sm font-bold text-stone-800">{dayNamesShort[slot.day]}</span>
                                        <span className="text-xs text-stone-600 ml-2">{timeStr}</span>
                                        <span className="text-xs text-stone-600 ml-2">({slot.duration}h)</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSlot(index)}
                                        aria-label={`Remove schedule slot for ${dayNames[slot.day]}`}
                                        className="text-red-600 hover:text-red-700 transition-colors focus:ring-2 focus:ring-red-500/50 focus:outline-none rounded"
                                    >
                                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Add New Slot */}
            <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">
                    Add Schedule Slot
                </label>
                <div className="grid grid-cols-3 gap-2">
                    <select
                        value={newScheduleSlot.day ?? 0}
                        onChange={(e) => setNewScheduleSlot({ ...newScheduleSlot, day: parseInt(e.target.value) })}
                        className="rounded-xl border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-800 focus:border-primary focus:ring-primary/20 transition-all"
                    >
                        {dayNames.map((day, index) => (
                            <option key={index} value={index}>{day}</option>
                        ))}
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
                            onClick={handleAddSlot}
                            aria-label="Add schedule slot"
                            className="px-3 py-2 rounded-xl bg-accent text-white text-sm font-bold hover:bg-stone-800 transition-colors focus:ring-2 focus:ring-primary/50 focus:outline-none"
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview */}
            {sessionPreview && schedule.length > 0 && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                    <p className="text-xs font-bold text-blue-900 mb-1">Schedule Preview</p>
                    <p className="text-[10px] text-blue-700">
                        {sessionPreview.perWeek} session{sessionPreview.perWeek !== 1 ? 's' : ''} per week • 
                        ~{sessionPreview.thisMonth} this month • 
                        ~{sessionPreview.estimatedYearly} per year
                    </p>
                </div>
            )}
        </div>
    );
};

export default RecurringScheduleEditor;

