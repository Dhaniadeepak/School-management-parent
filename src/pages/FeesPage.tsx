import { useMemo, useState } from 'react';
import { parentApi, useCreateOrderMutation, useFeesQuery, useLazyPaymentStatusQuery, useMockCompleteMutation, useReceiptUrlMutation } from '../api/parentApi';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { Alert, Badge, Button, Card, Empty, Spinner } from '../components/ui';
import { useChild } from '../lib/useChild';
import { errorMessage, formatDate, rupees } from '../lib/utils';
import type { PaymentOrder } from '../types';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open(): void };
  }
}

function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load the payment page. Check your internet connection.'));
    document.body.appendChild(s);
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** P7 / P8: what is due, pay by UPI (gateway checkout), receipts. */
export default function FeesPage() {
  const { child } = useChild();
  const dispatch = useAppDispatch();
  const phone = useAppSelector((s) => s.auth.user?.phone);
  const { data, isLoading, error } = useFeesQuery(child?.id ?? '', { skip: !child });
  const [createOrder, orderState] = useCreateOrderMutation();
  const [mockComplete] = useMockCompleteMutation();
  const [getStatus] = useLazyPaymentStatusQuery();
  const [receiptUrl, receiptState] = useReceiptUrlMutation();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<'idle' | 'paying' | 'confirming'>('idle');
  const [message, setMessage] = useState<{ kind: 'success' | 'error' | 'info'; text: string } | null>(null);

  const pending = useMemo(() => data?.dues.filter((d) => d.status === 'pending') ?? [], [data]);
  const paid = data?.dues.filter((d) => d.status === 'paid') ?? [];
  const total = pending.filter((d) => selected.has(d.id)).reduce((s, d) => s + d.amount, 0);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /** The payment is confirmed by the gateway's webhook on the server, so we wait for it here. */
  const waitForConfirmation = async (paymentId: string) => {
    setPhase('confirming');
    for (let i = 0; i < 30; i++) {
      const res = await getStatus(paymentId).unwrap().catch(() => null);
      if (res?.status === 'paid') {
        setMessage({ kind: 'success', text: `Payment of ${rupees(res.amount)} received. Receipt ${res.receiptNo}.` });
        setSelected(new Set());
        dispatch(parentApi.util.invalidateTags(['Fees', 'Notifications']));
        setPhase('idle');
        return;
      }
      if (res?.status === 'failed') {
        setMessage({ kind: 'error', text: 'The payment failed. No money was taken. Please try again.' });
        setPhase('idle');
        return;
      }
      await sleep(2000);
    }
    setMessage({ kind: 'info', text: 'We are still waiting for the bank to confirm. The fee will show as paid within a few minutes; you do not need to pay again.' });
    dispatch(parentApi.util.invalidateTags(['Fees']));
    setPhase('idle');
  };

  const openCheckout = async (order: PaymentOrder) => {
    await loadRazorpay();
    if (!window.Razorpay) throw new Error('Payment page unavailable');
    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amountPaise,
      currency: order.currency,
      order_id: order.orderId,
      name: order.schoolName,
      description: `School fee for ${order.studentName}`,
      prefill: phone ? { contact: phone } : undefined,
      method: { upi: true },
      handler: () => void waitForConfirmation(order.paymentId),
      modal: { ondismiss: () => setPhase('idle') },
      theme: { color: '#7c3aed' },
    });
    rzp.open();
  };

  const pay = async () => {
    if (!child || !selected.size) return;
    setMessage(null);
    setPhase('paying');
    const order = await createOrder({ childId: child.id, dueIds: [...selected] }).unwrap().catch(() => null);
    if (!order) return setPhase('idle');
    try {
      if (order.gateway === 'razorpay') {
        await openCheckout(order);
      } else {
        // Development only: no real gateway configured
        if (!confirm(`Test mode: simulate a UPI payment of ${rupees(order.amount)}?`)) return setPhase('idle');
        await mockComplete(order.paymentId).unwrap();
        await waitForConfirmation(order.paymentId);
      }
    } catch (e) {
      setMessage({ kind: 'error', text: e instanceof Error ? e.message : 'Payment could not be started' });
      setPhase('idle');
    }
  };

  const openReceipt = async (paymentId: string) => {
    const res = await receiptUrl(paymentId).unwrap().catch(() => null);
    if (res) window.open(res.url, '_blank', 'noopener');
  };

  if (isLoading) return <Spinner />;
  if (error) return <Alert>{errorMessage(error)}</Alert>;
  if (!data) return null;

  return (
    <>
      <Card title="Fees due">
        {!pending.length ? (
          <Empty>Nothing to pay. 🎉</Empty>
        ) : (
          <>
            <ul className="list">
              {pending.map((d) => {
                const blocked = d.installmentNo === 2 && pending.some((x) => x.installmentNo === 1 && x.academicYear === d.academicYear && !selected.has(x.id));
                return (
                  <li key={d.id}>
                    <label className="check" style={{ justifyContent: 'space-between', opacity: blocked ? 0.55 : 1 }}>
                      <span className="check">
                        <input type="checkbox" checked={selected.has(d.id)} disabled={blocked || phase !== 'idle'} onChange={() => toggle(d.id)} />
                        <span>
                          <strong>{d.label}</strong> <span className="muted small">({d.academicYear})</span>
                          <div className="small">
                            Due {formatDate(d.dueDate)} {d.overdue && <Badge tone="red">overdue</Badge>}
                          </div>
                        </span>
                      </span>
                      <strong>{rupees(d.amount)}</strong>
                    </label>
                  </li>
                );
              })}
            </ul>
            {pending.length > 1 && (
              <Button variant="ghost" onClick={() => setSelected(new Set(pending.map((d) => d.id)))} disabled={phase !== 'idle'}>
                Select all (pay in full)
              </Button>
            )}
            {message && <Alert kind={message.kind}>{message.text}</Alert>}
            <Alert>{errorMessage(orderState.error)}</Alert>
            {phase === 'confirming' && <Alert kind="info">Confirming your payment with the bank…</Alert>}
            {!data.paymentsEnabled ? (
              <Alert kind="info">Online payment is not available yet. Please pay at the school office.</Alert>
            ) : (
              <Button className="block" onClick={pay} disabled={!selected.size || phase !== 'idle'} loading={phase !== 'idle'}>
                {selected.size ? `Pay ${rupees(total)} by UPI` : 'Choose what to pay'}
              </Button>
            )}
          </>
        )}
        {!pending.length && message && <Alert kind={message.kind}>{message.text}</Alert>}
      </Card>

      <Card title="Payment history and receipts">
        <Alert>{errorMessage(receiptState.error)}</Alert>
        {!data.payments.length ? (
          <Empty>No payments yet.</Empty>
        ) : (
          <ul className="list">
            {data.payments.map((p) => (
              <li key={p.id} className="row between">
                <span>
                  <strong>{rupees(p.amount)}</strong> {p.status === 'refunded' && <Badge tone="amber">refunded</Badge>}
                  <div className="muted small">
                    {formatDate(p.paidAt)} · {p.receiptNo} {p.method ? `· ${p.method.toUpperCase()}` : ''}
                  </div>
                </span>
                <Button variant="secondary" onClick={() => openReceipt(p.id)} loading={receiptState.isLoading && receiptState.originalArgs === p.id}>
                  Receipt
                </Button>
              </li>
            ))}
          </ul>
        )}
        {paid.length > 0 && (
          <p className="muted small">
            Paid: {paid.map((d) => `${d.label} (${d.academicYear})`).join(', ')}
          </p>
        )}
      </Card>
    </>
  );
}
