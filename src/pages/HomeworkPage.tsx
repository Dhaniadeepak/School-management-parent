import { useMemo, useState } from 'react';
import { useHomeworkQuery } from '../api/parentApi';
import { Alert, Badge, Card, Empty, Spinner } from '../components/ui';
import { useChild } from '../lib/useChild';
import { errorMessage, formatDate, todayISO } from '../lib/utils';

/** P5: homework for the selected child's class, newest first, with attachments. */
export default function HomeworkPage() {
  const { child } = useChild();
  const { data = [], isLoading, error } = useHomeworkQuery(child?.id ?? '', { skip: !child });
  const [subject, setSubject] = useState('');
  const subjects = useMemo(() => [...new Set(data.map((h) => h.subject))].sort(), [data]);
  const items = subject ? data.filter((h) => h.subject === subject) : data;
  const today = todayISO();

  if (isLoading) return <Spinner />;
  if (error) return <Alert>{errorMessage(error)}</Alert>;

  return (
    <>
      {subjects.length > 1 && (
        <select value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      )}
      {!items.length ? (
        <Empty>No homework yet.</Empty>
      ) : (
        items.map((h) => (
          <Card
            key={h.id}
            title={h.subject}
            actions={
              h.dueDate < today ? (
                <Badge>was due {formatDate(h.dueDate)}</Badge>
              ) : (
                <Badge tone={h.dueDate === today ? 'red' : 'amber'}>due {h.dueDate === today ? 'today' : formatDate(h.dueDate)}</Badge>
              )
            }
          >
            <strong>{h.title}</strong>
            {h.description && <p style={{ whiteSpace: 'pre-wrap', margin: '0.35rem 0' }}>{h.description}</p>}
            {h.attachments.map((a) => (
              <div key={a.url}>
                📎{' '}
                <a href={a.url} target="_blank" rel="noreferrer" download={a.name}>
                  {a.name}
                </a>
              </div>
            ))}
            <div className="muted small" style={{ marginTop: '0.35rem' }}>
              Posted {formatDate(h.postedAt)}
              {h.updatedAt !== h.postedAt ? ' · updated' : ''}
            </div>
          </Card>
        ))
      )}
    </>
  );
}
