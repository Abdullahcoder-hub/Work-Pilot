export type Role = 'super_admin' | 'company_admin' | 'team_lead' | 'employee';

export interface Company {
  _id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended';
  seatLimit: number;
  userCount?: number;
  createdAt: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export type NotificationType =
  | 'task_assigned'
  | 'task_completed'
  | 'task_approved'
  | 'task_status_changed'
  | 'meeting_invite'
  | 'meeting_updated'
  | 'meeting_cancelled'
  | 'direct_message'
  | 'leave_approved'
  | 'leave_rejected';

export interface AppNotification {
  _id: string;
  companyId: string;
  recipientId: string;
  actorId: { _id: string; name: string; email: string } | string | null;
  type: NotificationType;
  title: string;
  message: string;
  taskId: string | null;
  meetingId: string | null;
  channelId: string | null;
  leaveId: string | null;
  isRead: boolean;
  createdAt: string;
}

export type ActivityAction =
  | 'task_created'
  | 'task_assigned'
  | 'task_reassigned'
  | 'status_changed'
  | 'task_completed'
  | 'task_reopened'
  | 'task_approved';

export interface ActivityLogEntry {
  _id: string;
  companyId: string;
  taskId: { _id: string; title: string } | string;
  actorId: { _id: string; name: string; email: string } | string;
  action: ActivityAction;
  message: string;
  createdAt: string;
}

export type TaskCategory = 'Study' | 'Work' | 'Personal' | 'Shopping' | 'Fitness';
export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';

export interface Task {
  _id: string;
  companyId: string;
  projectId: string | null;
  createdBy: { _id: string; name: string; email: string } | string;
  assigneeId: { _id: string; name: string; email: string } | string | null;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  order: number;
  dueDate: string;
  completed: boolean;
  completedAt: string | null;
  approvedBy: { _id: string; name: string; email: string } | string | null;
  approvedAt: string | null;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  _id: string;
  companyId: string;
  name: string;
  description: string;
  headUserId: { _id: string; name: string; email: string } | string | null;
  createdBy: string;
  projectCount?: number;
  createdAt: string;
}

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
export type ProjectColor = 'brand' | 'teal' | 'amber' | 'rose' | 'violet' | 'sky';

export interface Project {
  _id: string;
  companyId: string;
  departmentId: { _id: string; name: string } | string | null;
  name: string;
  description: string;
  status: ProjectStatus;
  color: ProjectColor;
  ownerId: { _id: string; name: string; email: string } | string;
  members: ({ _id: string; name: string; email: string } | string)[];
  startDate: string;
  dueDate: string;
  taskCount?: number;
  doneCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: Pagination;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  highPriority: number;
  overdue: number;
}

export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Meeting {
  _id: string;
  companyId: string;
  projectId: { _id: string; name: string; color: ProjectColor } | string | null;
  title: string;
  description: string;
  organizerId: { _id: string; name: string; email: string } | string;
  attendees: ({ _id: string; name: string; email: string } | string)[];
  startTime: string;
  endTime: string;
  location: string;
  status: MeetingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ChatAttachment {
  fileId: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export interface ChatMessage {
  _id: string;
  companyId: string;
  channelId: string;
  senderId: { _id: string; name: string; email: string } | string;
  text: string;
  attachment: ChatAttachment | null;
  createdAt: string;
}

export interface DmThread {
  channelId: string;
  otherUser: { _id: string; name: string; email: string };
  lastMessage: { text: string; createdAt: string; isMine: boolean };
}

export type CalendarEvent =
  | {
      id: string;
      kind: 'task';
      title: string;
      date: string;
      priority: TaskPriority;
      completed: boolean;
      projectId: string | null;
      link: string;
    }
  | {
      id: string;
      kind: 'meeting';
      title: string;
      startTime: string;
      endTime: string;
      status: MeetingStatus;
      projectId: string | null;
      link: string;
    }
  | {
      id: string;
      kind: 'leave';
      title: string;
      startDate: string;
      endDate: string;
      leaveType: LeaveType;
      link: string;
    };

export type AttendanceStatus = 'present' | 'late' | 'half_day' | 'absent';

export interface AttendanceRecord {
  _id: string;
  companyId: string;
  userId: { _id: string; name: string; email: string } | string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: AttendanceStatus;
  notes: string;
  markedBy: { _id: string; name: string } | string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSummary {
  present: number;
  late: number;
  halfDay: number;
  absent: number;
  totalHours: number;
}

export type LeaveType = 'annual' | 'sick' | 'casual' | 'unpaid' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  _id: string;
  companyId: string;
  userId: { _id: string; name: string; email: string } | string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  reviewedBy: { _id: string; name: string } | string | null;
  reviewedAt: string | null;
  reviewNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  leaveType: LeaveType;
  allocated: number | null;
  used: number;
  remaining: number | null;
}

export interface AiChatMessage {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
  intent: string | null;
  createdTaskId: string | null;
  completedTaskId: string | null;
  deletedTaskTitle: string | null;
  scheduledMeetingId: string | null;
  messagedChannelId: string | null;
  sentFileId: string | null;
  attendanceAction: 'clock_in' | 'clock_out' | null;
  createdAt: string;
}

export interface ReportsTaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  byPriority: Record<TaskPriority, number>;
  byCategory: Record<TaskCategory, number>;
}

export interface ReportsTrendPoint {
  date: string;
  created: number;
  completed: number;
}

export interface ReportsProjectStat {
  projectId: string;
  name: string;
  color: ProjectColor;
  status: ProjectStatus;
  total: number;
  done: number;
  progress: number;
}

export interface ReportsWorkload {
  userId: string;
  name: string;
  role: string;
  assigned: number;
  completed: number;
  pending: number;
}

export interface ReportsAttendance {
  present: number;
  late: number;
  halfDay: number;
  absent: number;
  totalRecords: number;
}

export interface ReportsLeave {
  pending: number;
  approvedThisMonth: number;
  byType: Record<LeaveType, number>;
}

export interface ReportsOverview {
  taskStats: ReportsTaskStats;
  taskTrend: ReportsTrendPoint[];
  projectStats: ReportsProjectStat[];
  teamWorkload: ReportsWorkload[];
  attendance: ReportsAttendance;
  leave: ReportsLeave;
}

export interface FileLibraryItem {
  _id: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedBy: { _id: string; name: string } | string;
  createdAt: string;
}

export interface CompanySettings extends Company {
  seatsUsed: number;
}
