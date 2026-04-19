import { Batch, Module, Role, User, LogStatus, AttendanceStatus, MentoringLog, Group, Intervention, MentorType, AssessmentCategory, ArtifactType, LessonPlan, PlanStatus, ActivityType, UserStatus } from './types';

export const SYSTEM_FALLBACK_RUBRIC: AssessmentCategory[] = [
    { 
        id: 'def-1', 
        name: 'Business Acumen', 
        description: 'Business understanding, market awareness, and product impact.', 
        weight: 34, 
        isEnabled: true,
        levels: {
            1: "Little to no understanding of the project's business value.",
            2: "Basic grasp of the product but misses market context.",
            3: "Can explain why the product is valuable to users.",
            4: "Strong awareness of business goals and user impact.",
            5: "Strategic thinker; understands complex business requirements and ROI."
        }
    },
    { 
        id: 'def-2', 
        name: 'Creativity', 
        description: 'Innovation capability, logic, and problem-solving skills.', 
        weight: 33, 
        isEnabled: true,
        levels: {
            1: "Struggles with basic logic or simple problem solving.",
            2: "Can solve standard problems with guidance.",
            3: "Functional problem solver; can think of alternative solutions.",
            4: "Proactive innovator; suggests improvements and unique ideas.",
            5: "Exceptional creativity; solves complex logic with elegant, novel approaches."
        }
    },
    { 
        id: 'def-3', 
        name: 'Discipline', 
        description: 'Professionalism, reliability, and communication.', 
        weight: 33, 
        isEnabled: true,
        levels: {
            1: "Often late; poor communication; lacks documentation.",
            2: "Generally reliable but lacks consistency in professional behavior.",
            3: "Consistent and professional; communicates status clearly.",
            4: "Role model for discipline; thorough documentation and proactive updates.",
            5: "Leadership quality; manages time perfectly and sets communication standards."
        }
    }
];

export const MOCK_BATCHES: Batch[] = [
  { id: 'b1', name: 'Batch 5', startDate: '2023-08-01', endDate: '2023-12-31', status: 'ACTIVE' },
  { id: 'b2', name: 'Batch 6', startDate: '2024-01-01', endDate: '2024-06-30', status: 'ACTIVE' },
];

const DEFAULT_RUBRIC: AssessmentCategory[] = [
    { 
        id: 'cat-ai', 
        name: 'AI Integration & Prompting', 
        description: 'API integration, prompt engineering, RAG, and AI feature optimization.', 
        weight: 25, 
        isEnabled: true,
        levels: {
            1: "No AI integration or basic prompts fail to produce useful results.",
            2: "Basic API calls work but prompts are brittle; no error handling.",
            3: "Functional AI integration with decent prompting; handles basic edge cases.",
            4: "Strong prompt engineering (e.g., context management); good AI feature integration.",
            5: "Advanced AI usage (RAG, complex chaining); highly optimized and innovative."
        }
    },
    { 
        id: 'cat-fe', 
        name: 'Frontend & UI/UX', 
        description: 'Component structure, responsive design, styling, and user experience.', 
        weight: 20, 
        isEnabled: true,
        levels: {
            1: "UI is broken or completely unstyled. Fails to match design.",
            2: "Basic UI implemented but lacks responsiveness; poor user experience.",
            3: "Functional UI that mostly matches design; basic responsiveness.",
            4: "Polished UI/UX; fully responsive and closely matches Figma designs.",
            5: "Exceptional UI/UX with smooth animations, accessibility, and pixel-perfect implementation."
        }
    },
    { 
        id: 'cat-be', 
        name: 'Backend & Architecture', 
        description: 'API design, database schema, authentication, and code organization.', 
        weight: 20, 
        isEnabled: true,
        levels: {
            1: "No backend or database; hardcoded data only.",
            2: "Basic API/DB connection but poor structure; potential security flaws.",
            3: "Functional CRUD operations; acceptable database schema and basic auth.",
            4: "Well-structured APIs, solid database design, and secure authentication.",
            5: "Scalable architecture, optimized queries, robust security, and excellent code organization."
        }
    },
    { 
        id: 'cat-git', 
        name: 'Version Control & Agile', 
        description: 'Git workflow, branching, pull requests, and sprint tracking.', 
        weight: 15, 
        isEnabled: true,
        levels: {
            1: "No Git usage or commits directly to main with no messages. No task tracking.",
            2: "Infrequent commits with poor messages. Barely uses task boards.",
            3: "Regular commits. Uses branches for features. Updates task board occasionally.",
            4: "Good commit history, proper use of PRs, and consistent sprint tracking.",
            5: "Excellent Git workflow, thorough PR reviews, and perfect Agile execution."
        }
    },
    { 
        id: 'cat-debug', 
        name: 'Debugging & Autonomy', 
        description: 'Root cause analysis, independent problem solving, and tool usage.', 
        weight: 10, 
        isEnabled: true,
        levels: {
            1: "Helpless when facing errors; requires constant mentor intervention.",
            2: "Tries to fix errors but often guesses; relies heavily on mentors.",
            3: "Can read error logs and solve standard issues independently using Google/AI.",
            4: "Proactively debugs complex issues; uses tools effectively before asking for help.",
            5: "Exceptional problem solver; anticipates edge cases and helps peers debug."
        }
    },
    { 
        id: 'cat-prod', 
        name: 'Product & Communication', 
        description: 'MVP scoping, documentation, pitching, and technical defense.', 
        weight: 10, 
        isEnabled: true,
        levels: {
            1: "Unclear product scope; no documentation; poor presentation skills.",
            2: "Scope is too large or undefined; minimal docs; struggles to explain choices.",
            3: "Clear MVP scope; basic README; can present the product adequately.",
            4: "Well-defined MVP; good documentation; engaging presentation and solid Q&A.",
            5: "Outstanding product vision; comprehensive docs; compelling pitch and expert defense."
        }
    }
];

