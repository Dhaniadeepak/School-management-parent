import { useAnnouncementsQuery } from '../api/parentApi';
import { Alert, Badge, Card, Empty, Spinner } from '../components/ui';
import { errorMessage, formatDate, todayISO } from '../lib/utils';

/** P6: notices and events (annual function, sports day, holidays…). */
export default function NoticesPage() {
  const { data = [], isLoading, error } = useAnnouncementsQuery();
  if (isLoading) return <Spinner />;
  if (error) return <Alert>{errorMessage(error)}</Alert>;

  const today = todayISO();
  const upcoming = data.filter((a) => a.event && a.event.date >= today).sort((a, b) => a.event!.date.localeCompare(b.event!.date));

  return (
    <>
      {upcoming.length > 0 && (
        <Card title="Upcoming events">
          <ul className="list">
            {upcoming.map((e) => (
              <li key={e.id}>
                <div className="row between">
                  <strong>{e.title}</strong>
                  <Badge tone="blue">{formatDate(e.event!.date)}</Badge>
                </div>
                <div className="muted small">
                  {e.event!.time ?? ''} {e.event!.place ? `· ${e.event!.place}` : ''}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card title="Notices">
        {!data.length ? (
          <Empty>No notices yet.</Empty>
        ) : (
          <ul className="list">
            {data.map((a) => (
              <li key={a.id} className="stack" style={{ gap: '0.2rem' }}>
                <div className="row between">
                  <strong>{a.title}</strong>
                  <span className="muted small">{formatDate(a.publishAt)}</span>
                </div>
                {a.event && (
                  <span className="small">
                    📅 {formatDate(a.event.date)} {a.event.time ?? ''} {a.event.place ? `· ${a.event.place}` : ''}
                  </span>
                )}
                {a.body && <span style={{ whiteSpace: 'pre-wrap' }}>{a.body}</span>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
