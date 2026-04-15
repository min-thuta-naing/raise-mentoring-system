import React from 'react';
import { CheckCircle, Download, AlertTriangle, Shield, Eye, XCircle } from 'lucide-react';
import { MentoringLog, User, Module, LogStatus } from '../../types';

interface ApprovalsTabProps {
  logs: MentoringLog[];
  users: User[];
  modules: Module[];
  onUpdateStatus: (id: string, status: LogStatus, reason?: string) => void;
}

export const ApprovalsTab: React.FC<ApprovalsTabProps> = ({ logs, users, modules, onUpdateStatus }) => {
  const pendingLogs = logs.filter(l => l.status === LogStatus.PENDING);

  // Simple Overlap Detection
  const getOverlapWarning = (log: MentoringLog) => {
    const overlaps = logs.some(l =>
      l.id !== log.id &&
      l.mentorId === log.mentorId &&
      l.date === log.date &&
      l.status !== LogStatus.REJECTED &&
      ((l.startTime >= log.startTime && l.startTime < log.endTime) ||
       (l.endTime > log.startTime && l.endTime <= log.endTime))
    );
    return overlaps;
  };

  const handleBatchApprove = () => {
    const validPending = pendingLogs.filter(l => l.isValidSession && !getOverlapWarning(l));
    if (confirm(`Approve ${validPending.length} valid logs without conflicts?`)) {
      validPending.forEach(l => onUpdateStatus(l.id, LogStatus.APPROVED));
    }
  };

  const handleExportAudit = () => {
    const approvedLogs = logs.filter(l => l.status === LogStatus.APPROVED);

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Mentor Name,Module,Duration (Hrs),Mentor Artifact,Student Name,Student Artifact,Student Reflection\n";

    approvedLogs.forEach(log => {
      const mentor = users.find(u => u.id === log.mentorId)?.fullName || 'Unknown';
      const module = modules.find(m => m.id === log.moduleId)?.name || 'Unknown';
      const durationHrs = (log.durationMinutes / 60).toFixed(2);
      const mentorArtifact = log.artifactUrl || 'N/A';

      log.scores.forEach(score => {
        const student = users.find(u => u.id === score.studentId)?.fullName || 'Unknown';
        const studentArtifact = score.studentArtifactUrl || 'N/A';
        const studentReflection = score.studentReflection ? `"${score.studentReflection.replace(/"/g, '""')}"` : 'N/A';

        const row = `"${log.date}","${mentor}","${module}","${durationHrs}","${mentorArtifact}","${student}","${studentArtifact}",${studentReflection}`;
        csvContent += row + "\n";
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex justify-end mb-4 gap-2">
        <button
          onClick={handleExportAudit}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-indigo-700 flex items-center gap-2"
        >
          <Download size={16} /> Export for Audit (CSV)
        </button>
        {pendingLogs.length > 0 && (
          <button
            onClick={handleBatchApprove}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-green-700 flex items-center gap-2"
          >
            <CheckCircle size={16} /> Approve All Valid
          </button>
        )}
      </div>

      {pendingLogs.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-gray-900">All Caught Up!</h3>
          <p className="text-gray-500">No pending logs to review.</p>
        </div>
      ) : (
        pendingLogs.map(log => {
          const mentor = users.find(u => u.id === log.mentorId);
          const module = modules.find(m => m.id === log.moduleId);
          const hasOverlap = getOverlapWarning(log);
          const isProxy = log.recordedBy !== log.mentorId;

          return (
            <div key={log.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 relative">
              {hasOverlap && (
                <div className="absolute top-0 right-0 bg-red-100 text-red-700 px-3 py-1 text-xs font-bold rounded-bl-lg rounded-tr-lg border-l border-b border-red-200 flex items-center gap-1">
                  <AlertTriangle size={12} /> Time Overlap Detected
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <img src={mentor?.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-bold text-gray-900 flex items-center gap-2">
                      {mentor?.fullName}
                      {isProxy && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 flex items-center gap-1">
                          <Shield size={10} /> Recorded by Admin
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{log.date} • {log.startTime} - {log.endTime} ({log.durationMinutes} min)</p>
                  </div>
                </div>
                <div className="ml-13 pl-13">
                  <p className="text-sm font-medium text-indigo-900 bg-indigo-50 inline-block px-2 py-1 rounded mb-2">
                    {module?.name}
                  </p>
                  <p className="text-gray-600 text-sm mb-3">"{log.summaryNote}"</p>
                  <div className="flex gap-4 text-xs text-gray-500 items-center">
                    <a
                      href={log.artifactUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors font-medium"
                    >
                      <Eye size={14} /> View Evidence
                    </a>

                    {log.isValidSession ? (
                      <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        <CheckCircle size={12} /> Valid Working Hour
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded">
                        <AlertTriangle size={12} /> Invalid Duration (&lt;50m)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 justify-center md:border-l md:pl-6 border-gray-100 min-w-[150px]">
                <button
                  onClick={() => onUpdateStatus(log.id, LogStatus.APPROVED)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} /> Verify Log
                </button>
                <button
                  onClick={() => {
                    const reason = prompt("Reason for rejection?");
                    if (reason) onUpdateStatus(log.id, LogStatus.REJECTED, reason);
                  }}
                  className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle size={16} /> Reject
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