export const MOCK_MODULES: Module[] = [
  { id: 'm1', batchId: 'b1', name: 'Foundation & AI-Driven Design', expectedArtifactType: ArtifactType.FIGMA },
  { id: 'm2', batchId: 'b1', name: 'Full-Stack Development', expectedArtifactType: ArtifactType.GITHUB },
  { id: 'm3', batchId: 'b1', name: 'AI and Data Analytics', expectedArtifactType: ArtifactType.URL },
  { id: 'm4', batchId: 'b1', name: 'IoT & System Integration', expectedArtifactType: ArtifactType.GITHUB },
  { id: 'm5', batchId: 'b1', name: 'Deployment & Final Launch', expectedArtifactType: ArtifactType.URL },
];

export const MOCK_LESSON_PLANS: LessonPlan[] = [
  // Module 1: Foundation & AI-Driven Design
  { id: 'lp1', moduleId: 'm1', date: '', startTime: '09:00', endTime: '12:00', durationMinutes: 180, activityType: ActivityType.LECTURE, topic: 'Introduction to AI & Design Thinking', mentorId: 'u2', status: PlanStatus.DRAFT },
  { id: 'lp2', moduleId: 'm1', date: '', startTime: '13:00', endTime: '16:00', durationMinutes: 180, activityType: ActivityType.PRACTICE, topic: 'Problem Framing & Ideation Workshop', mentorId: 'u2', status: PlanStatus.DRAFT },
  { id: 'lp3', moduleId: 'm1', date: '', startTime: '09:00', endTime: '16:00', durationMinutes: 420, activityType: ActivityType.PRACTICE, topic: 'Prototyping with AI Tools (Figma + AI plugins)', mentorId: 'u3', status: PlanStatus.DRAFT },

  // Module 2: Full-Stack Development
  { id: 'lp4', moduleId: 'm2', date: '', startTime: '09:00', endTime: '16:00', durationMinutes: 420, activityType: ActivityType.LECTURE, topic: 'Frontend Basics (React, Tailwind)', mentorId: 'u3', status: PlanStatus.DRAFT },
  { id: 'lp5', moduleId: 'm2', date: '', startTime: '09:00', endTime: '16:00', durationMinutes: 420, activityType: ActivityType.PRACTICE, topic: 'Backend Basics (Node.js, Express)', mentorId: 'u3', status: PlanStatus.DRAFT },
  { id: 'lp6', moduleId: 'm2', date: '', startTime: '09:00', endTime: '16:00', durationMinutes: 420, activityType: ActivityType.PRACTICE, topic: 'Database Integration (MongoDB/PostgreSQL)', mentorId: 'u2', status: PlanStatus.DRAFT },

  // Module 3: AI and Data Analytics
  { id: 'lp7', moduleId: 'm3', date: '', startTime: '09:00', endTime: '16:00', durationMinutes: 420, activityType: ActivityType.LECTURE, topic: 'Data Collection & Preprocessing', mentorId: 'u2', status: PlanStatus.DRAFT },
  { id: 'lp8', moduleId: 'm3', date: '', startTime: '09:00', endTime: '16:00', durationMinutes: 420, activityType: ActivityType.PRACTICE, topic: 'Machine Learning Fundamentals', mentorId: 'u2', status: PlanStatus.DRAFT },
  { id: 'lp9', moduleId: 'm3', date: '', startTime: '09:00', endTime: '16:00', durationMinutes: 420, activityType: ActivityType.PRACTICE, topic: 'Integrating AI Models into Apps', mentorId: 'u3', status: PlanStatus.DRAFT },

  // Module 4: IoT & System Integration
  { id: 'lp10', moduleId: 'm4', date: '', startTime: '09:00', endTime: '16:00', durationMinutes: 420, activityType: ActivityType.LECTURE, topic: 'Introduction to IoT & Sensors', mentorId: 'u3', status: PlanStatus.DRAFT },
  { id: 'lp11', moduleId: 'm4', date: '', startTime: '09:00', endTime: '16:00', durationMinutes: 420, activityType: ActivityType.PRACTICE, topic: 'Connecting Devices to the Cloud', mentorId: 'u3', status: PlanStatus.DRAFT },
  { id: 'lp12', moduleId: 'm4', date: '', startTime: '09:00', endTime: '16:00', durationMinutes: 420, activityType: ActivityType.PRACTICE, topic: 'Real-time Data Processing', mentorId: 'u2', status: PlanStatus.DRAFT },

  // Module 5: Deployment & Final Launch
  { id: 'lp13', moduleId: 'm5', date: '', startTime: '09:00', endTime: '16:00', durationMinutes: 420, activityType: ActivityType.LECTURE, topic: 'Cloud Deployment (AWS/GCP/Vercel)', mentorId: 'u2', status: PlanStatus.DRAFT },
  { id: 'lp14', moduleId: 'm5', date: '', startTime: '09:00', endTime: '16:00', durationMinutes: 420, activityType: ActivityType.PRACTICE, topic: 'Testing & QA', mentorId: 'u2', status: PlanStatus.DRAFT },
  { id: 'lp15', moduleId: 'm5', date: '', startTime: '09:00', endTime: '16:00', durationMinutes: 420, activityType: ActivityType.PRACTICE, topic: 'Pitching & Presentation Prep', mentorId: 'u3', status: PlanStatus.DRAFT },
];

