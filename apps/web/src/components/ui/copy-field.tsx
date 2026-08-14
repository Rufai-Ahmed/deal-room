import { useEffect, useState } from 'react';
import { Button } from './button';

export const CopyField = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
  };

  return (
    <div className="flex items-stretch gap-2">
      <code
        className="numeric flex-1 truncate rounded-lg border border-rule
                   bg-paper-sunk px-3 py-2 text-[0.8125rem] text-ink-soft"
        title={value}
      >
        {value}
      </code>
      <Button variant="secondary" size="md" onClick={copy} type="button">
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
};
