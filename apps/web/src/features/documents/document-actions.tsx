import { FormEvent, useState } from 'react';
import type { DocumentSummary } from '@dealroom/shared';
import {
  useArchiveDocumentMutation,
  useRenameDocumentMutation,
} from '../../apis';
import { Button } from '../../components/ui/button';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { Dialog } from '../../components/ui/dialog';
import { Field } from '../../components/ui/field';
import { Menu, MenuItem } from '../../components/ui/menu';
import { Spinner } from '../../components/ui/spinner';

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

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await rename({ id: document.id, name: name.trim() }).unwrap();
    setRenaming(false);
  };

  return (
    <>
      <Menu label={`Actions for ${document.name}`}>
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
          await archive(document.id).unwrap();
          onRemoved?.();
        }}
      />
    </>
  );
};
