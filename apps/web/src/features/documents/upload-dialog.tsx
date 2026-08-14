import { FormEvent, useState } from 'react';
import {
  ACCEPTED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
} from '@dealroom/shared';
import {
  useCreateDocumentMutation,
  useRequestUploadMutation,
} from '../../apis';
import { Button } from '../../components/ui/button';
import { Dialog } from '../../components/ui/dialog';
import { Field } from '../../components/ui/field';
import { Spinner } from '../../components/ui/spinner';
import { formatBytes } from '../../lib/format';
import { readPageCount } from '../../lib/pdf';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UploadDialog = ({ open, onOpenChange }: UploadDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [requestUpload] = useRequestUploadMutation();
  const [createDocument] = useCreateDocumentMutation();

  const reset = () => {
    setFile(null);
    setName('');
    setError(null);
    setBusy(false);
  };

  const pickFile = (selected: File | null) => {
    setError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (!ACCEPTED_MIME_TYPES.includes(selected.type as never)) {
      setError('That file type is not supported.');
      return;
    }
    if (selected.size > MAX_UPLOAD_BYTES) {
      setError(`Files must be under ${formatBytes(MAX_UPLOAD_BYTES)}.`);
      return;
    }
    setFile(selected);
    setName((current) => current || selected.name.replace(/\.[^.]+$/, ''));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const pageCount = await readPageCount(file);

      const ticket = await requestUpload({
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      }).unwrap();

      const response = await fetch(ticket.uploadUrl, {
        method: ticket.method,
        headers: ticket.headers,
        body: file,
      });

      if (!response.ok) {
        throw new Error('The file could not be uploaded.');
      }

      await createDocument({
        name: name.trim() || file.name,
        fileKey: ticket.fileKey,
        mimeType: file.type,
        sizeBytes: file.size,
        pageCount,
      }).unwrap();

      reset();
      onOpenChange(false);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'The upload failed. Please try again.',
      );
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
        }
        onOpenChange(next);
      }}
      title="Add a document"
      description="Upload the file, then give it the name investors will see."
    >
      <form onSubmit={submit} className="space-y-5">
        <label
          className="flex cursor-pointer flex-col items-center justify-center gap-1
                     rounded-xl border border-dashed border-rule-strong
                     bg-paper-sunk px-4 py-8 text-center transition-colors
                     hover:border-ink-faint"
        >
          <input
            type="file"
            className="sr-only"
            accept={ACCEPTED_MIME_TYPES.join(',')}
            onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
          />
          {file ? (
            <>
              <span className="text-sm font-medium text-ink">{file.name}</span>
              <span className="numeric text-[0.8125rem] text-ink-faint">
                {formatBytes(file.size)}
              </span>
            </>
          ) : (
            <>
              <span className="text-sm font-medium text-ink">
                Choose a file
              </span>
              <span className="text-[0.8125rem] text-ink-faint">
                PDF, slides, sheets or images up to{' '}
                {formatBytes(MAX_UPLOAD_BYTES)}
              </span>
            </>
          )}
        </label>

        <Field
          label="Document name"
          required
          value={name}
          placeholder="Series A deck"
          onChange={(event) => setName(event.target.value)}
          error={error}
        />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!file || busy}>
            {busy ? <Spinner /> : 'Add document'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
