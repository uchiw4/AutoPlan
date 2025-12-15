import React, { useState, useEffect } from 'react';
import { Student, StudentAvailability } from '../types';
import { StorageService } from '../services/storage';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Trash2, Phone, Search, Pencil, Clock } from 'lucide-react';

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [availabilities, setAvailabilities] = useState<StudentAvailability[]>([]);
  
  const DAYS = [
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' },
    { value: 0, label: 'Dimanche' },
  ];

  useEffect(() => {
    setStudents(StorageService.getStudents());
  }, []);

  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '+33';
    // Enlever tous les espaces et caractères non numériques sauf +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Si ça commence déjà par +33, on garde tel quel
    if (cleaned.startsWith('+33')) {
      return cleaned;
    }
    
    // Si ça commence par 0, on remplace par +33
    if (cleaned.startsWith('0')) {
      return '+33' + cleaned.substring(1);
    }
    
    // Si ça commence par 33, on ajoute le +
    if (cleaned.startsWith('33')) {
      return '+' + cleaned;
    }
    
    // Sinon, on force +33 au début
    return '+33' + cleaned.replace(/^\+/, '');
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData({...formData, phone: formatted});
  };

  const handleSave = () => {
    if (!formData.firstName || !formData.lastName) return;

    // Formater le numéro de téléphone avant sauvegarde
    const formattedPhone = formData.phone ? formatPhoneNumber(formData.phone) : '+33';

    if (editingStudent) {
      const updated: Student[] = students.map(s =>
        s.id === editingStudent.id
          ? {
              ...s,
              firstName: formData.firstName!,
              lastName: formData.lastName!,
              email: formData.email || '',
              phone: formattedPhone,
              notes: formData.notes || '',
              availability: availabilities.length > 0 ? availabilities : undefined,
            }
          : s
      );
      setStudents(updated);
      StorageService.saveStudents(updated);
    } else {
      const newStudent: Student = {
        id: crypto.randomUUID(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || '',
        phone: formattedPhone,
        notes: formData.notes || '',
        availability: availabilities.length > 0 ? availabilities : undefined,
      };
      const updated = [...students, newStudent];
      setStudents(updated);
      StorageService.saveStudents(updated);
    }

    setIsModalOpen(false);
    setEditingStudent(null);
    setFormData({});
    setAvailabilities([]);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet élève ?')) {
      const updated = students.filter(s => s.id !== id);
      setStudents(updated);
      StorageService.saveStudents(updated);
    }
  };

  const filteredStudents = students.filter(s => 
    s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.firstName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Élèves</h1>
          <p className="text-gray-500 mt-1">Gérez vos inscrits et leurs moniteurs référents.</p>
        </div>
        <Button onClick={() => { setEditingStudent(null); setFormData({}); setAvailabilities([]); setIsModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel Élève
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="pl-10 block w-full rounded-lg border-gray-300 bg-white border h-10 focus:ring-slate-500 focus:border-slate-500 placeholder-gray-400 text-gray-900"
          placeholder="Rechercher un élève..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-xs">
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{student.firstName} {student.lastName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{student.email}</div>
                  <div className="text-sm text-gray-500 flex items-center mt-1">
                    <Phone size={12} className="mr-1" />
                    {student.phone}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setViewingStudent(student);
                        setIsAvailabilityModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="Voir les disponibilités"
                    >
                      <Clock size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingStudent(student);
                        setFormData({
                          firstName: student.firstName,
                          lastName: student.lastName,
                          email: student.email,
                          phone: student.phone,
                          notes: student.notes || '',
                        });
                        setAvailabilities(student.availability || []);
                        setIsModalOpen(true);
                      }}
                      className="text-slate-600 hover:text-slate-900"
                      title="Modifier"
                    >
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:text-red-900" title="Supprimer">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
                <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">Aucun élève trouvé.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingStudent(null); setFormData({}); setAvailabilities([]); }} 
        title={editingStudent ? "Modifier un élève" : "Ajouter un élève"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none placeholder-gray-400"
                value={formData.firstName || ''}
                onChange={e => setFormData({...formData, firstName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none placeholder-gray-400"
                value={formData.lastName || ''}
                onChange={e => setFormData({...formData, lastName: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none placeholder-gray-400"
              value={formData.email || ''}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input 
              type="tel" 
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none placeholder-gray-400"
              placeholder="+33..."
              value={formData.phone || ''}
              onChange={e => handlePhoneChange(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Le numéro doit commencer par +33</p>
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarques</label>
              <textarea 
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none placeholder-gray-400"
                  rows={3}
                  value={formData.notes || ''}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
              />
          </div>

          {/* Disponibilités */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Disponibilités sur la semaine
            </label>
            <div className="space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
              {availabilities.map((avail, index) => (
                <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-md border border-gray-200">
                  <select
                    className="flex-1 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm"
                    value={avail.day}
                    onChange={(e) => {
                      const updated = [...availabilities];
                      updated[index] = { ...updated[index], day: parseInt(e.target.value) };
                      setAvailabilities(updated);
                    }}
                  >
                    {DAYS.map(day => (
                      <option key={day.value} value={day.value}>{day.label}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">De</span>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      className="w-16 px-2 py-1 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm"
                      value={avail.startHour}
                      onChange={(e) => {
                        const updated = [...availabilities];
                        updated[index] = { ...updated[index], startHour: parseInt(e.target.value) || 0 };
                        setAvailabilities(updated);
                      }}
                    />
                    <span className="text-sm text-gray-600">h à</span>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      className="w-16 px-2 py-1 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm"
                      value={avail.endHour}
                      onChange={(e) => {
                        const updated = [...availabilities];
                        updated[index] = { ...updated[index], endHour: parseInt(e.target.value) || 0 };
                        setAvailabilities(updated);
                      }}
                    />
                    <span className="text-sm text-gray-600">h</span>
                    <button
                      onClick={() => {
                        const updated = availabilities.filter((_, i) => i !== index);
                        setAvailabilities(updated);
                      }}
                      className="text-red-500 hover:text-red-700 ml-2"
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setAvailabilities([...availabilities, { day: 1, startHour: 9, endHour: 18 }]);
                }}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une disponibilité
              </Button>
              {availabilities.length === 0 && (
                <p className="text-xs text-gray-500 text-center italic">Aucune disponibilité définie</p>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </div>
        </div>
      </Modal>

      {/* Modal pour afficher les disponibilités */}
      <Modal 
        isOpen={isAvailabilityModalOpen} 
        onClose={() => { setIsAvailabilityModalOpen(false); setViewingStudent(null); }} 
        title={viewingStudent ? `Disponibilités de ${viewingStudent.firstName} ${viewingStudent.lastName}` : "Disponibilités"}
      >
        <div className="space-y-4">
          {viewingStudent && viewingStudent.availability && viewingStudent.availability.length > 0 ? (
            <div className="space-y-3">
              {viewingStudent.availability.map((avail, index) => {
                const dayLabel = DAYS.find(d => d.value === avail.day)?.label || 'Jour inconnu';
                return (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm">
                          {dayLabel.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{dayLabel}</div>
                          <div className="text-sm text-gray-600">
                            De {avail.startHour.toString().padStart(2, '0')}h à {avail.endHour.toString().padStart(2, '0')}h
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-blue-700">
                        {avail.endHour - avail.startHour}h
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 font-medium">Aucune disponibilité définie</p>
              <p className="text-sm text-gray-400 mt-2">Les disponibilités peuvent être ajoutées lors de la modification de l'élève.</p>
            </div>
          )}
          
          <div className="pt-4 flex justify-end">
            <Button variant="secondary" onClick={() => { setIsAvailabilityModalOpen(false); setViewingStudent(null); }}>
              Fermer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};