import { Link } from 'react-router-dom';
import { useAttendanceQuery, useFeesQuery, useHomeworkQuery, useMarkAllReadMutation, useNotificationsQuery } from '../api/parentApi';
import { Alert, Badge, Button, Card, Empty, Spinner, Stat } from '../components/ui';
import { useChild } from '../lib/useChild';
import { formatDate, formatDateTime, rupees, todayISO } from '../lib/utils';

export default function HomePage() {
  const { child } = useChild();
  const id = child?.id ?? '';
  const today = todayISO();
  const { data: att } = useAttendanceQuery({ childId: id, month: today.slice(0, 7) }, { skip: !id });
  const { data: hw = [] } = useHomeworkQuery(id, { skip: !id });
  const { data: fees } = useFeesQuery(id, { skip: !id });
  const { data: notes, isLoading } = useNotificationsQuery();
  const [markAll] = useMarkAllReadMutation();

  if (!child) return null;
  const todayStatus = att?.days.find((d) => d.date === today)?.status;
  const pending = fees?.dues.filter((d) => d.status === 'pending') ?? [];
  const pendingTotal = pending.reduce((s, d) => s + d.amount, 0);
  const dueSoon = hw.filter((h) => h.dueDate >= today).slice(0, 3);

  return (
    <>
      <Card>
        <div className="row between">
          <div>
            <h2>{child.name}</h2>
            <span className="muted small">
              Class {child.className}
              {child.rollNo ? ` · Roll ${child.rollNo}` : ''} · Adm. {child.admissionNo}
            </span>
          </div>
          {todayStatus === 'absent' && <Badge tone="red">Absent today</Badge>}
          {todayStatus === 'present' && <Badge tone="green">Present today</Badge>}
          {todayStatus === 'holiday' && <Badge tone="amber">Holiday</Badge>}
        </div>
      </Card>

      <div className="grid grid-4">
        <Stat label="Attendance this month" value={att?.summary.percentage != null ? `${att.summary.percentage}%` : '—'} hint={att ? `${att.summary.absent} absent` : undefined} />
        <Stat label="Fees pending" value={rupees(pendingTotal)} tone={pending.some((d) => d.overdue) ? 'red' : pendingTotal ? 'amber' : 'green'} hint={<Link to="/fees">{pendingTotal ? 'Pay now' : 'View receipts'}</Link>} />
      </div>

      <Card title="Homework due" actions={<Link to="/homework">All homework</Link>}>
        {!dueSoon.length ? (
          <Empty>Nothing due.</Empty>
        ) : (
          <ul className="list">
            {dueSoon.map((h) => (
              <li key={h.id} className="row between">
                <span>
                  <strong>{h.subject}</strong> · {h.title}
                </span>
                <span className="muted small">Due {formatDate(h.dueDate)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="Alerts"
        actions={
          notes?.unreadCount ? (
            <Button variant="ghost" onClick={() => markAll()}>
              Mark all read
            </Button>
          ) : null
        }
      >
        {isLoading ? (
          <Spinner />
        ) : !notes?.items.length ? (
          <Empty>No alerts yet. You will be told here when your child is marked absent, homework is posted or a notice is published.</Empty>
        ) : (
          <ul className="list">
            {notes.items.slice(0, 15).map((n) => (
              <li key={n.id} style={{ fontWeight: n.read ? 400 : 600 }}>
                <div className="row between">
                  <span>
                    {n.type === 'absence' ? '🔴 ' : ''}
                    {n.title}
                  </span>
                  <span className="muted small">{formatDateTime(n.createdAt)}</span>
                </div>
                <div className="muted small">{n.body}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {pending.some((d) => d.overdue) && <Alert kind="warning">A fee payment is overdue. You can pay it by UPI from the Fees tab.</Alert>}
    </>
  );
}
