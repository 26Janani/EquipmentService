import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (dates: [Date | null, Date | null]) => void;
  label: string;
}

export function DateRangePicker({ startDate, endDate, onChange, label }: DateRangePickerProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center space-x-2">
        <DatePicker
          selected={startDate}
          onChange={(date) => onChange([date, endDate])}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholderText="Start Date"
          isClearable
          dateFormat="dd/MM/yyyy"
        />
        <span className="text-gray-500">to</span>
        <DatePicker
          selected={endDate}
          onChange={(date) => onChange([startDate, date])}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholderText="End Date"
          isClearable
          dateFormat="dd/MM/yyyy"
        />
      </div>
    </div>
  );
}