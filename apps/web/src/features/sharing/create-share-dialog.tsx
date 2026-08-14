import { FormEvent, useState } from 'react';
import { useCreateShareLinkMutation } from '../../apis';
import { Button } from '../../components/ui/button';
import { CopyField } from '../../components/ui/copy-field';
import { Dialog } from '../../components/ui/dialog';
import { Field } from '../../components/ui/field';
import { Spinner } from '../../components/ui/spinner';

interface CreateShareDialogProps {
  documentId: string;
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

export const CreateShareDialog = ({
  documentId,
  open,
  onOpenChange,
}: CreateShareDialogProps) => {
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [requireEmail, setRequireEmail] = useState(true);
  const [allowDownload, setAllowDownload] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  const [createShareLink, { isLoading }] = useCreateShareLinkMutation();

  const close = () => {
    setRecipientName('');
    setRecipientEmail('');
    setRequireEmail(true);
    setAllowDownload(false);
    setExpiresAt('');
    setCreatedUrl(null);
    onOpenChange(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const link = await createShareLink({
      documentId,
      recipientName: recipientName.trim() || undefined,
      recipientEmail: recipientEmail.trim() || undefined,
      requireEmail,
      allowDownload,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    }).unwrap();

    setCreatedUrl(link.url);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title={createdUrl ? 'Link ready' : 'Create a share link'}
      description={
        createdUrl
          ? 'Send this to the investor. Every open against this link is attributed to them.'
          : 'One link per investor keeps engagement attributable.'
      }
    >
      {createdUrl ? (
        <div className="space-y-5">
          <CopyField value={createdUrl} />
          <div className="flex justify-end">
            <Button onClick={close}>Done</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <Field
            label="Investor or firm"
            placeholder="Acme Ventures"
            value={recipientName}
            onChange={(event) => setRecipientName(event.target.value)}
            hint="Shown alongside their engagement. Not visible to them."
          />
          <Field
            label="Their email"
            type="email"
            placeholder="partner@acme.vc"
            value={recipientEmail}
            onChange={(event) => setRecipientEmail(event.target.value)}
            hint="Optional. Used to notify them when you reply to a comment."
          />
          <Field
            label="Expires"
            type="date"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
            hint="Optional. The link stops working after this date."
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
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Spinner /> : 'Create link'}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
};
