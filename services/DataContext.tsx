
import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { query, where, orderBy } from 'firebase/firestore';
import { MentoringLog, User, Batch, Module, Role, LogStatus, Group, LogHistory, Intervention, LessonPlan, UserStatus, Message } from '../types';
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
  messages: Message[];
  sendMessage: (groupId: string, content: string) => Promise<void>;
  unreadCounts: Record<string, number>;
  totalUnreadCount: number;
  markGroupAsRead: (groupId: string) => void;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Notification State (Synced via Firestore)
  const lastReadTimestamps = useMemo(() => {
    return currentUser?.lastReadTimestamps || {};
  }, [currentUser]);

  // Real-time listener for CURRENT USER profile (for lastReadTimestamps and global updates)
  useEffect(() => {
    if (!auth.currentUser) return;
    
    // We need to know the role to find the correct collection
    // Since currentUser might be null during first loads, we try role discovery
    // and then stick to it.
    const uid = auth.currentUser.uid;
    let unsub = () => {};

    const startListener = async () => {
      // Find the role first (if not already known)
      let currentRole = currentUser?.role;
      if (!currentRole) {
          const profile = await fetchUserProfile(uid);
          currentRole = profile?.role;
      }
      if (!currentRole) return;

      unsub = onSnapshot(doc(db, getCollectionName(currentRole), uid), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setCurrentUser({
            id: uid,
            ...data,
            role: currentRole as Role
          } as User);
        }
      });
    };

    startListener();
    return () => unsub();
  }, [auth.currentUser?.uid]);

  // Calculate unread counts
  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    messages.forEach(msg => {
      const lastRead = lastReadTimestamps[msg.groupId] || 0;
      if (msg.timestamp > lastRead && msg.senderId !== currentUser?.id) {
        counts[msg.groupId] = (counts[msg.groupId] || 0) + 1;
      }
    });
    return counts;
  }, [messages, lastReadTimestamps, currentUser]);

  const totalUnreadCount = useMemo(() => {
    return Object.values(unreadCounts).reduce((sum: number, count: number) => sum + count, 0);
  }, [unreadCounts]);

  const markGroupAsRead = async (groupId: string) => {
    if (!currentUser) return;
    try {
      const collectionName = getCollectionName(currentUser.role);
      const userRef = doc(db, collectionName, currentUser.id);
      
      await updateDoc(userRef, {
        [`lastReadTimestamps.${groupId}`]: Date.now()
      });
    } catch (error) {
      console.error("[DATA] Mark As Read failed:", error);
    }
  };
  
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

  // Real-time listener for Group Messages
  useEffect(() => {
    if (!currentUser) return;
    
    // Listen for all messages, sorted by time
    const q = query(collection(db, 'group_messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Message[];
      setMessages(fetchedMessages);
    });
    return unsubscribe;
  }, [currentUser]);

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
    
    // Admins, Mentors, AND Students all need to see users for group visibility and chats
    const isAuthorized = currentUser.role === Role.ADMIN || currentUser.role === Role.MENTOR || currentUser.role === Role.STUDENT;
    if (!isAuthorized) return;

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

    // Admin, Mentors, and Students should all see mentors for group visibility
    let unsubMentors = () => {};
    if (currentUser.role === Role.ADMIN || currentUser.role === Role.MENTOR || currentUser.role === Role.STUDENT) {
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

  // Real-time listener for Mentoring Logs
  useEffect(() => {
    if (!currentUser) return;

    let q = query(collection(db, 'mentoring_logs'));
    
    // Role-based filtering at the query level where possible
    if (currentUser.role === Role.MENTOR) {
      q = query(collection(db, 'mentoring_logs'), where('mentorId', '==', currentUser.id));
    } else if (currentUser.role === Role.STUDENT) {
      // Students fetch logs for their batch
      if (currentUser.batchId) {
        q = query(collection(db, 'mentoring_logs'), where('batchId', '==', currentUser.batchId));
      } else {
        // If no batch, they see nothing
        setLogs([]);
        return;
      }
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetchedLogs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as MentoringLog[];
      
      // Privacy Guard: For students, filter logs to only those where they are participants
      if (currentUser.role === Role.STUDENT) {
        fetchedLogs = fetchedLogs.filter(log => 
          log.scores?.some(s => s.studentId === currentUser.id)
        );
      }
      
      // Sort on client: Date desc, then StartTime desc
      const sorted = fetchedLogs.sort((a, b) => {
        const dateCompare = (b.date || '').localeCompare(a.date || '');
        if (dateCompare !== 0) return dateCompare;
        return (b.startTime || '').localeCompare(a.startTime || '');
      });
      
      setLogs(sorted);
    }, (error) => {
      console.error("[FIRESTORE] Logs Listener Error:", error);
    });

    return unsubscribe;
  }, [currentUser, currentUser?.batchId]);

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

  const addLog = async (log: MentoringLog, overrideMentorId?: string) => {
    const mentorId = overrideMentorId || currentUser?.id || '';
    
    try {
      console.log('[LOG] Persistence: Initiating save...', { id: log.id, mentorId });
      
      // 1. Generate a clean document ID
      const docId = log.id.startsWith('log-') ? `L${Date.now()}_${Math.random().toString(36).substr(2, 5)}` : log.id;

      // 2. Prepare Data & Audit
      const { id, ...logData } = log;
      
      // Prepare the history entry without any undefined fields
      const historyEntry: LogHistory = {
        timestamp: new Date().toISOString(),
        actorId: currentUser?.id || 'system',
        action: 'Log Saved/Updated'
      };
      
      // Only add note if we're in proxy mode
      if (currentUser?.id && currentUser.id !== mentorId) {
        historyEntry.note = 'Recorded via Management Portal';
      }

      const logPayload = {
        ...logData,
        mentorId,
        recordedBy: currentUser?.id || 'manual-entry',
        history: [...(log.history || []), historyEntry],
        updatedAt: serverTimestamp()
      };

      // 3. Final Sanitization: Firestore REJECTS "undefined". 
      // We must strip all undefined values recursively.
      const sanitize = (obj: any): any => {
        if (Array.isArray(obj)) return obj.map(sanitize);
        if (obj !== null && typeof obj === 'object' && !(obj instanceof Date) && obj.constructor.name !== 'FieldValueImpl') {
          return Object.fromEntries(
            Object.entries(obj)
              .filter(([_, v]) => v !== undefined)
              .map(([k, v]) => [k, sanitize(v)])
          );
        }
        return obj;
      };

      const finalPayload = sanitize(logPayload);

      // 4. Use setDoc for maximum compatibility
      const logRef = doc(db, 'mentoring_logs', docId);
      console.log(`[LOG] Writing sanitized payload to collection 'mentoring_logs' with ID: ${docId}`);
      
      await setDoc(logRef, finalPayload, { merge: true });
      
      console.log('[LOG] Save successful.');
    } catch (error: any) {
      console.error('CRITICAL: Firestore save failure:', error);
      throw error;
    }
  };

  const updateLogStatus = async (id: string, status: LogStatus, reason?: string) => {
    try {
      const historyEntry: LogHistory = {
        timestamp: new Date().toISOString(),
        actorId: currentUser?.id || 'system',
        action: `Status changed to ${status}`,
        ...(reason ? { note: reason } : {})
      };

      const logRef = doc(db, 'mentoring_logs', id);
      const logSnap = await getDoc(logRef);
      if (logSnap.exists()) {
        const currentData = logSnap.data();
        await updateDoc(logRef, {
          status,
          history: [...(currentData.history || []), historyEntry],
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating log status:', error);
      throw error;
    }
  };

  const updateStudentSubmission = async (logId: string, studentId: string, artifactUrl: string, reflection: string) => {
    try {
      const logRef = doc(db, 'mentoring_logs', logId);
      const logSnap = await getDoc(logRef);
      
      if (logSnap.exists()) {
        const currentData = logSnap.data();
        const updatedScores = (currentData.scores || []).map((score: any) => {
          if (score.studentId === studentId) {
            return {
              ...score,
              studentArtifactUrl: artifactUrl,
              studentReflection: reflection,
              isFeedbackAcknowledged: currentData.status !== LogStatus.DRAFT
            };
          }
          return score;
        });

        await updateDoc(logRef, { 
          scores: updatedScores,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating student submission:', error);
      throw error;
    }
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

  const sendMessage = async (groupId: string, content: string) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, 'group_messages'), {
        groupId,
        senderId: currentUser.id,
        senderName: currentUser.fullName,
        senderAvatar: currentUser.avatarUrl || '',
        senderRole: currentUser.role,
        content,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error sending message:', error);
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
      messages,
      sendMessage,
      unreadCounts,
      totalUnreadCount,
      markGroupAsRead,
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
