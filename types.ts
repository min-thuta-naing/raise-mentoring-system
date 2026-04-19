
export enum Role {
  ADMIN = 'ADMIN',
  MENTOR = 'MENTOR',
  STUDENT = 'STUDENT'
}

export enum MentorType {
  INTERNAL = 'INTERNAL', // University Staff (600 THB rate logic hidden)
  EXTERNAL = 'EXTERNAL', // Industry Expert (1200 THB rate logic hidden)
  NONE = 'NONE'
}

export enum LogStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum PlanStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED'
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  LATE = 'LATE',
  ABSENT = 'ABSENT'
}

export enum ActivityType {
  LECTURE = 'LECTURE',
  PRACTICE = 'PRACTICE'
}

export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  role: Role;
  fullName: string;
  email: string;
  avatarUrl?: string;
  coverPhotoUrl?: string;
  status: UserStatus;
  // Specific to mentors
  mentorType?: MentorType; 
  // Specific to students
  batchId?: string;
  // Metadata for notifications
  lastReadTimestamps?: Record<string, number>;
}

export interface Batch {
  id: string;
  name: string; // e.g. "Gen 8"
  startDate: string; // ISO Date YYYY-MM-DD
  endDate: string; // ISO Date YYYY-MM-DD
  status: 'ACTIVE' | 'CLOSED';
}

export interface AssessmentCategory {
  id: string;
  name: string; // e.g. "Critical Thinking"
  description: string; // Description of what a score of 5 looks like
  weight: number; // Percentage 0-100
  isEnabled: boolean;
  levels?: {
    [score: number]: string; // e.g. { 1: "Poor", 2: "Fair", ... }
  };
}

export enum ArtifactType {
  GITHUB = 'GITHUB',
  FIGMA = 'FIGMA',
  PDF = 'PDF',
  URL = 'URL',
  ANY = 'ANY'
}

export interface Module {
  id: string;
  batchId: string;
  name: string; // e.g. "Data Science"
  expectedArtifactType?: ArtifactType;
  createdAt?: number; // Timestamp for tracking recent creations
}

export interface Rubric {
  id: string; // Same as moduleId for easier lookup
  moduleId: string;
  categories: AssessmentCategory[];
  updatedAt?: any;
}

export interface Group {
  id: string;
  moduleId: string;
  name: string; // e.g. "Group A"
  mentorIds: string[]; 
  studentIds: string[];
}

export interface LessonPlan {
  id: string;
  moduleId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  activityType: ActivityType;
  topic: string;
  mentorId: string;
  status: PlanStatus;
  createdAt?: number;
}

export interface CompetencyScore {
  studentId: string;
  attendance: AttendanceStatus;
  // Dynamic Key-Value for scores. Key = AssessmentCategory.name
  metrics: Record<string, number>; 
  // SFIA specific fields
  feedback?: string;
  sfiaQualifiers?: string[]; // e.g. ['Autonomy', 'Complexity']
  studentArtifactUrl?: string;
  studentReflection?: string;
  isFeedbackAcknowledged?: boolean;
}

export interface LogHistory {
  timestamp: string; // ISO Date
  actorId: string; // User ID who performed the action
  action: string; // e.g. "Created", "Approved", "Rejected"
  note?: string; // Optional reason
}

export interface Intervention {
  id: string;
  studentId: string;
  adminId: string;
  date: string; // ISO Date
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'IDP_SENT' | 'OTHER';
  note: string;
}

export interface MentoringLog {
  id: string;
  mentorId: string; // The mentor who taught the session
  recordedBy: string; // The user who entered the log (Could be Admin)
  batchId: string;
  moduleId: string; // Link to specific module
  date: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  isValidSession: boolean; // True if >= 50 mins
  status: LogStatus;
  summaryNote: string;
  artifactUrl: string;
  scores: CompetencyScore[]; // One entry per student in the session
  history: LogHistory[]; // Audit trail
  isStarred?: boolean; // For "Best Artifacts" showcase
  digitalSignature?: boolean; // Checkbox for integrity
}

export interface SessionValidation {
  isValid: boolean;
  message: string;
  duration: number;
}

export interface Message {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole?: Role;
  content: string;
  timestamp: number;
}
