import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useRequestOtpMutation, useVerifyOtpMutation } from '../api/parentApi';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { Alert, Button, Card, Field } from '../components/ui';
import { sessionStarted } from '../features/auth/authSlice';
import { errorMessage } from '../lib/utils';

/** P1: phone number on the school's records + a 6-digit SMS code. No password. */
export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const signedIn = useAppSelector((s) => !!s.auth.accessToken);
  const [step, setStep] = useState<'phone' | 'code' | 'school'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [resendIn, setResendIn] = useState(0);

  const [requestOtp, requestState] = useRequestOtpMutation();
  const [verifyOtp, verifyState] = useVerifyOtpMutation();

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  if (signedIn) return <Navigate to="/" replace />;

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const ok = await requestOtp({ phone }).unwrap().catch(() => null);
    if (ok) {
      setStep('code');
      setCode('');
      setResendIn(30);
    }
  };

  const verify = async (e: FormEvent | null, schoolId?: string) => {
    e?.preventDefault();
    const res = await verifyOtp({ phone, code, schoolId }).unwrap().catch(() => null);
    if (!res) return;
    if ('needsSchool' in res) {
      setSchools(res.schools);
      setStep('school');
      return;
    }
    dispatch(sessionStarted(res));
    navigate('/');
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <h1>Parent app</h1>
        <p className="muted">Attendance alerts, homework, notices and fee payment for your child.</p>

        {step === 'phone' && (
          <form className="stack" onSubmit={send}>
            <Field label="Mobile number" hint="The number you gave the school">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="98xxxxxxxx" required />
            </Field>
            <Alert>{errorMessage(requestState.error)}</Alert>
            <Button className="block" loading={requestState.isLoading}>
              Send code
            </Button>
          </form>
        )}

        {step === 'code' && (
          <form className="stack" onSubmit={(e) => verify(e)}>
            <Alert kind="info">We sent a 6-digit code to {phone}. It is valid for 5 minutes.</Alert>
            <Field label="Code">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                required
                pattern="\d{6}"
              />
            </Field>
            <Alert>{errorMessage(verifyState.error || requestState.error)}</Alert>
            <Button className="block" loading={verifyState.isLoading} disabled={code.length !== 6}>
              Verify and continue
            </Button>
            <div className="row between">
              <Button type="button" variant="ghost" onClick={() => setStep('phone')}>
                Change number
              </Button>
              <Button type="button" variant="ghost" disabled={resendIn > 0 || requestState.isLoading} onClick={() => send()}>
                {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
              </Button>
            </div>
          </form>
        )}

        {step === 'school' && (
          <div className="stack">
            <p>Your number is registered with more than one school. Which one do you want to open?</p>
            {schools.map((s) => (
              <Button key={s.id} variant="secondary" className="block" onClick={() => verify(null, s.id)} loading={verifyState.isLoading}>
                {s.name}
              </Button>
            ))}
            <Alert>{errorMessage(verifyState.error)}</Alert>
          </div>
        )}
      </Card>
    </div>
  );
}
