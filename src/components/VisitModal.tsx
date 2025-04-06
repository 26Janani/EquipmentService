import React, { useState } from 'react';
import { MaintenanceVisit } from '../types';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Pencil, Trash2, X, Save, XCircle } from 'lucide-react';

interface VisitModalProps {
  maintenanceId: string;
  visits: MaintenanceVisit[];
  onClose: () => void;
  onVisitChange: (maintenanceId: string, visits: MaintenanceVisit[]) => void;
  isExpired: boolean;
}

const VISIT_STATUS_OPTIONS = [
  { value: 'Attended', label: 'Attended' },
  { value: 'Closed', label: 'Closed' }
];

const EQUIPMENT_STATUS_OPTIONS = [
  { value: 'Breakdown', label: 'Breakdown' },
  { value: 'Working', label: 'Working' }
];

export function VisitModal({ maintenanceId, visits, onClose, onVisitChange, isExpired }: VisitModalProps) {
  const [visitsList, setVisitsList] = useState<MaintenanceVisit[]>(visits || []);
  const [newVisit, setNewVisit] = useState({
    visit_date: '',
    work_done: '',
    attended_by: '',
    visit_status: '',
    equipment_status: ''
  });
  const [editingVisit, setEditingVisit] = useState<MaintenanceVisit | null>(null);

  const isVisitInPast = (visitDate: string) => {
    const visit = new Date(visitDate);
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 1)
    visit.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    return visit < currentDate;
  };

  const handleAddVisit = async () => {
    if (isExpired) {
      toast.error('Cannot add visits to expired records');
      return;
    }

    if (!newVisit.visit_date || !newVisit.work_done || !newVisit.attended_by || !newVisit.visit_status || !newVisit.equipment_status) {
      toast.error('Please fill in all fields');
      return;
    }

    const visitDate = new Date(newVisit.visit_date);
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 1)
    currentDate.setHours(0, 0, 0, 0);
    visitDate.setHours(0, 0, 0, 0);

    if (visitDate < currentDate) {
      toast.error('Visit date cannot be in the past');
      return;
    }

    const visit = {
      maintenance_record_id: maintenanceId,
      visit_date: new Date(newVisit.visit_date).toISOString(),
      work_done: newVisit.work_done,
      attended_by: newVisit.attended_by,
      visit_status: newVisit.visit_status,
      equipment_status: newVisit.equipment_status
    };

    try {
      const { data, error } = await supabase
        .from('maintenance_visits')
        .insert(visit)
        .select()
        .single();

      if (error) throw error;

      const updatedVisits = [...visitsList, data];
      setVisitsList(updatedVisits);
      onVisitChange(maintenanceId, updatedVisits);
      setNewVisit({ visit_date: '', work_done: '', attended_by: '', visit_status: '', equipment_status: '' });
      toast.success('Visit added successfully');
    } catch (error) {
      console.error('Error adding visit:', error);
      toast.error('Failed to add visit');
    }
  };

  const handleEditVisit = async (visit: MaintenanceVisit) => {
    if (isExpired) {
      toast.error('Cannot edit visits of expired records');
      return;
    }

    const visitDate = new Date(visit.visit_date);
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 1)
    currentDate.setHours(0, 0, 0, 0);
    visitDate.setHours(0, 0, 0, 0);

    if (visitDate < currentDate) {
      toast.error('Visit date cannot be in the past');
      return;
    }

    try {
      const { error } = await supabase
        .from('maintenance_visits')
        .update({
          visit_date: visit.visit_date,
          work_done: visit.work_done,
          attended_by: visit.attended_by,
          visit_status: visit.visit_status,
          equipment_status: visit.equipment_status
        })
        .eq('id', visit.id);

      if (error) throw error;

      const updatedVisits = visitsList.map(v => v.id === visit.id ? visit : v);
      setVisitsList(updatedVisits);
      onVisitChange(maintenanceId, updatedVisits);
      setEditingVisit(null);
      toast.success('Visit updated successfully');
    } catch (error) {
      console.error('Error updating visit:', error);
      toast.error('Failed to update visit');
    }
  };

  const handleRemoveVisit = async (visitId: string) => {
    if (isExpired) {
      toast.error('Cannot delete visits from expired records');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this visit?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('maintenance_visits')
        .delete()
        .eq('id', visitId);

      if (error) throw error;

      const updatedVisits = visitsList.filter(visit => visit.id !== visitId);
      setVisitsList(updatedVisits);
      onVisitChange(maintenanceId, updatedVisits);
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
          <h2 className="text-xl font-semibold">Visit History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            title="Close modal"
          >
            <span className="sr-only">Close</span>
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {isExpired && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">
              This maintenance record has expired. Visit history is available in read-only mode.
            </p>
          </div>
        )}

        {!isExpired && (
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
                  min={new Date().toISOString().split('T')[0]}
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Visit Status</label>
                <select
                  value={newVisit.visit_status}
                  onChange={(e) => setNewVisit({ ...newVisit, visit_status: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select Status</option>
                  {VISIT_STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Equipment Status</label>
                <select
                  value={newVisit.equipment_status}
                  onChange={(e) => setNewVisit({ ...newVisit, equipment_status: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select Status</option>
                  {EQUIPMENT_STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
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
        )}

        <div>
          <h3 className="text-lg font-medium mb-2">Visit History ({visitsList.length} visits)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visit Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Done</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attended By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visit Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment Status</th>
                  {!isExpired && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visitsList.map((visit) => (
                  <tr key={visit.id}>
                    {editingVisit?.id === visit.id && !isExpired ? (
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
                            min={new Date().toISOString().split('T')[0]}
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
                        <td className="px-6 py-4">
                          <select
                            value={editingVisit.visit_status}
                            onChange={(e) => setEditingVisit({
                              ...editingVisit,
                              visit_status: e.target.value
                            })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          >
                            {VISIT_STATUS_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={editingVisit.equipment_status}
                            onChange={(e) => setEditingVisit({
                              ...editingVisit,
                              equipment_status: e.target.value
                            })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          >
                            {EQUIPMENT_STATUS_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                          <button
                            onClick={() => handleEditVisit(editingVisit)}
                            className="inline-flex items-center text-green-600 hover:text-green-900"
                            title="Save changes"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingVisit(null)}
                            className="inline-flex items-center text-gray-600 hover:text-gray-900"
                            title="Cancel editing"
                          >
                            <XCircle className="h-4 w-4" />
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
                        <td className="px-6 py-4 text-sm text-gray-900">{visit.visit_status}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{visit.equipment_status}</td>
                        {!isExpired && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                            <button
                              onClick={() => !isVisitInPast(visit.visit_date) && setEditingVisit(visit)}
                              className={`inline-flex items-center ${
                                isVisitInPast(visit.visit_date) 
                                  ? 'opacity-50 cursor-not-allowed text-gray-400' 
                                  : 'text-indigo-600 hover:text-indigo-900'
                              }`}
                              title={isVisitInPast(visit.visit_date) ? 'Cannot edit past visits' : 'Edit visit'}
                              disabled={isVisitInPast(visit.visit_date)}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => !isVisitInPast(visit.visit_date) && handleRemoveVisit(visit.id)}
                              className={`inline-flex items-center ${
                                isVisitInPast(visit.visit_date)
                                  ? 'opacity-50 cursor-not-allowed text-gray-400'
                                  : 'text-red-600 hover:text-red-900'
                              }`}
                              title={isVisitInPast(visit.visit_date) ? 'Cannot delete past visits' : 'Delete visit'}
                              disabled={isVisitInPast(visit.visit_date)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                ))}
                {visitsList.length === 0 && (
                  <tr>
                    <td colSpan={isExpired ? 5 : 6} className="px-6 py-4 text-center text-sm text-gray-500">
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