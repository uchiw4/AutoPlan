import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, addDays, addHours, isSameDay, startOfDay, getHours, setHours, setMinutes, subDays, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, Users, Calendar as CalendarIcon, Plus, AlertTriangle } from 'lucide-react';
import { NotificationService } from '../services/notification';
import { GoogleCalendarService } from '../services/googleCalendar';
import { Student, Instructor, Lesson } from '../types';
import { StorageService } from '../services/storage';
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
    const [availabilityWarning, setAvailabilityWarning] = useState<string | null>(null);

    useEffect(() => {
        setInstructors(StorageService.getInstructors());
        setStudents(StorageService.getStudents());
    }, []);

    useEffect(() => {
        const loadEvents = async () => {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 });
            const end = addDays(start, 7);
            const events = await GoogleCalendarService.listRange(start.toISOString(), end.toISOString());
            const mapped: Lesson[] = events.map((ev: any) => {
                const startDt = ev.start?.dateTime || ev.start?.date;
                const endDt = ev.end?.dateTime || ev.end?.date;
                const priv = ev.extendedProperties?.private || {};
                return {
                    id: ev.id,
                    start: startDt,
                    end: endDt,
                    studentId: priv.studentId || '',
                    instructorId: priv.instructorId || '',
                    confirmed: (priv.confirmed === 'true') || false,
                } as Lesson;
            }).filter((l: any) => l.start && l.end);
            setLessons(mapped);
        };
        loadEvents();
    }, [currentDate]);

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

    // Vérifier si un élève est disponible à un moment donné
    const checkStudentAvailability = (student: Student, startDate: Date, endDate: Date): { available: boolean; message: string | null } => {
        if (!student.availability || student.availability.length === 0) {
            return { available: true, message: null }; // Pas de disponibilités définies = toujours disponible
        }

        const lessonDay = getDay(startDate); // 0 = dimanche, 1 = lundi, etc.
        const lessonStartHour = getHours(startDate);
        const lessonEndHour = getHours(endDate);

        // Chercher une disponibilité qui correspond au jour et à l'heure
        const matchingAvailability = student.availability.find(avail => avail.day === lessonDay);

        if (!matchingAvailability) {
            const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
            return {
                available: false,
                message: `${student.firstName} n'est pas disponible le ${dayNames[lessonDay]}`
            };
        }

        // Vérifier si l'heure du cours est dans la plage de disponibilité
        if (lessonStartHour < matchingAvailability.startHour || lessonEndHour > matchingAvailability.endHour) {
            return {
                available: false,
                message: `${student.firstName} n'est disponible que de ${matchingAvailability.startHour.toString().padStart(2, '0')}h à ${matchingAvailability.endHour.toString().padStart(2, '0')}h ce jour-là`
            };
        }

        return { available: true, message: null };
    };

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
        setAvailabilityWarning(null);
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

        // Vérifier la disponibilité (mais permettre quand même la création)
        const availabilityCheck = checkStudentAvailability(student, selectedSlot.start, selectedSlot.end);
        if (!availabilityCheck.available) {
            // L'avertissement est déjà affiché dans le modal, on continue quand même
        }

        const instructorId = selectedInstructorId;

        const newLesson: Lesson = {
            id: crypto.randomUUID(),
            studentId: student.id,
            instructorId: instructorId,
            start: selectedSlot.start.toISOString(),
            end: selectedSlot.end.toISOString(),
            confirmed: false
        };

        // Création dans Google Calendar
        const studentName = `${student.firstName} ${student.lastName}`;
        const instructorName = instructors.find(i => i.id === newLesson.instructorId)
            ? `${instructors.find(i => i.id === newLesson.instructorId)!.firstName} ${instructors.find(i => i.id === newLesson.instructorId)!.lastName}`
            : 'Moniteur';
        const summary = `Cours avec ${studentName}`;
        const description = `Moniteur: ${instructorName}\nStatut: À confirmer`;
        await GoogleCalendarService.createEventFromLesson(newLesson, summary, description);

        // Recharger depuis Google
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = addDays(start, 7);
        const events = await GoogleCalendarService.listRange(start.toISOString(), end.toISOString());
        const mapped: Lesson[] = events.map((ev: any) => {
            const startDt = ev.start?.dateTime || ev.start?.date;
            const endDt = ev.end?.dateTime || ev.end?.date;
            const priv = ev.extendedProperties?.private || {};
            return {
                id: ev.id,
                start: startDt,
                end: endDt,
                studentId: priv.studentId || '',
                instructorId: priv.instructorId || '',
                confirmed: (priv.confirmed === 'true') || false,
            } as Lesson;
        }).filter((l: any) => l.start && l.end);
        setLessons(mapped);

        // Switch to detail view for confirmation (last created)
        const created = mapped.find(m => m.id === events[events.length - 1]?.id) || null;
        setSelectedLesson(created);
        setAvailabilityWarning(null); // Réinitialiser l'avertissement après création
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

        await GoogleCalendarService.updateEvent(selectedLesson.id, { confirmed: true });

        // Recharger
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = addDays(start, 7);
        const events = await GoogleCalendarService.listRange(start.toISOString(), end.toISOString());
        const mapped: Lesson[] = events.map((ev: any) => {
            const startDt = ev.start?.dateTime || ev.start?.date;
            const endDt = ev.end?.dateTime || ev.end?.date;
            const priv = ev.extendedProperties?.private || {};
            return {
                id: ev.id,
                start: startDt,
                end: endDt,
                studentId: priv.studentId || '',
                instructorId: priv.instructorId || '',
                confirmed: (priv.confirmed === 'true') || false,
            } as Lesson;
        }).filter((l: any) => l.start && l.end);
        setLessons(mapped);
        
        setLoading(false);
        setIsModalOpen(false);
    };

    const handleDeleteLesson = async () => {
        if (!selectedLesson) return;
        if (confirm('Supprimer ce cours ?')) {
            await GoogleCalendarService.deleteEvent(selectedLesson.id);
            const start = startOfWeek(currentDate, { weekStartsOn: 1 });
            const end = addDays(start, 7);
            const events = await GoogleCalendarService.listRange(start.toISOString(), end.toISOString());
            const mapped: Lesson[] = events.map((ev: any) => {
                const startDt = ev.start?.dateTime || ev.start?.date;
                const endDt = ev.end?.dateTime || ev.end?.date;
                const priv = ev.extendedProperties?.private || {};
                return {
                    id: ev.id,
                    start: startDt,
                    end: endDt,
                    studentId: priv.studentId || '',
                    instructorId: priv.instructorId || '',
                    confirmed: (priv.confirmed === 'true') || false,
                } as Lesson;
            }).filter((l: any) => l.start && l.end);
            setLessons(mapped);
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
                    {(() => {
                        // Calculer les hauteurs maximales pour les deux vues
                        let maxSlotHeights: number[] = [];
                        let totalHeight = HOURS_COUNT * CELL_HEIGHT;
                        
                        if (viewMode === 'WEEK') {
                            // Calculer la hauteur nécessaire pour chaque créneau horaire pour chaque colonne
                            const getSlotHeightForDay = (day: Date, hour: number): number => {
                                const dayLessons = lessons.filter(l => isSameDay(new Date(l.start), day));
                                const slotLessons = dayLessons.filter(l => {
                                    const lStart = new Date(l.start);
                                    return getHours(lStart) === hour && Math.floor(lStart.getMinutes() / 15) * 15 === 0;
                                });
                                
                                if (slotLessons.length === 0) return CELL_HEIGHT;
                                if (slotLessons.length === 1) {
                                    const lesson = slotLessons[0];
                                    const end = new Date(lesson.end);
                                    const start = new Date(lesson.start);
                                    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                                    return Math.max(CELL_HEIGHT, durationHours * CELL_HEIGHT);
                                }
                                
                                // Plusieurs cours : hauteur minimum de 40px par cours + espacement
                                const minHeightPerLesson = 40;
                                const spacing = 2;
                                const totalHeight = (slotLessons.length * minHeightPerLesson) + ((slotLessons.length - 1) * spacing);
                                return Math.max(CELL_HEIGHT, totalHeight);
                            };
                            
                            // Calculer la hauteur MAXIMALE pour chaque créneau horaire à travers toutes les colonnes
                            for (let i = 0; i < HOURS_COUNT; i++) {
                                const hour = START_HOUR + i;
                                let maxHeight = CELL_HEIGHT;
                                weekDays.forEach(day => {
                                    const height = getSlotHeightForDay(day, hour);
                                    maxHeight = Math.max(maxHeight, height);
                                });
                                maxSlotHeights.push(maxHeight);
                            }
                        } else {
                            // TEAM view
                            const getSlotHeightForInstructor = (instructorId: string, hour: number): number => {
                                const instructorLessons = lessons.filter(l => 
                                    isSameDay(new Date(l.start), currentDate) && 
                                    l.instructorId === instructorId
                                );
                                const slotLessons = instructorLessons.filter(l => {
                                    const lStart = new Date(l.start);
                                    return getHours(lStart) === hour && Math.floor(lStart.getMinutes() / 15) * 15 === 0;
                                });
                                
                                if (slotLessons.length === 0) return CELL_HEIGHT;
                                if (slotLessons.length === 1) {
                                    const lesson = slotLessons[0];
                                    const end = new Date(lesson.end);
                                    const start = new Date(lesson.start);
                                    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                                    return Math.max(CELL_HEIGHT, durationHours * CELL_HEIGHT);
                                }
                                
                                // Plusieurs cours : hauteur minimum de 40px par cours + espacement
                                const minHeightPerLesson = 40;
                                const spacing = 2;
                                const totalHeight = (slotLessons.length * minHeightPerLesson) + ((slotLessons.length - 1) * spacing);
                                return Math.max(CELL_HEIGHT, totalHeight);
                            };
                            
                            // Calculer la hauteur MAXIMALE pour chaque créneau horaire à travers tous les moniteurs
                            for (let i = 0; i < HOURS_COUNT; i++) {
                                const hour = START_HOUR + i;
                                let maxHeight = CELL_HEIGHT;
                                instructors.forEach(instructor => {
                                    const height = getSlotHeightForInstructor(instructor.id, hour);
                                    maxHeight = Math.max(maxHeight, height);
                                });
                                maxSlotHeights.push(maxHeight);
                            }
                        }
                        
                        // Calculer la hauteur totale
                        totalHeight = maxSlotHeights.reduce((sum, height) => sum + height, 0);
                        
                        // Calculer les positions cumulées basées sur les hauteurs maximales
                        const slotTops: number[] = [];
                        let cumulativeTop = 0;
                        for (let i = 0; i < HOURS_COUNT; i++) {
                            slotTops.push(cumulativeTop);
                            cumulativeTop += maxSlotHeights[i];
                        }
                        
                        return (
                            <div className="flex relative" style={{ height: totalHeight }}>
                                {/* Time Column */}
                                <div className="w-16 flex-shrink-0 border-r border-gray-100 bg-gray-50/50">
                                    {Array.from({ length: HOURS_COUNT }).map((_, i) => (
                                        <div 
                                            key={i} 
                                            className="text-xs text-gray-400 text-center font-medium border-b border-gray-100" 
                                            style={{ 
                                                height: `${maxSlotHeights[i]}px`, 
                                                lineHeight: `${maxSlotHeights[i]}px`,
                                                minHeight: `${maxSlotHeights[i]}px`
                                            }}
                                        >
                                            {START_HOUR + i}:00
                                        </div>
                                    ))}
                                </div>

                                {/* Main Grid Body */}
                                <div className={`flex-1 grid ${viewMode === 'WEEK' ? 'grid-cols-7' : `grid-cols-${Math.max(1, instructors.length)}`} relative`}>
                                    {/* Logic for WEEK view */}
                                    {viewMode === 'WEEK' && (() => {
                                
                                return weekDays.map((day, colIndex) => {
                                    const dayLessons = lessons.filter(l => isSameDay(new Date(l.start), day));
                                    
                                    return (
                                        <div key={colIndex} className="relative border-r border-gray-100 last:border-0">
                                            {/* Background Grid Lines */}
                                            {Array.from({ length: HOURS_COUNT }).map((_, i) => {
                                                const hour = START_HOUR + i;
                                                const slotHeight = maxSlotHeights[i]; // Utiliser la hauteur maximale pour toutes les colonnes
                                                
                                                return (
                                                    <div 
                                                        key={i} 
                                                        className="group relative border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                                                        style={{ 
                                                            height: `${slotHeight}px`,
                                                            minHeight: `${slotHeight}px`,
                                                        }}
                                                        onClick={() => handleSlotClick(day, hour)}
                                                    >
                                                        {/* Bouton + pour ajouter un cours même s'il y en a déjà */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSlotClick(day, hour);
                                                            }}
                                                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1.5 shadow-md z-20"
                                                            title="Ajouter un cours"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                            
                                            {/* Events */}
                                            {dayLessons.map((lesson, index) => renderLesson(lesson, dayLessons, index, maxSlotHeights, slotTops))}
                                        </div>
                                    );
                                });
                            })()}

                            {/* Logic for TEAM view */}
                            {viewMode === 'TEAM' && (instructors.length > 0 ? instructors.map((instructor, colIndex) => {
                                const instructorLessons = lessons.filter(l => 
                                    isSameDay(new Date(l.start), currentDate) && 
                                    l.instructorId === instructor.id
                                );
                                
                                return (
                                    <div key={colIndex} className="relative border-r border-gray-100 last:border-0">
                                        {/* Background Grid Lines */}
                                        {Array.from({ length: HOURS_COUNT }).map((_, i) => {
                                            const hour = START_HOUR + i;
                                            const slotHeight = maxSlotHeights[i]; // Utiliser la hauteur maximale pour toutes les colonnes
                                            
                                            return (
                                                <div 
                                                    key={i} 
                                                    className="group relative border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                                                    style={{ 
                                                        height: `${slotHeight}px`,
                                                        minHeight: `${slotHeight}px`,
                                                    }}
                                                    onClick={() => handleSlotClick(currentDate, hour, instructor.id)}
                                                >
                                                    {/* Bouton + pour ajouter un cours même s'il y en a déjà */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSlotClick(currentDate, hour, instructor.id);
                                                        }}
                                                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1.5 shadow-md z-20"
                                                        title="Ajouter un cours"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            );
                                        })}

                                        {/* Events */}
                                        {instructorLessons.map((lesson, index) => renderLesson(lesson, instructorLessons, index, maxSlotHeights, slotTops))}
                                    </div>
                                );
                            }) : (
                                <div className="col-span-full flex items-center justify-center text-gray-400">
                                    Veuillez ajouter des moniteurs pour utiliser cette vue.
                                </div>
                            ))}
                        </div>
                    </div>
                    );
                    })()}
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
                                onChange={(e) => {
                                    setSelectedStudentId(e.target.value);
                                    // Vérifier la disponibilité quand un élève est sélectionné
                                    if (e.target.value && selectedSlot) {
                                        const student = students.find(s => s.id === e.target.value);
                                        if (student) {
                                            const check = checkStudentAvailability(student, selectedSlot.start, selectedSlot.end);
                                            setAvailabilityWarning(check.message);
                                        }
                                    } else {
                                        setAvailabilityWarning(null);
                                    }
                                }}
                            >
                                <option value="">-- Sélectionner --</option>
                                {students.map(s => (
                                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-2">
                                Sélectionnez d'abord l'élève, puis le moniteur pour ce cours.
                            </p>
                            
                            {/* Avertissement de disponibilité */}
                            {availabilityWarning && (
                                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-amber-800">Avertissement</p>
                                        <p className="text-xs text-amber-700 mt-1">{availabilityWarning}</p>
                                        <p className="text-xs text-amber-600 mt-2 italic">Vous pouvez quand même planifier ce cours.</p>
                                    </div>
                                </div>
                            )}
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

    // Helper to group lessons by time slot (same start time)
    function groupLessonsByTimeSlot(lessons: Lesson[]): Map<string, Lesson[]> {
        const grouped = new Map<string, Lesson[]>();
        lessons.forEach(lesson => {
            const start = new Date(lesson.start);
            // Créer une clé basée sur l'heure et les minutes (arrondies à 15 min pour grouper)
            const hour = getHours(start);
            const minutes = Math.floor(start.getMinutes() / 15) * 15;
            const key = `${hour}:${minutes.toString().padStart(2, '0')}`;
            
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key)!.push(lesson);
        });
        return grouped;
    }

    // Helper to render a lesson block with support for multiple lessons at same time
    function renderLesson(lesson: Lesson, allLessons: Lesson[], index: number, slotHeights?: number[], slotTops?: number[]) {
        const start = new Date(lesson.start);
        const end = new Date(lesson.end);
        const startHour = getHours(start);
        const minutes = start.getMinutes();
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        
        // Calculer le top en utilisant les hauteurs réelles des cellules si disponibles
        let baseTop: number;
        if (slotTops && slotHeights) {
            const slotIndex = startHour - START_HOUR;
            baseTop = slotTops[slotIndex] || ((startHour - START_HOUR) * CELL_HEIGHT);
        } else {
            baseTop = ((startHour - START_HOUR) * CELL_HEIGHT) + ((minutes / 60) * CELL_HEIGHT);
        }
        
        const baseHeight = durationHours * CELL_HEIGHT;

        // Grouper les cours au même créneau horaire (même heure et minutes arrondies à 15 min)
        const hour = getHours(start);
        const roundedMinutes = Math.floor(start.getMinutes() / 15) * 15;
        const sameSlotLessons = allLessons.filter(l => {
            const lStart = new Date(l.start);
            return getHours(lStart) === hour && Math.floor(lStart.getMinutes() / 15) * 15 === roundedMinutes;
        });

        // Calculer la position verticale si plusieurs cours au même créneau (empilés verticalement)
        const totalSameSlot = sameSlotLessons.length;
        const lessonIndex = sameSlotLessons.findIndex(l => l.id === lesson.id);
        
        // Hauteur réduite pour chaque cours si plusieurs au même créneau (minimum 40px pour voir le nom)
        const minHeight = 40;
        const height = totalSameSlot > 1 ? Math.max(minHeight, baseHeight / totalSameSlot) : baseHeight;
        
        // Décalage vertical pour empiler les cours
        const topOffset = totalSameSlot > 1 ? (lessonIndex * minHeight + lessonIndex * 2) : 0; // 2px spacing entre cours
        const top = baseTop + topOffset;

        const student = students.find(s => s.id === lesson.studentId);
        const instructor = instructors.find(i => i.id === lesson.instructorId);

        // Vérifier si l'élève est disponible pour ce cours
        const isStudentAvailable = student ? checkStudentAvailability(student, start, end).available : true;
        const availabilityWarning = student && !isStudentAvailable ? checkStudentAvailability(student, start, end).message : null;

        return (
            <div
                key={lesson.id}
                onClick={(e) => {
                    e.stopPropagation(); // Empêcher le clic de remonter à la cellule
                    handleLessonClick(e, lesson);
                }}
                onDoubleClick={(e) => {
                    e.stopPropagation(); // Empêcher le double-clic de remonter
                }}
                className={`absolute rounded shadow-sm border-l-4 p-2 text-xs cursor-pointer hover:shadow-md transition-shadow overflow-hidden z-10 bg-white ${!isStudentAvailable ? 'ring-2 ring-amber-400' : ''}`}
                style={{
                    top: `${top}px`,
                    left: '4px',
                    right: '4px',
                    height: `${height - 2}px`, // -2 for gap
                    backgroundColor: instructor?.color ? `${instructor.color}20` : '#eee', // Low opacity bg
                    borderColor: !isStudentAvailable ? '#f59e0b' : (instructor?.color || '#ccc'),
                }}
                title={availabilityWarning || undefined}
            >
                <div className="font-bold text-gray-800 truncate flex items-center">
                    {student ? `${student.firstName} ${student.lastName}` : 'Inconnu'}
                    {!isStudentAvailable && (
                        <AlertTriangle size={12} className="ml-1.5 text-amber-600 flex-shrink-0" />
                    )}
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
                {!isStudentAvailable && (
                    <div className="absolute top-1 right-1 text-amber-600" title={availabilityWarning || ''}>
                        <AlertTriangle size={14} />
                    </div>
                )}
            </div>
        );
    }
};