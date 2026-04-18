
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { MentoringLog, User, Batch, Module, Role, LogStatus, Group, LogHistory, Intervention, LessonPlan, UserStatus } from '../types';
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
  deleteGroup: (id: string) => Promise<void>;
  addIntervention: (intervention: Intervention) => void;
  addLessonPlan: (plan: LessonPlan) => Promise<void>;
  updateLessonPlan: (plan: LessonPlan) => Promise<void>;
  updateStudentSubmission: (logId: string, studentId: string, artifactUrl: string, reflection: string) => void;
  updateProfile: (fullName: string, avatarUrl: string, coverPhotoUrl?: string) => Promise<void>;
  approveUser: (userId: string, role: Role, data: Partial<User>) => Promise<void>;
  rejectUser: (userId: string, role: Role) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<MentoringLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  
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
      setBatches(fetchedBatches);
    });
    return unsubscribe;
  }, []);

  // Real-time listener for Groups
  useEffect(() => {
    const q = collection(db, 'groups');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedGroups = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id
        };
      }) as Group[];
      setGroups(fetchedGroups);
    });
    return unsubscribe;
  }, []);

  // Real-time listener for Users
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role !== Role.ADMIN && currentUser.role !== Role.MENTOR) return;

    // Both Admin and Mentor can see Students
    const unsubStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      const studentList = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        role: Role.STUDENT 
      } as User));
      
      setUsers(prev => {
        const filtered = prev.filter(u => u.role !== Role.STUDENT);
        return [...filtered, ...studentList];
      });
    });

    // Only Admin can see other Mentors
    let unsubMentors = () => {};
    if (currentUser.role === Role.ADMIN) {
      unsubMentors = onSnapshot(collection(db, 'mentors'), (snapshot) => {
        const mentorList = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          role: Role.MENTOR
        } as User));
        
        setUsers(prev => {
          const filtered = prev.filter(u => u.role !== Role.MENTOR);
          return [...filtered, ...mentorList];
        });
      });
    }

    return () => {
      unsubStudents();
      unsubMentors();
    };
  }, [currentUser]);

  const isAuthenticated = !!currentUser && currentUser.status === UserStatus.APPROVED;

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
    console.log(`[DATA] Fetching profile for UID: ${uid}...`);
    // Attempt role discovery across all 3 tables
    const roles = [Role.STUDENT, Role.MENTOR, Role.ADMIN];
    
    // Timeout-protected discovery: If Firestore takes > 5s, let's stop waiting
    const discoveryPromise = (async () => {
      for (const role of roles) {
        try {
          const docRef = doc(db, getCollectionName(role), uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            return {
              id: uid,
              email: data.email,
              fullName: data.fullName,
              role: data.role as Role,
              avatarUrl: data.avatarUrl,
              coverPhotoUrl: data.coverPhotoUrl,
              mentorType: data.mentorType,
              batchId: data.batchId,
              status: (data.status as UserStatus) || UserStatus.APPROVED
            };
          }
        } catch (err) {
          console.warn(`[DATA] Permission denied/error checking role ${role} for ${uid}`);
        }
      }
      return null;
    })();

    const timeoutPromise = new Promise<null>((resolve) => 
      setTimeout(() => {
        console.warn(`[DATA] Profile fetch timed out for UID: ${uid}`);
        resolve(null);
      }, 5000)
    );

    return Promise.race([discoveryPromise, timeoutPromise]);
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (isRegistering) {
        console.log('[AUTH_LOCK] Ignoring auth change during registration lock.');
        return;
      }

      if (firebaseUser) {
        const profile = await fetchUserProfile(firebaseUser.uid);
        
        // Approval Guard: If user is pending, sign out immediately
        if (profile?.status === UserStatus.PENDING) {
          console.log('[AUTH] User is pending approval. Signing out.');
          await signOut(auth);
          setCurrentUser(null);
          setIsLoading(false);
          return;
        }

        // Strict Role Check: If a specific portal login is in progress, 
        // prevent setting the user if roles don't match.
        if (pendingRole && profile && profile.role !== pendingRole) {
          console.log(`[AUTH] Role mismatch: expected ${pendingRole}, got ${profile.role}. Signing out.`);
          await signOut(auth);
          setCurrentUser(null);
        } else if (profile) {
          setCurrentUser(profile);
        } else {
          setCurrentUser(null);
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
      
      // Approval Guard
      if (data.status === UserStatus.PENDING) {
        await signOut(auth);
        throw new Error('Your account is pending approval by an administrator.');
      }

      if (data.status === UserStatus.REJECTED) {
        await signOut(auth);
        throw new Error('Your account registration has been declined.');
      }

      const profile = {
        id: user.uid,
        email: user.email || '',
        fullName: data.fullName,
        role: data.role as Role,
        mentorType: data.mentorType,
        batchId: data.batchId,
        status: data.status as UserStatus
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
      setIsRegistering(true);
      console.log(`[AUTH_SIGNUP] Phase 1: Creating Firebase Auth account for ${userData.email}...`);
      
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);
      const { user } = userCredential;
      const uid = String(user.uid);
      
      console.log(`[AUTH_SIGNUP] Phase 2: Writing profile to Firestore (UID: ${uid})...`);
      
      const collectionName = getCollectionName(userData.role);
      
      // MANDATORY AWAIT with 3s RACE: 
      // We want to ensure the document exists, but we won't block the UI forever.
      // If it takes > 3s, we assume it's in the offline buffer and proceed.
      try {
        console.log(`[AUTH_SIGNUP] Phase 2: Writing profile... (3s limit)`);
        
          const dbPromise = setDoc(doc(db, collectionName, uid), {
          email: userData.email,
          fullName: userData.fullName,
          role: userData.role,
          uid: uid,
          avatarUrl: '',
          coverPhotoUrl: '',
          status: UserStatus.PENDING,
          createdAt: serverTimestamp()
        });

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('TIMEOUT')), 3000)
        );

        await Promise.race([dbPromise, timeoutPromise]);
        console.log(`[AUTH_SIGNUP] Phase 2 Success: Document synchronized.`);
      } catch (dbError: any) {
        if (dbError.message === 'TIMEOUT') {
          console.warn(`[AUTH_SIGNUP] Phase 2 Warning: Firestore is slow. Proceeding anyway (will save in background).`);
        } else {
          console.error(`[AUTH_SIGNUP] Phase 2 FAILED: Firestore rejection.`, dbError);
          throw new Error(`Database Error: ${dbError.message || 'Could not save profile'}`);
        }
      }

      console.log(`[AUTH_SIGNUP] Phase 3: Finalizing and signing out...`);
      await signOut(auth);
      
      console.log(`[AUTH_SIGNUP] Registration sequence complete.`);
    } catch (error: any) {
      console.error('[AUTH_SIGNUP] Registration Chain Failed:', error);
      throw error;
    } finally {
      setIsRegistering(false);
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

  const addGroup = async (group: Group) => {
    try {
      const { id, ...data } = group;
      await addDoc(collection(db, 'groups'), {
        ...data,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding group:', error);
    }
  };

  const updateGroup = async (group: Group) => {
    try {
      const { id, ...data } = group;
      await updateDoc(doc(db, 'groups', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating group:', error);
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'groups', id));
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
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

  const updateLessonPlan = async (updatedPlan: LessonPlan) => {
    try {
      const { id, ...data } = updatedPlan;
      const docRef = doc(db, 'lessonPlans', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating lesson plan:', error);
    }
  };

  const updateProfile = async (fullName?: string, avatarUrl?: string, coverPhotoUrl?: string) => {
    if (!currentUser) return;
    
    try {
      const collectionName = getCollectionName(currentUser.role);
      const docRef = doc(db, collectionName, currentUser.id);
      
      const updateData: any = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
      if (coverPhotoUrl !== undefined) updateData.coverPhotoUrl = coverPhotoUrl;
      
      if (Object.keys(updateData).length === 0) return;

      await updateDoc(docRef, updateData);

      setCurrentUser(prev => prev ? { 
        ...prev, 
        ...updateData
      } : null);
    } catch (error: any) {
      console.error('Update profile error:', error.message);
      throw error;
    }
  };

  const approveUser = async (userId: string, role: Role, data: Partial<User>) => {
    try {
      const collectionName = getCollectionName(role);
      const docRef = doc(db, collectionName, userId);
      
      // Find user details for the email
      const userProfile = users.find(u => u.id === userId);
      
      // Sanitization: Firestore does not accept 'undefined'
      const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = value;
        return acc;
      }, {} as any);

      console.log(`[DB] Approving ${role} ${userId}...`);
      await updateDoc(docRef, {
        ...cleanData,
        status: UserStatus.APPROVED,
        approvedAt: serverTimestamp()
      });
      
      // 2. Queue Approval Email
      if (userProfile?.email) {
        console.log(`[MAIL] Queuing approval email for ${userProfile.email}...`);
        const portalUrl = role === Role.MENTOR ? '/welcome/mentor' : '/welcome/students';
        
        await addDoc(collection(db, 'mail'), {
          to: userProfile.email,
          message: {
            subject: 'RAISE: Your Account has been Approved!',
            text: `Hello ${userProfile.fullName},\n\nYour registration for the RAISE Mentoring System has been approved by our administrators. You can now login to your portal at: ${window.location.origin}${portalUrl}\n\nWelcome to the community!`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; color: #334155;">
                <h2 style="color: #4f46e5;">Welcome to RAISE!</h2>
                <p>Hello <strong>${userProfile.fullName}</strong>,</p>
                <p>We are excited to inform you that your registration for the RAISE Mentoring System has been <strong>approved</strong>.</p>
                <div style="margin: 30px 0;">
                  <a href="${window.location.origin}${portalUrl}" 
                     style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Login to Portal
                  </a>
                </div>
                <p style="font-size: 0.9em; color: #64748b;">If the button doesn't work, copy this link: ${window.location.origin}${portalUrl}</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                <p style="font-size: 0.8em; color: #94a3b8;">This is an automated notification from the RAISE Mentoring System.</p>
              </div>
            `
          },
          metadata: {
            userId: userId,
            type: 'APPROVAL_NOTIFICATION',
            timestamp: new Date().toISOString()
          }
        });
        console.log(`[MAIL] Email document successfully created in "mail" collection.`);
      }

      alert('User approved and notification queued successfully!');
    } catch (error: any) {
      console.error('Approval error:', error.message);
      throw error;
    }
  };

  const rejectUser = async (userId: string, role: Role) => {
    try {
      const collectionName = getCollectionName(role);
      const docRef = doc(db, collectionName, userId);
      
      await updateDoc(docRef, {
        status: UserStatus.REJECTED,
        rejectedAt: serverTimestamp()
      });
      
      alert('User registration declined.');
    } catch (error: any) {
      console.error('Rejection error:', error.message);
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
      approveUser,
      rejectUser,
      addBatch,
      updateBatch,
      addModule,
      updateModule,
      deleteModule,
      getModulesByBatch,
      addGroup,
      updateGroup,
      deleteGroup,
      addIntervention,
      addLessonPlan,
      updateLessonPlan,
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
