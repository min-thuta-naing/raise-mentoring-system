
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { MentoringLog, User, Batch, Module, Role, LogStatus, Group, LogHistory, Intervention, LessonPlan } from '../types';
import { MOCK_USERS, MOCK_BATCHES, MOCK_MODULES, MOCK_GROUPS, INITIAL_LOGS, MOCK_INTERVENTIONS, MOCK_LESSON_PLANS } from '../constants';
import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  deleteDoc 
} from 'firebase/firestore';

interface DataContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
  signup: (userData: Omit<User, 'id'>, password: string) => Promise<void>;
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
  addBatch: (batch: Batch) => Promise<void>;
  updateBatch: (batch: Batch) => Promise<void>;
  addModule: (module: Module) => Promise<void>;
  updateModule: (module: Module) => Promise<void>;
  deleteModule: (id: string) => Promise<void>;
  getModulesByBatch: (batchId: string) => Module[];
  addGroup: (group: Group) => void;
  updateGroup: (group: Group) => void;
  addIntervention: (intervention: Intervention) => void;
  addLessonPlan: (plan: LessonPlan) => Promise<void>;
  updateStudentSubmission: (logId: string, studentId: string, artifactUrl: string, reflection: string) => void;
  updateProfile: (fullName: string, avatarUrl: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<MentoringLog[]>(INITIAL_LOGS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
  const [interventions, setInterventions] = useState<Intervention[]>(MOCK_INTERVENTIONS);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  
  // Real-time listener for Modules
  useEffect(() => {
    const q = collection(db, 'modules');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedModules = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toMillis?.() || data.createdAt
        };
      }) as Module[];
      setModules(fetchedModules);
    });
    return unsubscribe;
  }, []);

  // Real-time listener for Lesson Plans
  useEffect(() => {
    const q = collection(db, 'lessonPlans');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPlans = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toMillis?.() || data.createdAt
        };
      }) as LessonPlan[];
      setLessonPlans(fetchedPlans);
    });
    return unsubscribe;
  }, []);

  // Real-time listener for Batches
  useEffect(() => {
    const q = collection(db, 'batches');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBatches = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id
        };
      }) as Batch[];
      setBatches(fetchedBatches.length > 0 ? fetchedBatches : MOCK_BATCHES);
    });
    return unsubscribe;
  }, []);


  const isAuthenticated = !!currentUser;

  // Collection Mapper
  const getCollectionName = (role: Role) => {
    switch (role) {
      case Role.STUDENT: return 'students';
      case Role.MENTOR: return 'mentors';
      case Role.ADMIN: return 'admins';
      default: return 'users';
    }
  };

  /**
   * Helper to fetch a user profile from its dedicated role-specific table
   */
  const fetchUserProfile = async (uid: string): Promise<User | null> => {
    // Attempt role discovery across all 3 tables
    const roles = [Role.STUDENT, Role.MENTOR, Role.ADMIN];
    for (const role of roles) {
      const docRef = doc(db, getCollectionName(role), uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: uid,
          email: data.email,
          fullName: data.fullName,
          role: data.role as Role,
          mentorType: data.mentorType,
          batchId: data.batchId
        };
      }
    }
    return null;
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await fetchUserProfile(firebaseUser.uid);
        
        // Strict Role Check: If a specific portal login is in progress, 
        // prevent setting the user if roles don't match.
        if (pendingRole && profile && profile.role !== pendingRole) {
          await signOut(auth);
          setCurrentUser(null);
        } else {
          setCurrentUser(profile);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, [pendingRole]);

  const login = async (email: string, password: string, role: Role) => {
    try {
      setPendingRole(role);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;
      
      // Verification Guard: Check if the user exists in the specific role-table
      const collectionName = getCollectionName(role);
      const docRef = doc(db, collectionName, user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await signOut(auth);
        throw new Error(`Account not found in the ${role.toLowerCase()} portal.`);
      }

      const data = docSnap.data();
      const profile = {
        id: user.uid,
        email: user.email || '',
        fullName: data.fullName,
        role: data.role as Role,
        mentorType: data.mentorType,
        batchId: data.batchId
      };
      
      setCurrentUser(profile);
    } catch (error: any) {
      console.error('Login error:', error.message);
      throw error;
    } finally {
      setPendingRole(null);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  const signup = async (userData: Omit<User, 'id'>, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);
      const { user } = userCredential;
      
      // Store in the dedicated role-specific table
      const collectionName = getCollectionName(userData.role);
      await setDoc(doc(db, collectionName, user.uid), {
        ...userData,
        uid: user.uid,
        createdAt: serverTimestamp()
      });

      setCurrentUser({ ...userData, id: user.uid });
    } catch (error: any) {
      console.error('Signup error:', error.message);
      throw error;
    }
  };

  const switchRole = (role: Role) => {
    const user = users.find(u => u.role === role);
    if (user) setCurrentUser(user);
  };

  const addLog = (log: MentoringLog, overrideMentorId?: string) => {
    // If overrideMentorId is provided (Admin proxy), use it. Otherwise use currentUser.
    const mentorId = overrideMentorId || currentUser?.id || '';
    
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

  const addBatch = async (batch: Batch) => {
    try {
      await addDoc(collection(db, 'batches'), {
        ...batch,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding batch:', error);
    }
  };

  const updateBatch = async (batch: Batch) => {
    try {
      const { id, ...data } = batch;
      await updateDoc(doc(db, 'batches', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating batch:', error);
      throw error;
    }
  };

  const addModule = async (module: Module) => {
    try {
      await addDoc(collection(db, 'modules'), {
        ...module,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding module:', error);
    }
  };

  const updateModule = async (updatedModule: Module) => {
    try {
      const docRef = doc(db, 'modules', updatedModule.id);
      await updateDoc(docRef, {
        ...updatedModule,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating module:', error);
    }
  };

  const deleteModule = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'modules', id));
    } catch (error) {
      console.error('Error deleting module:', error);
    }
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

  const addLessonPlan = async (plan: LessonPlan) => {
    try {
      await addDoc(collection(db, 'lessonPlans'), {
        ...plan,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding lesson plan:', error);
    }
  };

  const updateProfile = async (fullName: string, avatarUrl: string) => {
    if (!currentUser) return;
    
    try {
      const collectionName = getCollectionName(currentUser.role);
      const docRef = doc(db, collectionName, currentUser.id);
      
      await setDoc(docRef, {
        ...currentUser,
        fullName,
        avatarUrl
      }, { merge: true });

      setCurrentUser(prev => prev ? { ...prev, fullName, avatarUrl } : null);
    } catch (error: any) {
      console.error('Update profile error:', error.message);
      throw error;
    }
  };

  return (
    <DataContext.Provider value={{ 
      currentUser, 
      isAuthenticated,
      isLoading,
      login,
      logout,
      signup,
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
      updateBatch,
      addModule,
      updateModule,
      deleteModule,
      getModulesByBatch,
      addGroup,
      updateGroup,
      addIntervention,
      addLessonPlan,
      updateStudentSubmission,
      updateProfile
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