export const MOCK_USERS: User[] = [
  // Admin
  { id: 'u1', role: Role.ADMIN, fullName: 'Sarah Connor', email: 'admin@gennext.com', avatarUrl: 'https://i.pravatar.cc/150?u=u1', mentorType: MentorType.NONE, status: UserStatus.APPROVED },
  // Mentors
  { 
    id: 'u2', 
    role: Role.MENTOR, 
    fullName: 'Dr. Alan Grant', 
    email: 'alan@jurassic.com', 
    avatarUrl: 'https://i.pravatar.cc/150?u=u2',
    mentorType: MentorType.EXTERNAL,
    status: UserStatus.APPROVED
  },
  { 
    id: 'u3', 
    role: Role.MENTOR, 
    fullName: 'Ellie Sattler', 
    email: 'ellie@paleo.com', 
    avatarUrl: 'https://i.pravatar.cc/150?u=u3',
    mentorType: MentorType.INTERNAL,
    status: UserStatus.APPROVED
  },
  // Students Batch 1
  { id: 's1', role: Role.STUDENT, fullName: 'John Doe', email: 'john@student.com', batchId: 'b1', avatarUrl: 'https://i.pravatar.cc/150?u=s1', status: UserStatus.APPROVED },
  { id: 's2', role: Role.STUDENT, fullName: 'Jane Smith', email: 'jane@student.com', batchId: 'b1', avatarUrl: 'https://i.pravatar.cc/150?u=s2', status: UserStatus.APPROVED },
  { id: 's3', role: Role.STUDENT, fullName: 'Bob Brown', email: 'bob@student.com', batchId: 'b1', avatarUrl: 'https://i.pravatar.cc/150?u=s3', status: UserStatus.APPROVED },
  // Students Batch 2
  { id: 's4', role: Role.STUDENT, fullName: 'Alice Wonder', email: 'alice@student.com', batchId: 'b2', avatarUrl: 'https://i.pravatar.cc/150?u=s4', status: UserStatus.APPROVED },
  { id: 's5', role: Role.STUDENT, fullName: 'Charlie Chaplin', email: 'charlie@student.com', batchId: 'b2', avatarUrl: 'https://i.pravatar.cc/150?u=s5', status: UserStatus.APPROVED },
];

