import { ReactNode } from 'react';
import { SimpleModal } from './SimpleModal';

export function InlineForm({
  open,
  title,
  onClose,
  onSubmit,
  children,
  submitLabel = 'Kaydet',
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
  submitLabel?: string;
}) {
  return (
    <SimpleModal open={open} title={title} onClose={onClose}>
      <div className="form-grid">{children}</div>
      <div className="modal-actions">
        <button type="button" className="btn-sm" onClick={onSubmit}>
          {submitLabel}
        </button>
        <button type="button" className="btn-sm" onClick={onClose}>
          İptal
        </button>
      </div>
    </SimpleModal>
  );
}
