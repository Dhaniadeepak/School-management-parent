export interface AuthUser {
  id: string;
  name: string;
  role: 'admin' | 'teacher' | 'parent';
  status: string;
  phone?: string;
  schoolId: string;
  schoolName: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export type OtpVerifyResult = Session | { needsSchool: true; schools: { id: string; name: string }[] };

export interface Child {
  id: string;
  name: string;
  admissionNo: string;
  rollNo: number | null;
  classId: string;
  className: string;
  relation: string;
}

export type DayStatus = 'present' | 'absent' | 'holiday' | 'off' | 'upcoming' | 'not_marked';

export interface AttendanceMonth {
  month: string;
  days: { date: string; status: DayStatus; label?: string }[];
  summary: { present: number; absent: number; percentage: number | null };
}

export interface HomeworkItem {
  id: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  attachments: { name: string; mime: string; size: number; url: string }[];
  postedAt: string;
  updatedAt: string;
}

export interface AnnouncementItem {
  id: string;
  kind: 'notice' | 'event';
  title: string;
  body: string;
  event: { date: string; time?: string; place?: string } | null;
  publishAt: string;
}

export interface FeeDue {
  id: string;
  academicYear: string;
  label: string;
  installmentNo: number;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid';
  overdue: boolean;
  paidAt: string | null;
}

export interface PaymentItem {
  id: string;
  amount: number;
  status: 'paid' | 'refunded' | 'created' | 'failed';
  receiptNo: string | null;
  paidAt: string | null;
  method: string | null;
  transactionId: string | null;
}

export interface Fees {
  paymentsEnabled: boolean;
  dues: FeeDue[];
  payments: PaymentItem[];
}

export interface PaymentOrder {
  paymentId: string;
  gateway: 'razorpay' | 'mock';
  orderId: string;
  keyId: string | null;
  amount: number;
  amountPaise: number;
  currency: string;
  schoolName: string;
  studentName: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, string>;
  read: boolean;
  createdAt: string;
}