export const MOCK_GROUPS: Group[] = [
  { id: 'g1', moduleId: 'm1', name: 'Group A (Raptors)', mentorIds: ['u2'], studentIds: ['s1', 's2'] },
  { id: 'g2', moduleId: 'm1', name: 'Group B (Rex)', mentorIds: ['u3'], studentIds: ['s3'] }
];

export const MOCK_INTERVENTIONS: Intervention[] = [
  { id: 'int-1', studentId: 's5', adminId: 'u1', date: '2023-10-12T10:00:00Z', type: 'CALL', note: 'Called student regarding absence. He was sick.' }
];

const generateHistory = (): MentoringLog[] => {
  const logs: MentoringLog[] = [];
  // Pending Logs
  logs.push({
    id: 'log-001', mentorId: 'u2', recordedBy: 'u2', batchId: 'b1', moduleId: 'm1', date: '2023-10-10', startTime: '13:00', endTime: '15:00', durationMinutes: 120, isValidSession: true, status: LogStatus.PENDING, summaryNote: 'Intro to Pandas', artifactUrl: '#',
    scores: [
        { studentId: 's1', attendance: AttendanceStatus.PRESENT, metrics: { 'AI Integration & Prompting': 4, 'Frontend & UI/UX': 3, 'Backend & Architecture': 3, 'Version Control & Agile': 4, 'Debugging & Autonomy': 3, 'Product & Communication': 5 }, feedback: "Good understanding of dataframes.", sfiaQualifiers: ['Autonomy'] }, 
        { studentId: 's2', attendance: AttendanceStatus.PRESENT, metrics: { 'AI Integration & Prompting': 5, 'Frontend & UI/UX': 5, 'Backend & Architecture': 4, 'Version Control & Agile': 5, 'Debugging & Autonomy': 4, 'Product & Communication': 5 }, feedback: "Excellent performance." }, 
        { studentId: 's3', attendance: AttendanceStatus.LATE, metrics: { 'AI Integration & Prompting': 3, 'Frontend & UI/UX': 2, 'Backend & Architecture': 2, 'Version Control & Agile': 3, 'Debugging & Autonomy': 2, 'Product & Communication': 4 } }
    ],
    history: [{ timestamp: '2023-10-10T15:05:00Z', actorId: 'u2', action: 'Created' }]
  });
  logs.push({
    id: 'log-003', mentorId: 'u3', recordedBy: 'u3', batchId: 'b2', moduleId: 'm2', date: '2023-10-11', startTime: '09:00', endTime: '11:00', durationMinutes: 120, isValidSession: true, status: LogStatus.PENDING, summaryNote: 'React Components Deep Dive', artifactUrl: '#',
    scores: [
        { studentId: 's4', attendance: AttendanceStatus.PRESENT, metrics: { 'AI Integration & Prompting': 4, 'Frontend & UI/UX': 5, 'Backend & Architecture': 3, 'Version Control & Agile': 4, 'Debugging & Autonomy': 4, 'Product & Communication': 4 } }, 
        { studentId: 's5', attendance: AttendanceStatus.ABSENT, metrics: { 'AI Integration & Prompting': 0, 'Frontend & UI/UX': 0, 'Backend & Architecture': 0, 'Version Control & Agile': 0, 'Debugging & Autonomy': 0, 'Product & Communication': 0 } }
    ],
    history: [{ timestamp: '2023-10-11T11:05:00Z', actorId: 'u3', action: 'Created' }]
  });
  
  // Approved History (Sept)
  logs.push({
    id: 'log-hist-1', mentorId: 'u2', recordedBy: 'u2', batchId: 'b1', moduleId: 'm1', date: '2023-09-01', startTime: '13:00', endTime: '15:00', durationMinutes: 120, isValidSession: true, status: LogStatus.APPROVED, summaryNote: 'Python Basics', artifactUrl: '#',
    scores: [
        { studentId: 's1', attendance: AttendanceStatus.PRESENT, metrics: { 'AI Integration & Prompting': 3, 'Frontend & UI/UX': 3, 'Backend & Architecture': 3, 'Version Control & Agile': 3, 'Debugging & Autonomy': 3, 'Product & Communication': 4 } }, 
        { studentId: 's2', attendance: AttendanceStatus.PRESENT, metrics: { 'AI Integration & Prompting': 4, 'Frontend & UI/UX': 4, 'Backend & Architecture': 4, 'Version Control & Agile': 4, 'Debugging & Autonomy': 4, 'Product & Communication': 5 } }, 
        { studentId: 's3', attendance: AttendanceStatus.PRESENT, metrics: { 'AI Integration & Prompting': 3, 'Frontend & UI/UX': 3, 'Backend & Architecture': 3, 'Version Control & Agile': 3, 'Debugging & Autonomy': 3, 'Product & Communication': 4 } }
    ],
    history: [
        { timestamp: '2023-09-01T15:05:00Z', actorId: 'u2', action: 'Created' },
        { timestamp: '2023-09-02T09:00:00Z', actorId: 'u1', action: 'Approved', note: 'Standard session' }
    ]
  });
   logs.push({
    id: 'log-hist-2', mentorId: 'u2', recordedBy: 'u2', batchId: 'b1', moduleId: 'm1', date: '2023-09-08', startTime: '13:00', endTime: '15:00', durationMinutes: 120, isValidSession: true, status: LogStatus.APPROVED, summaryNote: 'Data Cleaning', artifactUrl: '#',
    scores: [
        { studentId: 's1', attendance: AttendanceStatus.PRESENT, metrics: { 'AI Integration & Prompting': 4, 'Frontend & UI/UX': 4, 'Backend & Architecture': 3, 'Version Control & Agile': 4, 'Debugging & Autonomy': 4, 'Product & Communication': 5 } }, 
        { studentId: 's2', attendance: AttendanceStatus.PRESENT, metrics: { 'AI Integration & Prompting': 5, 'Frontend & UI/UX': 5, 'Backend & Architecture': 4, 'Version Control & Agile': 5, 'Debugging & Autonomy': 5, 'Product & Communication': 5 } }, 
        { studentId: 's3', attendance: AttendanceStatus.ABSENT, metrics: { 'AI Integration & Prompting': 0, 'Frontend & UI/UX': 0, 'Backend & Architecture': 0, 'Version Control & Agile': 0, 'Debugging & Autonomy': 0, 'Product & Communication': 0 } }
    ],
    history: [
        { timestamp: '2023-09-08T15:05:00Z', actorId: 'u2', action: 'Created' },
        { timestamp: '2023-09-09T10:00:00Z', actorId: 'u1', action: 'Approved' }
    ]
  });
  
  // Rejected History
  logs.push({
    id: 'log-002', mentorId: 'u2', recordedBy: 'u2', batchId: 'b1', moduleId: 'm1', date: '2023-10-17', startTime: '13:00', endTime: '13:40', durationMinutes: 40, isValidSession: false, status: LogStatus.REJECTED, summaryNote: 'Session cut short', artifactUrl: '',
    scores: [
        { studentId: 's1', attendance: AttendanceStatus.PRESENT, metrics: { 'AI Integration & Prompting': 3, 'Frontend & UI/UX': 3, 'Backend & Architecture': 3, 'Version Control & Agile': 3, 'Debugging & Autonomy': 3, 'Product & Communication': 4 } }, 
        { studentId: 's2', attendance: AttendanceStatus.ABSENT, metrics: { 'AI Integration & Prompting': 0, 'Frontend & UI/UX': 0, 'Backend & Architecture': 0, 'Version Control & Agile': 0, 'Debugging & Autonomy': 0, 'Product & Communication': 0 } }, 
        { studentId: 's3', attendance: AttendanceStatus.PRESENT, metrics: { 'AI Integration & Prompting': 3, 'Frontend & UI/UX': 3, 'Backend & Architecture': 3, 'Version Control & Agile': 3, 'Debugging & Autonomy': 3, 'Product & Communication': 4 } }
    ],
    history: [
        { timestamp: '2023-10-17T13:45:00Z', actorId: 'u2', action: 'Created' },
        { timestamp: '2023-10-17T16:00:00Z', actorId: 'u1', action: 'Rejected', note: 'Under 50 minutes' }
    ]
  });

  return logs;
};

export const PRESET_COVERS = [
  '/images/covers/1.png',
  '/images/covers/2.png',
  '/images/covers/3.png',
  '/images/covers/4.png',
  '/images/covers/5.png'
];

export const DEFAULT_COVER = '/images/covers/placeholder.png';
export const DEFAULT_AVATAR = '/images/avatars/placeholder.png';

export const PRESET_AVATARS = [
  '/images/avatars/1.png',
  '/images/avatars/2.png',
  '/images/avatars/3.png',
  '/images/avatars/4.png',
  '/images/avatars/5.png',
  '/images/avatars/6.png',
  '/images/avatars/7.png',
  '/images/avatars/8.png',
  '/images/avatars/9.png',
  '/images/avatars/10.png',
  '/images/avatars/11.png'
];

export const INITIAL_LOGS: MentoringLog[] = generateHistory();
