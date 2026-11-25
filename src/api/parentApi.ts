import type {
  AnnouncementItem,
  AttendanceMonth,
  Child,
  Fees,
  HomeworkItem,
  NotificationItem,
  OtpVerifyResult,
  PaymentOrder,
} from '../types';
import { baseApi, unwrap } from './baseApi';

export const parentApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // ---------- P1: OTP login ----------
    requestOtp: b.mutation<{ sent: boolean; expiresInSeconds: number }, { phone: string }>({
      query: (body) => ({ url: '/auth/parent/otp/request', method: 'POST', body }),
      transformResponse: unwrap<{ sent: boolean; expiresInSeconds: number }>,
    }),
    verifyOtp: b.mutation<OtpVerifyResult, { phone: string; code: string; schoolId?: string }>({
      query: (body) => ({ url: '/auth/parent/otp/verify', method: 'POST', body }),
      transformResponse: unwrap<OtpVerifyResult>,
    }),
    logout: b.mutation<unknown, void>({ query: () => ({ url: '/auth/logout', method: 'POST' }) }),

    // ---------- P2: children ----------
    children: b.query<Child[], void>({
      query: () => '/parent/children',
      transformResponse: unwrap<Child[]>,
      providesTags: ['Children'],
    }),

    // ---------- P4, P5, P6 ----------
    attendance: b.query<AttendanceMonth, { childId: string; month: string }>({
      query: ({ childId, month }) => ({ url: `/parent/children/${childId}/attendance`, params: { month } }),
      transformResponse: unwrap<AttendanceMonth>,
      providesTags: ['Attendance'],
    }),
    homework: b.query<HomeworkItem[], string>({
      query: (childId) => `/parent/children/${childId}/homework`,
      transformResponse: unwrap<HomeworkItem[]>,
      providesTags: ['Homework'],
    }),
    announcements: b.query<AnnouncementItem[], void>({
      query: () => '/parent/announcements',
      transformResponse: unwrap<AnnouncementItem[]>,
      providesTags: ['Announcements'],
    }),

    // ---------- P7, P8: fees ----------
    fees: b.query<Fees, string>({
      query: (childId) => `/parent/children/${childId}/fees`,
      transformResponse: unwrap<Fees>,
      providesTags: ['Fees'],
    }),
    createOrder: b.mutation<PaymentOrder, { childId: string; dueIds: string[] }>({
      query: ({ childId, dueIds }) => ({ url: `/parent/children/${childId}/fees/orders`, method: 'POST', body: { dueIds } }),
      transformResponse: unwrap<PaymentOrder>,
    }),
    paymentStatus: b.query<{ id: string; status: string; receiptNo: string | null; amount: number }, string>({
      query: (id) => `/parent/payments/${id}`,
      transformResponse: unwrap<{ id: string; status: string; receiptNo: string | null; amount: number }>,
    }),
    receiptUrl: b.mutation<{ url: string }, string>({
      query: (id) => ({ url: `/parent/payments/${id}/receipt` }),
      transformResponse: unwrap<{ url: string }>,
    }),
    mockComplete: b.mutation<unknown, string>({
      query: (id) => ({ url: `/parent/payments/${id}/mock-complete`, method: 'POST' }),
    }),

    // ---------- notifications ----------
    notifications: b.query<{ unreadCount: number; items: NotificationItem[] }, void>({
      query: () => '/me/notifications',
      transformResponse: unwrap<{ unreadCount: number; items: NotificationItem[] }>,
      providesTags: ['Notifications'],
    }),
    markAllRead: b.mutation<unknown, void>({
      query: () => ({ url: '/me/notifications/read-all', method: 'POST' }),
      invalidatesTags: ['Notifications'],
    }),
  }),
});

export const {
  useRequestOtpMutation,
  useVerifyOtpMutation,
  useLogoutMutation,
  useChildrenQuery,
  useAttendanceQuery,
  useHomeworkQuery,
  useAnnouncementsQuery,
  useFeesQuery,
  useCreateOrderMutation,
  useLazyPaymentStatusQuery,
  useReceiptUrlMutation,
  useMockCompleteMutation,
  useNotificationsQuery,
  useMarkAllReadMutation,
} = parentApi;
