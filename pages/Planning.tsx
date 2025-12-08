import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, addDays, addHours, isSameDay, startOfDay, getHours, setHours, setMinutes, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, Users, Calendar as CalendarIcon } from 'lucide-react';
import { StorageService } from '../services/storage';
import { NotificationService } from '../services/notification';
import { Student, Instructor, Lesson } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

// Constants for calendar Layout
const START_HOUR = 8; // 8 AM
const END_HOUR = 20; // 8 PM
const HOURS_COUNT = END_HOUR - START_HOUR;
const CELL_HEIGHT = 64; // px

type ViewMode = 'WEEK' | 'TEAM';

export const PlanningPage: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('WEEK');
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{start: Date, end: Date} | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [selectedInstructorId, setSelectedInstructorId] = useState<string>('');
    const [preselectedInstructorId, setPreselectedInstructorId] = useState<string | null>(null);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null); // For viewing existing details
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLessons(StorageService.getLessons());
        setInstructors(StorageService.getInstructors());
        setStudents(StorageService.getStudents());
    }, []);

    // Calendar Navigation
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const weekDays = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(startDate, i)), [startDate]);

    const handleNext = () => {
        if (viewMode === 'WEEK') setCurrentDate(addDays(currentDate, 7));
        else setCurrentDate(addDays(currentDate, 1));
    };

    const handlePrev = () => {
        if (viewMode === 'WEEK') setCurrentDate(addDays(currentDate, -7));
        else setCurrentDate(addDays(currentDate, -1));
    };

    const goToday = () => setCurrentDate(new Date());

    // --- Interaction Handlers ---

    // Handle click on empty slot
    const handleSlotClick = (date: Date, hour: number, instructorId?: string) => {
        const start = setMinutes(setHours(date, hour), 0);
        const end = addHours(start, 1);
        
        setSelectedSlot({ start, end });
        setSelectedStudentId('');
        setPreselectedInstructorId(instructorId || null);
        setSelectedInstructorId(instructorId || '');
        setSelectedLesson(null);
        setIsModalOpen(true);
    };

    const handleLessonClick = (e: React.MouseEvent, lesson: Lesson) => {
        e.stopPropagation();
        setSelectedLesson(lesson);
        setSelectedSlot({ start: new Date(lesson.start), end: new Date(lesson.end) });
        setIsModalOpen(true);
    };

    const handleCreateLesson = async () => {
        if (!selectedSlot || !selectedStudentId || !selectedInstructorId) return;

        const student = students.find(s => s.id === selectedStudentId);
        if (!student) return;

        const instructorId = selectedInstructorId;

        const newLesson: Lesson = {
            id: crypto.randomUUID(),
            studentId: student.id,
            instructorId: instructorId,
            start: selectedSlot.start.toISOString(),
            end: selectedSlot.end.toISOString(),
            confirmed: false
        };

        const updated = [...lessons, newLesson];
        setLessons(updated);
        StorageService.saveLessons(updated);
        
        // Switch to detail view for confirmation
        setSelectedLesson(newLesson);
    };

    const handleConfirmLesson = async () => {
        if (!selectedLesson) return;
        setLoading(true);

        const student = students.find(s => s.id === selectedLesson.studentId);
        const instructor = instructors.find(i => i.id === selectedLesson.instructorId);
        const settings = StorageService.getSettings();

        if (student && instructor) {
            await NotificationService.sendConfirmation(selectedLesson, student, instructor, settings);
        }

        const updated = lessons.map(l => l.id === selectedLesson.id ? { ...l, confirmed: true } : l);
        setLessons(updated);
        StorageService.saveLessons(updated);
        
        setLoading(false);
        setIsModalOpen(false);
    };

    const handleDeleteLesson = () => {
        if (!selectedLesson) return;
        if (confirm('Supprimer ce cours ?')) {
            const updated = lessons.filter(l => l.id !== selectedLesson.id);
            setLessons(updated);
            StorageService.saveLessons(updated);
            setIsModalOpen(false);
        }
    };

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-bold text-gray-900 capitalize min-w-[200px]">
                        {viewMode === 'WEEK' 
                            ? format(currentDate, 'MMMM yyyy', { locale: fr })
                            : format(currentDate, 'd MMMM yyyy', { locale: fr })
                        }
                    </h1>
                    <div className="flex bg-white rounded-lg border border-gray-200 shadow-sm p-1">
                        <button onClick={handlePrev} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft size={20} /></button>
                        <button onClick={goToday} className="px-3 text-sm font-medium hover:bg-gray-100 rounded">Aujourd'hui</button>
                        <button onClick={handleNext} className="p-1 hover:bg-gray-100 rounded"><ChevronRight size={20} /></button>
                    </div>
                </div>

                {/* View Toggler */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setViewMode('WEEK')}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'WEEK' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        <CalendarIcon size={16} />
                        <span>Semaine</span>
                    </button>
                    <button 
                        onClick={() => setViewMode('TEAM')}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'TEAM' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        <Users size={16} />
                        <span>Équipe</span>
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                {/* Header Row */}
                <div className="flex border-b border-gray-200">
                    <div className="w-16 flex-shrink-0 p-4 text-center border-r border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                        Heure
                    </div>
                    
                    <div className={`flex-1 grid ${viewMode === 'WEEK' ? 'grid-cols-7' : `grid-cols-${Math.max(1, instructors.length)}`}`}>
                        {viewMode === 'WEEK' ? (
                            // WEEK MODE HEADERS (Mon, Tue, Wed...)
                            weekDays.map((day, i) => (
                                <div key={i} className={`p-3 text-center border-r border-gray-100 last:border-0 ${isSameDay(day, new Date()) ? 'bg-blue-50' : 'bg-gray-50'}`}>
                                    <div className={`text-xs font-semibold uppercase mb-1 ${isSameDay(day, new Date()) ? 'text-blue-600' : 'text-gray-500'}`}>
                                        {format(day, 'EEE', { locale: fr })}
                                    </div>
                                    <div className={`text-xl font-bold ${isSameDay(day, new Date()) ? 'text-blue-700' : 'text-gray-900'}`}>
                                        {format(day, 'd')}
                                    </div>
                                </div>
                            ))
                        ) : (
                            // TEAM MODE HEADERS (Instructor Names)
                            instructors.length > 0 ? instructors.map((instructor) => (
                                <div key={instructor.id} className="p-3 text-center border-r border-gray-100 last:border-0 bg-gray-50" style={{ borderTop: `3px solid ${instructor.color}`}}>
                                    <div className="font-semibold text-gray-900 truncate px-2">
                                        {instructor.firstName} {instructor.lastName}
                                    </div>
                                </div>
                            )) : (
                                <div className="p-4 text-center text-gray-500 bg-gray-50 italic">Aucun moniteur</div>
                            )
                        )}
                    </div>
                </div>

                {/* Time Grid (Scrollable) */}
                <div className="flex-1 overflow-y-auto relative scrollbar-hide">
                    <div className="flex relative" style={{ height: HOURS_COUNT * CELL_HEIGHT }}>
                        {/* Time Column */}
                        <div className="w-16 flex-shrink-0 border-r border-gray-100 bg-gray-50/50">
                            {Array.from({ length: HOURS_COUNT }).map((_, i) => (
                                <div key={i} className="text-xs text-gray-400 text-center font-medium border-b border-gray-100" style={{ height: CELL_HEIGHT, lineHeight: `${CELL_HEIGHT}px` }}>
                                    {START_HOUR + i}:00
                                </div>
                            ))}
                        </div>

                        {/* Main Grid Body */}
                        <div className={`flex-1 grid ${viewMode === 'WEEK' ? 'grid-cols-7' : `grid-cols-${Math.max(1, instructors.length)}`} relative`}>
                            {/* Logic for WEEK view */}
                            {viewMode === 'WEEK' && weekDays.map((day, colIndex) => {
                                const dayLessons = lessons.filter(l => isSameDay(new Date(l.start), day));
                                return (
                                    <div key={colIndex} className="relative border-r border-gray-100 last:border-0 h-full">
                                        {/* Background Grid Lines */}
                                        {Array.from({ length: HOURS_COUNT }).map((_, i) => (
                                            <div 
                                                key={i} 
                                                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                                                style={{ height: CELL_HEIGHT }}
                                                onClick={() => handleSlotClick(day, START_HOUR + i)}
                                            />
                                        ))}
                                        
                                        {/* Events */}
                                        {dayLessons.map(lesson => renderLesson(lesson))}
                                    </div>
                                );
                            })}

                            {/* Logic for TEAM view */}
                            {viewMode === 'TEAM' && (instructors.length > 0 ? instructors.map((instructor, colIndex) => {
                                const instructorLessons = lessons.filter(l => 
                                    isSameDay(new Date(l.start), currentDate) && 
                                    l.instructorId === instructor.id
                                );
                                return (
                                    <div key={colIndex} className="relative border-r border-gray-100 last:border-0 h-full">
                                        {/* Background Grid Lines */}
                                        {Array.from({ length: HOURS_COUNT }).map((_, i) => (
                                            <div 
                                                key={i} 
                                                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                                                style={{ height: CELL_HEIGHT }}
                                                onClick={() => handleSlotClick(currentDate, START_HOUR + i, instructor.id)}
                                            />
                                        ))}

                                        {/* Events */}
                                        {instructorLessons.map(lesson => renderLesson(lesson))}
                                    </div>
                                );
                            }) : (
                                <div className="col-span-full flex items-center justify-center text-gray-400">
                                    Veuillez ajouter des moniteurs pour utiliser cette vue.
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedLesson ? "Détails du cours" : "Planifier un cours"}
            >
                {selectedLesson ? (
                    // Detail / Confirm View
                    <div className="space-y-6">
                        <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                             <div className="flex justify-between">
                                <span className="text-gray-500 text-sm">Élève</span>
                                <span className="font-semibold">{students.find(s => s.id === selectedLesson.studentId)?.firstName} {students.find(s => s.id === selectedLesson.studentId)?.lastName}</span>
                             </div>
                             <div className="flex justify-between">
                                <span className="text-gray-500 text-sm">Moniteur</span>
                                <span className="font-semibold">{instructors.find(i => i.id === selectedLesson.instructorId)?.firstName} {instructors.find(i => i.id === selectedLesson.instructorId)?.lastName}</span>
                             </div>
                             <div className="flex justify-between">
                                <span className="text-gray-500 text-sm">Horaire</span>
                                <span className="font-semibold">
                                    {format(new Date(selectedLesson.start), 'eeee d MMMM, HH:mm', { locale: fr })}
                                </span>
                             </div>
                             <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-sm">Statut</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${selectedLesson.confirmed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {selectedLesson.confirmed ? 'Confirmé' : 'À confirmer'}
                                </span>
                             </div>
                        </div>

                        {!selectedLesson.confirmed ? (
                            <Button 
                                onClick={handleConfirmLesson} 
                                className="w-full justify-center" 
                                size="lg"
                                isLoading={loading}
                            >
                                <CheckCircle className="mr-2 h-5 w-5" />
                                Confirmer le cours (Notifier)
                            </Button>
                        ) : (
                            <div className="text-center text-sm text-green-600 font-medium border border-green-200 bg-green-50 p-3 rounded-lg">
                                Cours confirmé et notification envoyée.
                            </div>
                        )}

                        <div className="flex justify-between pt-4 border-t border-gray-100">
                            <Button variant="ghost" onClick={handleDeleteLesson} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                Supprimer le cours
                            </Button>
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Fermer</Button>
                        </div>
                    </div>
                ) : (
                    // Creation View
                    <div className="space-y-6">
                        <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 flex items-center mb-4">
                            <Clock className="w-4 h-4 mr-2" />
                            Créneau : {selectedSlot && format(selectedSlot.start, 'eeee d HH:mm', {locale: fr})}
                            {preselectedInstructorId && (
                                <span className="ml-2 font-semibold">
                                     • Moniteur : {instructors.find(i => i.id === preselectedInstructorId)?.firstName}
                                </span>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Choisir un élève</label>
                            <select
                                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none"
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                            >
                                <option value="">-- Sélectionner --</option>
                                {students.map(s => (
                                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-2">
                                Sélectionnez d'abord l'élève, puis le moniteur pour ce cours.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Choisir un moniteur</label>
                            <select
                                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none"
                                value={selectedInstructorId}
                                onChange={(e) => setSelectedInstructorId(e.target.value)}
                            >
                                <option value="">-- Sélectionner --</option>
                                {instructors.map(i => (
                                    <option key={i.id} value={i.id}>{i.firstName} {i.lastName}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-2">
                                Le moniteur sélectionné sera assigné uniquement pour ce cours.
                            </p>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                            <Button 
                                onClick={handleCreateLesson} 
                                disabled={!selectedStudentId || !selectedInstructorId || instructors.length === 0}
                            >
                                Planifier
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );

    // Helper to render a lesson block
    function renderLesson(lesson: Lesson) {
        const start = new Date(lesson.start);
        const end = new Date(lesson.end);
        const startHour = getHours(start);
        const minutes = start.getMinutes();
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        
        const top = ((startHour - START_HOUR) * CELL_HEIGHT) + ((minutes / 60) * CELL_HEIGHT);
        const height = durationHours * CELL_HEIGHT;

        const student = students.find(s => s.id === lesson.studentId);
        const instructor = instructors.find(i => i.id === lesson.instructorId);

        return (
            <div
                key={lesson.id}
                onClick={(e) => handleLessonClick(e, lesson)}
                className="absolute inset-x-1 rounded shadow-sm border-l-4 p-2 text-xs cursor-pointer hover:shadow-md transition-shadow overflow-hidden z-10 bg-white"
                style={{
                    top: `${top}px`,
                    height: `${height - 2}px`, // -2 for gap
                    backgroundColor: instructor?.color ? `${instructor.color}20` : '#eee', // Low opacity bg
                    borderColor: instructor?.color || '#ccc'
                }}
            >
                <div className="font-bold text-gray-800 truncate">
                    {student ? `${student.firstName} ${student.lastName}` : 'Inconnu'}
                </div>
                <div className="text-gray-600 truncate">
                    {format(start, 'HH:mm')} 
                    {viewMode === 'WEEK' && instructor ? ` - ${instructor.firstName}` : ''}
                </div>
                {lesson.confirmed && (
                    <div className="absolute bottom-1 right-1 text-green-600">
                        <CheckCircle size={12} />
                    </div>
                )}
            </div>
        );
    }
};