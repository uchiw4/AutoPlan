import React, { useState, useEffect } from 'react';
import { Instructor, COLORS } from '../types';
import { StorageService } from '../services/storage';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Trash2, Mail, Phone, User } from 'lucide-react';

export const InstructorsPage: React.FC = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Instructor>>({ color: COLORS[0] });

  useEffect(() => {
    setInstructors(StorageService.getInstructors());
  }, []);

  const handleSave = () => {
    if (!formData.firstName || !formData.lastName) return;

    const newInstructor: Instructor = {
      id: crypto.randomUUID(),
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email || '',
      phone: formData.phone || '',
      color: formData.color || COLORS[0],
    };

    const updated = [...instructors, newInstructor];
    setInstructors(updated);
    StorageService.saveInstructors(updated);
    setIsModalOpen(false);
    setFormData({ color: COLORS[0] });
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce moniteur ?')) {
      const updated = instructors.filter(i => i.id !== id);
      setInstructors(updated);
      StorageService.saveInstructors(updated);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moniteurs</h1>
          <p className="text-gray-500 mt-1">Gérez votre équipe pédagogique.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un moniteur
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {instructors.map((instructor) => (
          <div key={instructor.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:border-gray-300 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" 
                  style={{ backgroundColor: instructor.color }}
                >
                  {instructor.firstName[0]}{instructor.lastName[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{instructor.firstName} {instructor.lastName}</h3>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Moniteur</span>
                </div>
              </div>
              <button onClick={() => handleDelete(instructor.id)} className="text-gray-400 hover:text-red-500">
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <Mail size={14} className="mr-2" />
                {instructor.email || 'Aucun email'}
              </div>
              <div className="flex items-center">
                <Phone size={14} className="mr-2" />
                {instructor.phone || 'Aucun téléphone'}
              </div>
            </div>
          </div>
        ))}

        {instructors.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">Aucun moniteur enregistré.</p>
            </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Nouveau Moniteur"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Couleur du planning</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${formData.color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setFormData({...formData, color: c})}
                />
              ))}
            </div>
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