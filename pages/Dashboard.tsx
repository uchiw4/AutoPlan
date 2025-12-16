import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { Users, Calendar, UserCheck } from 'lucide-react';
import { Lesson, Student, Instructor } from '../types';

export const DashboardPage: React.FC = () => {
    const [stats, setStats] = useState({
        students: 0,
        instructors: 0,
        lessonsThisWeek: 0
    });
    const [nextLessons, setNextLessons] = useState<(Lesson & { studentName: string, instructorName: string, color: string })[]>([]);

    useEffect(() => {
        const students = StorageService.getStudents();
        const instructors = StorageService.getInstructors();
        const lessons = StorageService.getLessons();

        // Calc stats
        const now = new Date();
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + 7);

        const thisWeekLessons = lessons.filter(l => {
            const d = new Date(l.start);
            return d >= now && d <= nextWeek;
        });

        // Get details for next 5 lessons
        const sortedNext = thisWeekLessons.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()).slice(0, 5);
        
        const enrichedLessons = sortedNext.map(l => {
            const s = students.find(st => st.id === l.studentId);
            const i = instructors.find(inStr => inStr.id === l.instructorId);
            return {
                ...l,
                studentName: s ? `${s.firstName} ${s.lastName}` : 'Inconnu',
                instructorName: i ? `${i.firstName} ${i.lastName}` : 'Inconnu',
                color: i ? i.color : '#ccc'
            };
        });

        setStats({
            students: students.length,
            instructors: instructors.length,
            lessonsThisWeek: thisWeekLessons.length
        });
        setNextLessons(enrichedLessons);
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
                <p className="text-gray-500 mt-1">Bienvenue sur votre gestionnaire AutoPlanning.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Élèves inscrits</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.students}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                        <UserCheck size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Moniteurs actifs</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.instructors}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Cours cette semaine</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.lessonsThisWeek}</h3>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Prochains cours</h2>
                </div>
                <div className="p-0">
                    {nextLessons.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">Aucun cours prévu prochainement.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {nextLessons.map(lesson => (
                                <div key={lesson.id} className="p-4 px-6 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-gray-100 rounded-lg text-gray-600">
                                            <span className="text-xs font-bold uppercase">{new Date(lesson.start).toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                                            <span className="text-lg font-bold">{new Date(lesson.start).getDate()}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{lesson.studentName}</h4>
                                            <p className="text-sm text-gray-500">avec {lesson.instructorName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-gray-900">
                                            {new Date(lesson.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute:'2-digit' })}
                                        </div>
                                        <div className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${lesson.confirmed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {lesson.confirmed ? 'Confirmé' : 'En attente'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
