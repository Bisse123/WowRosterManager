import { useState, useRef, useEffect } from 'react';
import { WOW_CLASSES } from '../utils/wowClasses';

function AddPlayerModal({ onClose, onAdd, initialData = null, onSave, existingNames = [] }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    class: initialData?.class || '',
    mainSpecRole: initialData?.mainSpecRole || '',
    alt1Class: initialData?.alt1Class || '',
    alt1SpecRole: initialData?.alt1SpecRole || '',
    alt2Class: initialData?.alt2Class || '',
    alt2SpecRole: initialData?.alt2SpecRole || '',
    status: initialData?.status || 'Main',
    notes: initialData?.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.class && formData.mainSpecRole) {
      const nameLower = formData.name.trim().toLowerCase();
      const existingLower = (existingNames || []).map(n => String(n).toLowerCase());
      const origLower = initialData?.name ? String(initialData.name).toLowerCase() : null;
      const isDuplicate = existingLower.some(n => n === nameLower && n !== origLower);
      if (isDuplicate) {
        alert(`Player name "${formData.name}" already exists.`);
        return;
      }

      if (initialData && typeof onSave === 'function') {
        onSave(formData);
      } else if (typeof onAdd === 'function') {
        onAdd(formData);
      }
    }
  };

  const roles = ['Tank', 'Healer', 'Melee DPS', 'Ranged DPS'];

  const overlayRef = useRef(null);
  const mouseDownOnOverlay = useRef(false);
  const nameInputRef = useRef(null);

  useEffect(() => {
    // focus the name input when the modal mounts
    try {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
        // select existing text if editing
        nameInputRef.current.select && nameInputRef.current.select();
      }
    } catch (err) {
      // ignore focus errors in some environments
    }
  }, []);

  const normalizeInitial = () => ({
    name: initialData?.name || '',
    class: initialData?.class || '',
    mainSpecRole: initialData?.mainSpecRole || '',
    alt1Class: initialData?.alt1Class || '',
    alt1SpecRole: initialData?.alt1SpecRole || '',
    alt2Class: initialData?.alt2Class || '',
    alt2SpecRole: initialData?.alt2SpecRole || '',
    status: initialData?.status || 'Main',
    notes: initialData?.notes || ''
  });

  const isDirty = () => {
    const init = normalizeInitial();
    return JSON.stringify(init) !== JSON.stringify(formData);
  };

  const handleAttemptClose = () => {
    if (!isDirty()) {
      onClose();
      return;
    }
    // Single Yes/No prompt: OK = Save, Cancel = Discard
    const save = window.confirm('You have unsaved changes. Save changes? Click OK to save, Cancel to discard.');
    if (save) {
      const nameLower = formData.name.trim().toLowerCase();
      const existingLower = (existingNames || []).map(n => String(n).toLowerCase());
      const origLower = initialData?.name ? String(initialData.name).toLowerCase() : null;
      const isDuplicate = existingLower.some(n => n === nameLower && n !== origLower);
      if (isDuplicate) {
        alert(`Player name "${formData.name}" already exists.`);
        return; // keep modal open
      }

      if (initialData && typeof onSave === 'function') {
        onSave(formData);
      } else if (typeof onAdd === 'function') {
        onAdd(formData);
      }
    }
    // Either saved (OK) or discarded (Cancel) — close modal
    onClose();
  };

  const handleOverlayMouseDown = (e) => {
    // mark whether the pointerdown started on the overlay itself
    mouseDownOnOverlay.current = (e.target === overlayRef.current);
  };

  const handleOverlayClick = (e) => {
    // only treat as a request to close if the mousedown started on the overlay
    if (!mouseDownOnOverlay.current) return;
    handleAttemptClose();
  };

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayClick}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{initialData ? 'Edit Player' : 'Add New Player'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Player Name *</label>
            <input
              type="text"
              ref={nameInputRef}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Character name"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Class *</label>
              <select
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                required
              >
                <option value="">Select class</option>
                {WOW_CLASSES.map(cls => (
                  <option key={cls.name} value={cls.name}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Main Spec Role *</label>
              <select
                value={formData.mainSpecRole}
                onChange={(e) => setFormData({ ...formData, mainSpecRole: e.target.value })}
                required
              >
                <option value="">Select role</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Alt 1 Class</label>
              <select
                value={formData.alt1Class}
                onChange={(e) => setFormData({ ...formData, alt1Class: e.target.value })}
              >
                <option value="">None</option>
                {WOW_CLASSES.map(cls => (
                  <option key={cls.name} value={cls.name}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Alt 1 Role</label>
              <select
                value={formData.alt1SpecRole}
                onChange={(e) => setFormData({ ...formData, alt1SpecRole: e.target.value })}
              >
                <option value="">Select role</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Alt 2 Class</label>
              <select
                value={formData.alt2Class}
                onChange={(e) => setFormData({ ...formData, alt2Class: e.target.value })}
              >
                <option value="">None</option>
                {WOW_CLASSES.map(cls => (
                  <option key={cls.name} value={cls.name}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Alt 2 Role</label>
              <select
                value={formData.alt2SpecRole}
                onChange={(e) => setFormData({ ...formData, alt2SpecRole: e.target.value })}
              >
                <option value="">Select role</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Main">Main Roster</option>
              <option value="Trial">Trial</option>
              <option value="Bench">Bench/Backup</option>
            </select>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {initialData ? 'Save Changes' : 'Add Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddPlayerModal;