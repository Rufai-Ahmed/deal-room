import { FormEvent, useState } from 'react';
import type { DocumentSummary } from '@dealroom/shared';
import {
  useArchiveDocumentMutation,
  useDocumentDownloadUrlMutation,
  useRenameDocumentMutation,
} from '../../apis';
import { Button } from '../../components/ui/button';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { Dialog } from '../../components/ui/dialog';
import { Field } from '../../components/ui/field';
import { Menu, MenuItem } from '../../components/ui/menu';
import { Spinner } from '../../components/ui/spinner';
import { errorMessage, useToast } from '../../components/ui/toast';

interface DocumentActionsProps {
  document: DocumentSummary;
  onRemoved?: () => void;
}

export const DocumentActions = ({
  document,
  onRemoved,
}: DocumentActionsProps) => {
  const [renaming, setRenaming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [name, setName] = useState(document.name);

  const [rename, { isLoading: saving }] = useRenameDocumentMutation();
  const [archive] = useArchiveDocumentMutation();
  const [downloadUrl] = useDocumentDownloadUrlMutation();
  const toast = useToast();

  const openFile = async () => {
    try {
      const { url } = await downloadUrl(document.id).unwrap();
      window.open(url, '_blank', 'noopener');
    } catch (error) {
      toast.error(errorMessage(error, 'That file could not be opened.'));
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await rename({ id: document.id, name: name.trim() }).unwrap();
      setRenaming(false);
      toast.success('Document renamed.');
    } catch (error) {
      toast.error(errorMessage(error, 'The document could not be renamed.'));
    }
  };

  return (
    <>
      <Menu label={`Actions for ${document.name}`}>
        <MenuItem onSelect={() => void openFile()}>Open file</MenuItem>
        <MenuItem
          onSelect={() => {
            setName(document.name);
            setRenaming(true);
          }}
        >
          Rename
        </MenuItem>
        <MenuItem tone="danger" onSelect={() => setRemoving(true)}>
          Remove
        </MenuItem>
      </Menu>

      <Dialog
        open={renaming}
        onOpenChange={setRenaming}
        title="Rename document"
        description="Investors see this name on the share page."
      >
        <form onSubmit={submit} className="space-y-5">
          <Field
            label="Document name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRenaming(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? <Spinner /> : 'Save'}
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={removing}
        onOpenChange={setRemoving}
        title={`Remove ${document.name}?`}
        description="Every share link for this document stops working immediately. The engagement history is kept, and nothing is permanently deleted."
        confirmLabel="Remove document"
        onConfirm={async () => {
          try {
            await archive(document.id).unwrap();
            toast.success(`${document.name} removed.`);
            onRemoved?.();
          } catch (error) {
            toast.error(errorMessage(error, 'The document could not be removed.'));
          }
        }}
      />
    </>
  );
};
