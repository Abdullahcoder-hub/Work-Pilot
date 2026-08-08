type PasswordCheck = {
  label: string;
  valid: boolean;
};

function getPasswordChecks(password: string): PasswordCheck[] {
  return [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'Contains an uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'Contains a lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'Contains a number', valid: /\d/.test(password) },
    { label: 'Contains a special character', valid: /[^A-Za-z0-9]/.test(password) },
  ];
}

export function PasswordStrengthHint({ password }: { password: string }) {
  const checks = getPasswordChecks(password);
  const passedCount = checks.filter((check) => check.valid).length;
  const strengthPercent = (passedCount / checks.length) * 100;

  let barClass = 'bg-slate-300';
  if (passedCount >= 4) {
    barClass = 'bg-emerald-500';
  } else if (passedCount >= 3) {
    barClass = 'bg-amber-500';
  } else if (passedCount >= 2) {
    barClass = 'bg-orange-500';
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full transition-all ${barClass}`} style={{ width: `${strengthPercent}%` }} />
      </div>
      <ul className="space-y-1 text-xs">
        {checks.map((check) => (
          <li key={check.label} className={check.valid ? 'text-emerald-600' : 'text-slate-500'}>
            <span className="mr-2">{check.valid ? '✓' : '•'}</span>
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
