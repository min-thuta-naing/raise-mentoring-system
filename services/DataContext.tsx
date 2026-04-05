
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MentoringLog, User, Batch, Module, Role, LogStatus, Group, LogHistory, Intervention, LessonPlan } from '../types';
import { MOCK_USERS, MOCK_BATCHES, MOCK_MODULES, MOCK_GROUPS, INITIAL_LOGS, MOCK_INTERVENTIONS, MOCK_LESSON_PLANS } from '../constants';

interface DataContextType {
  currentUser: User;
  switchRole: (role: Role) => void;
  logs: MentoringLog[];
  users: User[];
  batches: Batch[];
  modules: Module[];
  groups: Group[];
  interventions: Intervention[];
  lessonPlans: LessonPlan[];
  addLog: (log: MentoringLog, overrideMentorId?: string) => void;
  updateLogStatus: (id: string, status: LogStatus, reason?: string) => void;
  getStudentsByBatch: (batchId: string) => User[];
  addUser: (user: User) => void;
  addBatch: (batch: Batch) => void;
  addModule: (module: Module) => void;
  updateModule: (module: Module) => void;
  getModulesByBatch: (batchId: string) => Module[];
  addGroup: (group: Group) => void;
  updateGroup: (group: Group) => void;
  addIntervention: (intervention: Intervention) => void;
  addLessonPlan: (plan: LessonPlan) => void;
  updateStudentSubmission: (logId: string, studentId: string, artifactUrl: string, reflection: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]); // Default to Admin
  const [logs, setLogs] = useState<MentoringLog[]>(INITIAL_LOGS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [batches, setBatches] = useState<Batch[]>(MOCK_BATCHES);
  const [modules, setModules] = useState<Module[]>(MOCK_MODULES);
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
  const [interventions, setInterventions] = useState<Intervention[]>(MOCK_INTERVENTIONS);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>(MOCK_LESSON_PLANS);

  const switchRole = (role: Role) => {
    const user = users.find(u => u.role === role);
    if (user) setCurrentUser(user);
  };

  const addLog = (log: MentoringLog, overrideMentorId?: string) => {
    // If overrideMentorId is provided (Admin proxy), use it. Otherwise use currentUser.
    const mentorId = overrideMentorId || currentUser.id;
    
    setLogs(prev => {
      const existingLogIndex = prev.findIndex(l => l.id === log.id);
      
      if (existingLogIndex >= 0) {
        // Update existing log
        const newLogs = [...prev];
        const existingLog = newLogs[existingLogIndex];
        newLogs[existingLogIndex] = {
          ...log,
          mentorId: existingLog.mentorId, // Keep original mentor
          recordedBy: existingLog.recordedBy,
          history: [
            ...existingLog.history,
            {
              timestamp: new Date().toISOString(),
              actorId: currentUser.id,
              action: `Updated (Status: ${log.status})`
            }
          ]
        };
        return newLogs;
      } else {
        // Add new log
        const logWithHistory = {
          ...log,
          mentorId,
          recordedBy: currentUser.id, // Audit trail: who physically clicked save
          history: [{
            timestamp: new Date().toISOString(),
            actorId: currentUser.id,
            action: 'Created',
            note: currentUser.id !== mentorId ? 'Recorded via Admin Proxy' : undefined
          }]
        };
        return [logWithHistory, ...prev];
      }
    });
  };

  const updateLogStatus = (id: string, status: LogStatus, reason?: string) => {
    setLogs(prev => prev.map(log => {
      if (log.id === id) {
        // Create history entry
        const historyEntry: LogHistory = {
            timestamp: new Date().toISOString(),
            actorId: currentUser.id,
            action: `Status changed to ${status}`,
            note: reason
        };
        return { 
            ...log, 
            status,
            history: [...log.history, historyEntry]
        };
      }
      return log;
    }));
  };

  const updateStudentSubmission = (logId: string, studentId: string, artifactUrl: string, reflection: string) => {
    setLogs(prev => prev.map(log => {
      if (log.id === logId) {
        const updatedScores = log.scores.map(score => {
          if (score.studentId === studentId) {
            return {
              ...score,
              studentArtifactUrl: artifactUrl,
              studentReflection: reflection,
              isFeedbackAcknowledged: log.status !== LogStatus.DRAFT
            };
          }
          return score;
        });
        return { ...log, scores: updatedScores };
      }
      return log;
    }));
  };

  const getStudentsByBatch = (batchId: string) => {
    return users.filter(u => u.role === Role.STUDENT && u.batchId === batchId);
  };

  const addUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };

  const addBatch = (batch: Batch) => {
    setBatches(prev => [...prev, batch]);
  };

  const addModule = (module: Module) => {
    setModules(prev => [...prev, module]);
  };

  const updateModule = (updatedModule: Module) => {
    setModules(prev => prev.map(m => m.id === updatedModule.id ? updatedModule : m));
  };

  const getModulesByBatch = (batchId: string) => {
    return modules.filter(m => m.batchId === batchId);
  };

  const addGroup = (group: Group) => {
    setGroups(prev => [...prev, group]);
  };

  const updateGroup = (updatedGroup: Group) => {
    setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
  };

  const addIntervention = (intervention: Intervention) => {
    setInterventions(prev => [intervention, ...prev]);
  };

  const addLessonPlan = (plan: LessonPlan) => {
    setLessonPlans(prev => [...prev, plan]);
  };

  return (
    <DataContext.Provider value={{ 
      currentUser, 
      switchRole, 
      logs, 
      users, 
      batches, 
      modules,
      groups,
      interventions,
      lessonPlans,
      addLog, 
      updateLogStatus,
      getStudentsByBatch,
      addUser,
      addBatch,
      addModule,
      updateModule,
      getModulesByBatch,
      addGroup,
      updateGroup,
      addIntervention,
      addLessonPlan,
      updateStudentSubmission
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
