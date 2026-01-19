import React, { useState, useEffect } from 'react';
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
  currentUserRole: string; // 'admin' or 'user'
}

const VISIT_STATUS_OPTIONS = [
  { value: 'Scheduled', label: 'Scheduled' },
  { value: 'Attended', label: 'Attended' },
  { value: 'Closed', label: 'Closed' }
];

const EQUIPMENT_STATUS_OPTIONS = [
  { value: 'Breakdown', label: 'Breakdown' },
  { value: 'Working', label: 'Working' }
];

export function VisitModal({ maintenanceId, visits, onClose, onVisitChange, isExpired, currentUserRole }: VisitModalProps) {
  const [visitsList, setVisitsList] = useState<MaintenanceVisit[]>(visits || []);
  const [newVisit, setNewVisit] = useState({
    scheduled_date: '',
    visit_date: '',
    work_done: '',
    attended_by: '',
    visit_status: '',
    equipment_status: '',
    comments: ''
  });
  const [editingVisit, setEditingVisit] = useState<MaintenanceVisit | null>(null);
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);

  useEffect(() => {
    if (editingVisit) {
      setShowAdditionalFields(editingVisit.visit_status !== 'Scheduled');
    }
  }, [editingVisit?.visit_status]);

  const isVisitInPast = (visitDate: string) => {
    const visit = new Date(visitDate);
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 1)
    visit.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    return visit < currentDate;
  };

  // Check if visit is in the past AND is not a scheduled visit
  const isNonScheduledPastVisit = (visit: MaintenanceVisit) => {
    if (visit.visit_status !== 'Scheduled') {
      const dateToCheck = visit.visit_date;
      return dateToCheck ? isVisitInPast(dateToCheck) : false;
    }
    return false;
  };

  const validateVisitData = (visit: any, isEditing: boolean = false) => {
    const requiredFields = ['visit_status'];

    if (visit.visit_status === 'Scheduled') {
      requiredFields.push('scheduled_date');
    } else {
      requiredFields.push('visit_date', 'work_done', 'attended_by', 'equipment_status');
    }

    const missingFields = requiredFields.filter(field => !visit[field]);
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return false;
    }

    // For non-scheduled visits, enforce date validation
    // if (visit.visit_status !== 'Scheduled') {
    //   const visitDate = new Date(visit.visit_date);
    //   const currentDate = new Date();
    //   currentDate.setDate(currentDate.getDate() - 1)
    //   currentDate.setHours(0, 0, 0, 0);
    //   visitDate.setHours(0, 0, 0, 0);

    //   if (!isEditing && visitDate < currentDate) {
    //     toast.error('Visit date cannot be in the past');
    //     return false;
    //   }
    // }

    // For new Scheduled visits, enforce date validation
    if (!isEditing && visit.visit_status === 'Scheduled') {
      const scheduledDate = new Date(visit.scheduled_date);
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() - 1)
      currentDate.setHours(0, 0, 0, 0);
      scheduledDate.setHours(0, 0, 0, 0);

      if (scheduledDate < currentDate) {
        toast.error('Scheduled date cannot be in the past for new visits');
        return false;
      }
    }

    return true;
  };

  const handleAddVisit = async () => {

    if (!validateVisitData(newVisit)) {
      return;
    }

    const visit = {
      maintenance_record_id: maintenanceId,
      scheduled_date: newVisit.visit_status === 'Scheduled' ? new Date(newVisit.scheduled_date).toISOString() : null,
      visit_date: newVisit.visit_status !== 'Scheduled' ? new Date(newVisit.visit_date).toISOString() : null,
      work_done: newVisit.visit_status === 'Scheduled' ? null : newVisit.work_done,
      attended_by: newVisit.visit_status === 'Scheduled' ? null : newVisit.attended_by,
      visit_status: newVisit.visit_status,
      equipment_status: newVisit.visit_status === 'Scheduled' ? 'Working' : newVisit.equipment_status,
      comments: newVisit.visit_status === 'Scheduled' ? null : newVisit.comments
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
      setNewVisit({ scheduled_date: '', visit_date: '', work_done: '', attended_by: '', visit_status: '', equipment_status: '', comments: ''});
      toast.success('Visit added successfully');
    } catch (error) {
      console.error('Error adding visit:', error);
      toast.error('Failed to add visit');
    }
  };

  const handleEditVisit = async (visit: MaintenanceVisit) => {

    if (!validateVisitData(visit, true)) {
      return;
    }

    try {
      const updateData = {
        scheduled_date: visit.scheduled_date,
        visit_date: visit.visit_status !== 'Scheduled' ? visit.visit_date : null,
        visit_status: visit.visit_status,
        work_done: visit.visit_status === 'Scheduled' ? null : visit.work_done,
        attended_by: visit.visit_status === 'Scheduled' ? null : visit.attended_by,
        equipment_status: visit.visit_status === 'Scheduled' ? 'Working' : visit.equipment_status,
        comments: visit.visit_status === 'Scheduled' ? null : visit.comments
      };

      const { error } = await supabase
        .from('maintenance_visits')
        .update(updateData)
        .eq('id', visit.id);

      if (error) throw error;

      const updatedVisits = visitsList.map(v => v.id === visit.id ? { ...v, ...updateData } : v);
      setVisitsList(updatedVisits);
      onVisitChange(maintenanceId, updatedVisits);
      setEditingVisit(null);
      setShowAdditionalFields(false);
      toast.success('Visit updated successfully');
    } catch (error) {
      console.error('Error updating visit:', error);
      toast.error('Failed to update visit');
    }
  };

  const handleRemoveVisit = async (visitId: string) => {
    // Only allow delete for admin
    if (currentUserRole !== 'admin') {
      toast.error('Only admin can delete visits.');
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

  const handleStatusChange = (status: string, isEditing: boolean = false) => {
    if (isEditing) {
      setEditingVisit(prev => {
        if (!prev) return null;

        return {
          ...prev,
          visit_status: status,
          work_done: status === 'Scheduled' ? null : prev.work_done,
          attended_by: status === 'Scheduled' ? null : prev.attended_by,
          equipment_status: status === 'Scheduled' ? 'Working' : prev.equipment_status,
          visit_date: status === 'Scheduled' ? null : prev.visit_date,
          scheduled_date: prev.scheduled_date,
          comments: status === 'Scheduled' ? null : prev.comments
        };
      });
    } else {
      setNewVisit(prev => ({
        ...prev,
        visit_status: status,
        // scheduled_date: status === 'Scheduled' ? prev.scheduled_date : '',
        scheduled_date: prev.scheduled_date,
        visit_date: '',
        work_done: '',
        attended_by: '',
        equipment_status: status === 'Scheduled' ? 'Working' : '',
        comments: ''
      }));
    }
    setShowAdditionalFields(status !== 'Scheduled');
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
              This maintenance record has expired. Visit history is available in read-only mode except for adding new visits.
            </p>
          </div>
        )}

        {/* Always show Add New Visit section, regardless of isExpired */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Add New Visit</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Visit Status</label>
              <select
                value={newVisit.visit_status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select Status</option>
                {VISIT_STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {newVisit.visit_status === 'Scheduled' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Scheduled Date</label>
                <input
                  type="date"
                  value={newVisit.scheduled_date}
                  onChange={(e) => setNewVisit({ ...newVisit, scheduled_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  // min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            )}

            {newVisit.visit_status !== 'Scheduled' && newVisit.visit_status !== '' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Visit Date</label>
                  <input
                    type="date"
                    value={newVisit.visit_date}
                    onChange={(e) => setNewVisit({ ...newVisit, visit_date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    // min={new Date().toISOString().split('T')[0]}
                    required
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
                    required
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
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Equipment Status</label>
                  <select
                    value={newVisit.equipment_status}
                    onChange={(e) => setNewVisit({ ...newVisit, equipment_status: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Select Status</option>
                    {EQUIPMENT_STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Comments</label>
                  <input
                    type="text"
                    value={newVisit.comments}
                    onChange={(e) => setNewVisit({ ...newVisit, comments: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Comments or notes"
                    required
                  />
                </div>
              </>
            )}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visit Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visit Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Done</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attended By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                  {/* {!isExpired && ( */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  {/* )} */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visitsList.map((visit) => (
                  <tr key={visit.id}>
                    {editingVisit?.id === visit.id && (!isExpired || currentUserRole === 'admin') ? (
                      <>
                        <td className="px-6 py-4">
                          <select
                            value={editingVisit.visit_status}
                            onChange={(e) => handleStatusChange(e.target.value, true)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          >
                            {VISIT_STATUS_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="date"
                            value={editingVisit.scheduled_date ?
                              new Date(editingVisit.scheduled_date).toISOString().substring(0, 10) :
                              ''}
                            onChange={(e) => {
                              console.log('Editing scheduled date:', e.target.value);
                              setEditingVisit({
                                ...editingVisit,
                                scheduled_date: e.target.value ? new Date(e.target.value).toISOString() : ''
                              });
                            }}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required={editingVisit.visit_status === 'Scheduled'}
                          />
                        </td>
                        <td className="px-6 py-4">
                          {editingVisit.visit_status !== 'Scheduled' && (
                            <input
                              type="date"
                              value={editingVisit.visit_date?.split('T')[0] || ''}
                              onChange={(e) => setEditingVisit({
                                ...editingVisit,
                                visit_date: new Date(e.target.value).toISOString()
                              })}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              // min={new Date().toISOString().split('T')[0]}
                              required
                            />
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingVisit.visit_status !== 'Scheduled' && (
                            <input
                              type="text"
                              value={editingVisit.work_done || ''}
                              onChange={(e) => setEditingVisit({
                                ...editingVisit,
                                work_done: e.target.value
                              })}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              required
                            />
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingVisit.visit_status !== 'Scheduled' && (
                            <input
                              type="text"
                              value={editingVisit.attended_by || ''}
                              onChange={(e) => setEditingVisit({
                                ...editingVisit,
                                attended_by: e.target.value
                              })}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              required
                            />
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingVisit.visit_status !== 'Scheduled' && (
                            <select
                              value={editingVisit.equipment_status || ''}
                              onChange={(e) => setEditingVisit({
                                ...editingVisit,
                                equipment_status: e.target.value
                              })}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              required
                            >
                              <option value="">Select Status</option>
                              {EQUIPMENT_STATUS_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingVisit.visit_status !== 'Scheduled' && (
                            <input
                              type="text"
                              value={editingVisit.comments || ''}
                              onChange={(e) => setEditingVisit({
                                ...editingVisit,
                                comments: e.target.value
                              })}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              required
                            />
                          )}
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
                            onClick={() => {
                              setEditingVisit(null);
                              setShowAdditionalFields(false);
                            }}
                            className="inline-flex items-center text-gray-600 hover:text-gray-900"
                            title="Cancel editing"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-sm text-gray-900">{visit.visit_status}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {visit.scheduled_date ? format(new Date(visit.scheduled_date), 'PP') : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {visit.visit_status !== 'Scheduled' && visit.visit_date ? format(new Date(visit.visit_date), 'PP') : ''}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {visit.visit_status !== 'Scheduled' ? visit.work_done : ''}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {visit.visit_status !== 'Scheduled' ? visit.attended_by : ''}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {visit.visit_status !== 'Scheduled' ? visit.equipment_status : ''}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {visit.visit_status !== 'Scheduled' ? visit.comments : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                          <button
                            onClick={() => {
                              // Allow edit for admin even if expired, or for non-expired records
                              if (visit.visit_status === 'Scheduled' || !isNonScheduledPastVisit(visit) || !isExpired || currentUserRole === 'admin') {
                                setEditingVisit(visit);
                              }
                            }}
                            className={`inline-flex items-center ${
                              (!isNonScheduledPastVisit(visit) || !isExpired || currentUserRole === 'admin')
                                ? 'text-indigo-600 hover:text-indigo-900'
                                : 'opacity-50 cursor-not-allowed text-gray-400'
                            }`}
                            title={
                              (!isNonScheduledPastVisit(visit) || !isExpired || currentUserRole === 'admin')
                                ? 'Edit visit'
                                : 'Cannot edit visits for expired records'
                            }
                            disabled={isNonScheduledPastVisit(visit) && isExpired && currentUserRole !== 'admin'}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {currentUserRole === 'admin' && (
                            <button
                              onClick={() => handleRemoveVisit(visit.id)}
                              className="inline-flex items-center text-red-600 hover:text-red-900"
                              title="Delete visit"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {visitsList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
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