import { useState } from 'react';
import { useAttendanceQuery } from '../api/parentApi';
import { Alert, Button, Card, Spinner, Stat } from '../components/ui';
import { useChild } from '../lib/useChild';
import { errorMessage, todayISO } from '../lib/utils';

function shiftMonth(month: string, by: number) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + by, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** P4: monthly calendar of present and absent days with the attendance percentage. */
export default function AttendancePage() {
  const { child } = useChild();
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const { data, isLoading, error, isFetching } = useAttendanceQuery({ childId: child?.id ?? '', month }, { skip: !child });

  const firstDow = (() => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1, 1).getDay();
    return d === 0 ? 6 : d - 1; // Monday first
  })();
  const label = new Date(`${month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <>
      <div className="row between">
        <Button variant="secondary" onClick={() => setMonth(shiftMonth(month, -1))}>
          ‹
        </Button>
        <strong>{label}</strong>
        <Button variant="secondary" onClick={() => setMonth(shiftMonth(month, 1))} disabled={month >= todayISO().slice(0, 7)}>
          ›
        </Button>
      </div>
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <Alert>{errorMessage(error)}</Alert>
      ) : data ? (
        <>
          <div className="grid grid-4">
            <Stat label="Attendance" value={data.summary.percentage != null ? `${data.summary.percentage}%` : '—'} />
            <Stat label="Present days" value={data.summary.present} tone="green" />
            <Stat label="Absent days" value={data.summary.absent} tone={data.summary.absent ? 'red' : undefined} />
          </div>
          <Card>
            <div className="calendar" style={{ opacity: isFetching ? 0.6 : 1 }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="dow">
                  {d}
                </div>
              ))}
              {Array.from({ length: firstDow }, (_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {data.days.map((d) => (
                <div key={d.date} className={`cal-day ${d.status}`} title={d.label ?? d.status.replace('_', ' ')}>
                  {Number(d.date.slice(8))}
                </div>
              ))}
            </div>
            <div className="row small muted" style={{ marginTop: '0.75rem' }}>
              <span className="cal-day present" style={{ width: 18, aspectRatio: '1' }} /> Present
              <span className="cal-day absent" style={{ width: 18, aspectRatio: '1' }} /> Absent
              <span className="cal-day holiday" style={{ width: 18, aspectRatio: '1' }} /> Holiday
            </div>
            {data.days.filter((d) => d.status === 'holiday').map((d) => (
              <div key={d.date} className="small muted">
                {Number(d.date.slice(8))}: {d.label}
              </div>
            ))}
          </Card>
        </>
      ) : null}
    </>
  );
}
