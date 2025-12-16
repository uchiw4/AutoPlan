import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { StorageService } from '../services/storage';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Trash2, Phone, Search, Pencil } from 'lucide-react';

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({});

  useEffect(() => {
    setStudents(StorageService.getStudents());
  }, []);

  const handleSave = () => {
    if (!formData.firstName || !formData.lastName) return;

    if (editingStudent) {
      const updated: Student[] = students.map(s =>
        s.id === editingStudent.id
          ? {
              ...s,
              firstName: formData.firstName!,
              lastName: formData.lastName!,
              email: formData.email || '',
              phone: formData.phone || '',
              notes: formData.notes || '',
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
        phone: formData.phone || '',
        notes: formData.notes || ''
      };
      const updated = [...students, newStudent];
      setStudents(updated);
      StorageService.saveStudents(updated);
    }

    setIsModalOpen(false);
    setEditingStudent(null);
    setFormData({});
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
        <Button onClick={() => { setEditingStudent(null); setFormData({}); setIsModalOpen(true); }}>
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
                        setEditingStudent(student);
                        setFormData({
                          firstName: student.firstName,
                          lastName: student.lastName,
                          email: student.email,
                          phone: student.phone,
                          notes: student.notes || '',
                        });
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
        onClose={() => { setIsModalOpen(false); setEditingStudent(null); setFormData({}); }} 
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
              value={formData.phone || ''}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
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

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};