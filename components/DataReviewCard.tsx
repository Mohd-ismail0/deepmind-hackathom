import React, { useState } from 'react';
import { UserDetails } from '../types';
import { CheckCircle, Edit2, ShieldCheck } from 'lucide-react';

interface DataReviewCardProps {
  data: UserDetails;
  onConfirm: (updatedData: UserDetails) => void;
}

const DataReviewCard: React.FC<DataReviewCardProps> = ({ data, onConfirm }) => {
  const [formData, setFormData] = useState<UserDetails>(data);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleConfirm = () => {
    setIsConfirmed(true);
    onConfirm(formData);
  };

  if (isConfirmed) {
      return (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3 shadow-sm animate-pulse">
              <CheckCircle className="text-green-600" size={24} />
              <div>
                  <p className="font-semibold text-green-800">Information Verified</p>
                  <p className="text-xs text-green-600">Official data locked for automation.</p>
              </div>
          </div>
      );
  }

  return (
    <div className="bg-white border border-indigo-100 rounded-xl shadow-md overflow-hidden max-w-sm mt-2">
      <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2 text-white">
          <ShieldCheck size={18} />
          <span className="font-semibold text-sm">Verify Extracted Data</span>
        </div>
        <span className="text-[10px] bg-indigo-500 text-indigo-100 px-2 py-0.5 rounded">AI Extraction</span>
      </div>

      <div className="p-4 space-y-3 bg-slate-50">
        <p className="text-xs text-slate-500 mb-2">Please review the details extracted from your document. Edit if necessary.</p>
        
        {Object.entries(formData).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                {key.replace(/([A-Z])/g, ' $1').trim()}
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full text-sm p-2 pr-8 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all"
                />
                <Edit2 size={12} className="absolute right-2 top-2.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-white border-t border-indigo-50 flex justify-end">
        <button
          onClick={handleConfirm}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-sm"
        >
          <CheckCircle size={16} />
          <span>Confirm & Proceed</span>
        </button>
      </div>
    </div>
  );
};

export default DataReviewCard;