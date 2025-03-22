import React, { useState } from 'react';
import { MaintenanceVisit } from '../types';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface VisitModalProps {
  maintenanceId: string;
  visits: MaintenanceVisit[];
  onClose: () => void;
  onSave: (visits: MaintenanceVisit[]) => Promise<void>;
}

export function VisitModal({ maintenanceId, visits, onClose }: VisitModalProps) {
  const [visitsList, setVisitsList] = useState<MaintenanceVisit[]>(visits || []);
  const [newVisit, setNewVisit] = useState({
    visit_date: '',
    work_done: '',
    attended_by: ''
  });
  const [editingVisit, setEditingVisit] = useState<MaintenanceVisit | null>(null);

  const handleAddVisit = async () => {
    if (!newVisit.visit_date || !newVisit.work_done || !newVisit.attended_by) {
      toast.error('Please fill in all fields');
      return;
    }

    const visit = {
      maintenance_record_id: maintenanceId,
      visit_date: new Date(newVisit.visit_date).toISOString(),
      work_done: newVisit.work_done,
      attended_by: newVisit.attended_by,
    };

    try {
      const { data, error } = await supabase
        .from('maintenance_visits')
        .insert(visit)
        .select()
        .single();

      if (error) throw error;

      setVisitsList([...visitsList, data]);
      setNewVisit({ visit_date: '', work_done: '', attended_by: '' });
      toast.success('Visit added successfully');
    } catch (error) {
      console.error('Error adding visit:', error);
      toast.error('Failed to add visit');
    }
  };

  const handleEditVisit = async (visit: MaintenanceVisit) => {
    try {
      const { error } = await supabase
        .from('maintenance_visits')
        .update({
          visit_date: visit.visit_date,
          work_done: visit.work_done,
          attended_by: visit.attended_by
        })
        .eq('id', visit.id);

      if (error) throw error;

      setVisitsList(visitsList.map(v => v.id === visit.id ? visit : v));
      setEditingVisit(null);
      toast.success('Visit updated successfully');
    } catch (error) {
      console.error('Error updating visit:', error);
      toast.error('Failed to update visit');
    }
  };

  const handleRemoveVisit = async (visitId: string) => {
    if (!window.confirm('Are you sure you want to delete this visit?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('maintenance_visits')
        .delete()
        .eq('id', visitId);

      if (error) throw error;

      setVisitsList(visitsList.filter(visit => visit.id !== visitId));
      toast.success('Visit deleted successfully');
    } catch (error) {
      console.error('Error deleting visit:', error);
      toast.error('Failed to delete visit');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Visit Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Add New Visit</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Visit Date</label>
              <input
                type="date"
                value={newVisit.visit_date}
                onChange={(e) => setNewVisit({ ...newVisit, visit_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Work Done</label>
              <input
                type="text"
                value={newVisit.work_done}
                onChange={(e) => setNewVisit({ ...newVisit, work_done: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Description of work done"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Attended By</label>
              <input
                type="text"
                value={newVisit.attended_by}
                onChange={(e) => setNewVisit({ ...newVisit, attended_by: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Name of attendee"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddVisit}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Visit
          </button>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Visit History ({visitsList.length} visits)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visit Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Done</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attended By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visitsList.map((visit) => (
                  <tr key={visit.id}>
                    {editingVisit?.id === visit.id ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="date"
                            value={editingVisit.visit_date.split('T')[0]}
                            onChange={(e) => setEditingVisit({
                              ...editingVisit,
                              visit_date: new Date(e.target.value).toISOString()
                            })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editingVisit.work_done}
                            onChange={(e) => setEditingVisit({
                              ...editingVisit,
                              work_done: e.target.value
                            })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editingVisit.attended_by}
                            onChange={(e) => setEditingVisit({
                              ...editingVisit,
                              attended_by: e.target.value
                            })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEditVisit(editingVisit)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingVisit(null)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(visit.visit_date), 'PP')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{visit.work_done}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{visit.attended_by}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => setEditingVisit(visit)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveVisit(visit.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {visitsList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No visits recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}