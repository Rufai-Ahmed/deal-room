import { FormEvent, useState } from 'react';
import type { ShareLinkSummary } from '@dealroom/shared';
import { useUpdateShareLinkMutation } from '../../apis';
import { Button } from '../../components/ui/button';
import { Dialog } from '../../components/ui/dialog';
import { Field } from '../../components/ui/field';
import { Spinner } from '../../components/ui/spinner';

interface EditShareDialogProps {
  link: ShareLinkSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Toggle = ({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) => (
  <label className="flex cursor-pointer items-start gap-3">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="mt-0.5 size-4 accent-[var(--color-brand)]"
    />
    <span>
      <span className="block text-[0.8125rem] font-medium text-ink">
        {label}
      </span>
      <span className="block text-[0.8125rem] text-ink-faint">{hint}</span>
    </span>
  </label>
);

export const EditShareDialog = ({
  link,
  open,
  onOpenChange,
}: EditShareDialogProps) => {
  const [recipientName, setRecipientName] = useState(link.recipientName ?? '');
  const [recipientEmail, setRecipientEmail] = useState(
    link.recipientEmail ?? '',
  );
  const [requireEmail, setRequireEmail] = useState(link.requireEmail);
  const [allowDownload, setAllowDownload] = useState(link.allowDownload);
  const [expiresAt, setExpiresAt] = useState(
    link.expiresAt ? link.expiresAt.slice(0, 10) : '',
  );

  const [update, { isLoading }] = useUpdateShareLinkMutation();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await update({
      id: link.id,
      recipientName: recipientName.trim() || undefined,
      recipientEmail: recipientEmail.trim() || undefined,
      requireEmail,
      allowDownload,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    }).unwrap();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit share link"
      description="Changes apply immediately. The link address stays the same."
    >
      <form onSubmit={submit} className="space-y-5">
        <Field
          label="Investor or firm"
          value={recipientName}
          onChange={(event) => setRecipientName(event.target.value)}
        />
        <Field
          label="Their email"
          type="email"
          value={recipientEmail}
          onChange={(event) => setRecipientEmail(event.target.value)}
        />
        <Field
          label="Expires"
          type="date"
          value={expiresAt}
          onChange={(event) => setExpiresAt(event.target.value)}
          hint="Leave empty for no expiry."
        />

        <div className="space-y-3 border-t border-rule pt-4">
          <Toggle
            label="Ask for an email before showing the document"
            hint="You learn who read it, not just that someone did."
            checked={requireEmail}
            onChange={setRequireEmail}
          />
          <Toggle
            label="Allow downloading"
            hint="Off means view in the browser only."
            checked={allowDownload}
            onChange={setAllowDownload}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Spinner /> : 'Save changes'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
