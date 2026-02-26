import { useState, useRef, useEffect } from "react";
import { WOW_CLASSES, WOW_ROLES } from "../../utils/wowClasses";
import { ALT_SLOT_COUNT } from "../../App";

export function getInitialPlayerData(data = {}, altSlotCount = ALT_SLOT_COUNT) {
  const base = {
    mainName: data.mainName || data.name || "",
    mainClass: data.mainClass || data.class || "",
    mainRole: data.mainRole || "",
    status: data.status || "Trial",
    notes: data.notes || "",
  };
  for (let i = 1; i <= altSlotCount; i++) {
    base[`alt${i}Name`] = data[`alt${i}Name`] || "";
    base[`alt${i}Class`] = data[`alt${i}Class`] || "";
    base[`alt${i}Role`] = data[`alt${i}Role`] || "";
  }
  return base;
}

function AddPlayerModal({
  show,
  onClose,
  onAdd,
  initialData = null,
  onSave,
  existingNames = [],
  altSlotCount = ALT_SLOT_COUNT,
}) {
  const [formData, setFormData] = useState(
    getInitialPlayerData(initialData || {}, altSlotCount),
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.mainName && formData.mainClass && formData.mainRole) {
      const nameLower = formData.mainName.trim().toLowerCase();
      const existingLower = (existingNames || []).map((n) =>
        String(n).toLowerCase(),
      );
      const origLower = initialData?.mainName
        ? String(initialData.mainName).toLowerCase()
        : null;
      const isDuplicate = existingLower.some(
        (n) => n === nameLower && n !== origLower,
      );
      if (isDuplicate) {
        alert(`Player name "${formData.mainName}" already exists.`);
        return;
      }

      if (initialData && typeof onSave === "function") {
        onSave(formData);
      } else if (typeof onAdd === "function") {
        onAdd(formData);
      }
    }
  };

  const overlayRef = useRef(null);
  const mouseDownOnOverlay = useRef(false);
  const nameInputRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    if (!show) return;
    setTimeout(() => nameInputRef.current && nameInputRef.current.focus(), 0);

    const handleKeyDown = (e) => {
      if (!e.shiftKey && !e.ctrlKey && !e.altKey) {
        if (e.key === "Enter") {
          e.preventDefault();
          if (formRef.current) {
            formRef.current.requestSubmit();
          }
        } else if (e.key === "Escape") {
          e.preventDefault();
          handleAttemptClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [show]);

  const normalizeInitial = () =>
    getInitialPlayerData(initialData || {}, altSlotCount);

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
    const save = window.confirm(
      "You have unsaved changes. Save changes? Click OK to save, Cancel to discard.",
    );
    if (save) {
      const nameLower = formData.name.trim().toLowerCase();
      const existingLower = (existingNames || []).map((n) =>
        String(n).toLowerCase(),
      );
      const origLower = initialData?.name
        ? String(initialData.name).toLowerCase()
        : null;
      const isDuplicate = existingLower.some(
        (n) => n === nameLower && n !== origLower,
      );
      if (isDuplicate) {
        alert(`Player name "${formData.name}" already exists.`);
        return; // keep modal open
      }

      if (initialData && typeof onSave === "function") {
        onSave(formData);
      } else if (typeof onAdd === "function") {
        onAdd(formData);
      }
    }
    // Either saved (OK) or discarded (Cancel) — close modal
    onClose();
  };

  const handleOverlayMouseDown = (e) => {
    // mark whether the pointerdown started on the overlay itself
    mouseDownOnOverlay.current = e.target === overlayRef.current;
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
        <h2>{initialData ? "Edit Player" : "Add New Player"}</h2>

        <form ref={formRef} onSubmit={handleSubmit}>
          {/* Main player info: name on its own row, class/role below, larger */}

          <div className="form-group">
            <label>Player Name *</label>
            <input
              type="text"
              ref={nameInputRef}
              value={formData.mainName}
              onChange={(e) =>
                setFormData({ ...formData, mainName: e.target.value })
              }
              placeholder="Character name"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Class *</label>
              <select
                value={formData.mainClass}
                onChange={(e) =>
                  setFormData({ ...formData, mainClass: e.target.value })
                }
                required
              >
                <option value="">Select class</option>
                {WOW_CLASSES.map((cls) => (
                  <option key={cls.name} value={cls.name}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Main Role *</label>
              <select
                value={formData.mainRole}
                onChange={(e) =>
                  setFormData({ ...formData, mainRole: e.target.value })
                }
                required
              >
                <option value="">Select role</option>
                {WOW_ROLES.map((role) => (
                  <option key={role.key} value={role.key}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="Main">Main Roster</option>
              <option value="Trial">Trial</option>
              <option value="Bench">Bench/Backup</option>
            </select>
          </div>

          {[...Array(altSlotCount)].map((_, i) => {
            const altNameKey = `alt${i + 1}Name`;
            const altClassKey = `alt${i + 1}Class`;
            const altRoleKey = `alt${i + 1}Role`;
            return (
              <div className="form-row" key={i}>
                <div className="form-group alt-form-group">
                  <label>{`Alt ${i + 1} Name`}</label>
                  <input
                    type="text"
                    value={formData[altNameKey] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [altNameKey]: e.target.value })
                    }
                    placeholder="Character name"
                  />
                </div>
                <div className="form-group alt-form-group">
                  <label>{`Alt ${i + 1} Class`}</label>
                  <select
                    value={formData[altClassKey] || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [altClassKey]: e.target.value,
                      })
                    }
                  >
                    <option value="">None</option>
                    {WOW_CLASSES.map((cls) => (
                      <option key={cls.name} value={cls.name}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group alt-form-group">
                  <label>{`Alt ${i + 1} Role`}</label>
                  <select
                    value={formData[altRoleKey] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [altRoleKey]: e.target.value })
                    }
                  >
                    <option value="">Select role</option>
                    {WOW_ROLES.map((role) => (
                      <option key={role.key} value={role.key}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}

          <div className="form-group">
            <label>Notes</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Optional notes"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-add">
              {initialData ? "Save Changes" : "Add Player"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddPlayerModal;
