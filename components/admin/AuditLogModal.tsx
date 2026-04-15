import React from 'react';
import { History, XCircle } from 'lucide-react';
import { MentoringLog, User } from '../../types';

interface AuditLogModalProps {
  log: MentoringLog;
  users: User[];
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ log, users, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden animate-fade-in">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <History size={18} /> Audit Trail
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle size={20} />
          </button>
        </div>
        <div className="p-4 max-h-[400px] overflow-y-auto">
          <div className="relative border-l-2 border-indigo-100 ml-3 space-y-6">
            {log.history.map((h, idx) => {
              const actor = users.find(u => u.id === h.actorId);
              return (
                <div key={idx} className="relative pl-6">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white"></div>
                  <div className="text-sm">
                    <p className="font-semibold text-gray-800">{h.action}</p>
                    <p className="text-xs text-gray-500">{new Date(h.timestamp).toLocaleString()}</p>
                    <p className="text-xs text-gray-600 mt-1">by {actor?.fullName} ({actor?.role})</p>
                    {h.note && (
                      <div className="mt-2 bg-gray-50 p-2 rounded text-xs text-gray-600 italic border border-gray-100">
                        "{h.note}"
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
