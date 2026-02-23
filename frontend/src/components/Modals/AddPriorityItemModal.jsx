import { useState, useEffect, useRef } from "react";
import ITEM_TYPES from "../../utils/ItemTypes";
import { WOW_ROLES } from "../../utils/wowClasses";
import titleCase from "../../utils/general";

function AddPriorityItemModal({ show, onClose, onAdd }) {
  const [value, setValue] = useState("");
  const [selectedArmor, setSelectedArmor] = useState("");
  const [selectedStats, setSelectedStats] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const inputRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    if (!show) return;
    setValue("");
    setSelectedArmor("");
    setSelectedStats([]);
    setSelectedRoles([]);
    setTimeout(() => inputRef.current && inputRef.current.focus(), 0);

    const handleKeyDown = (e) => {
      if (!e.shiftKey && !e.ctrlKey && !e.altKey) {
        if (e.key === "Enter") {
          e.preventDefault();
          if (formRef.current && typeof formRef.current.requestSubmit === "function") {
            formRef.current.requestSubmit();
          }
        } else if (e.key === "Escape") {
          e.preventDefault();
          onClose && onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [show]);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = (titleCase(value) || "").trim();
    const hasType =
      (selectedArmor && selectedArmor.length > 0) ||
      (selectedStats && selectedStats.length > 0) ||
      (selectedRoles && selectedRoles.length > 0);
    if (!trimmed) {
      alert("Please enter an item name.");
      return;
    }
    if (!hasType) {
      alert("Please select at least one type (armor, stat or role).");
      return;
    }

    const types = [];
    if (selectedArmor) types.push(selectedArmor);
    if (selectedStats && selectedStats.length) types.push(...selectedStats);
    if (selectedRoles && selectedRoles.length) types.push(...selectedRoles);
    onAdd && onAdd(trimmed, types);
    onClose && onClose();
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal-content"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2>Add Priority Item</h2>
        <form
          ref={formRef}
          onSubmit={handleSubmit}
        >
          <div className="form-group">
          <label>Item name</label>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. Cloak"
          />
        </div>
        <div className="form-group">
          <label>Armor type</label>
          <select
            value={selectedArmor}
            onChange={(e) => setSelectedArmor(e.target.value)}
          >
            <option value="">None</option>
            {Object.keys(ITEM_TYPES.armor.types).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Roles</label>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {WOW_ROLES.map((r) => (
              <label
                key={r.key}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(r.key)}
                  onChange={(e) => {
                    if (e.target.checked)
                      setSelectedRoles((p) => [...p, r.key]);
                    else setSelectedRoles((p) => p.filter((x) => x !== r.key));
                  }}
                />
                {r.name}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Stats</label>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {Object.keys(ITEM_TYPES.stat.types).map((s) => (
              <label
                key={s}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <input
                  type="checkbox"
                  checked={selectedStats.includes(s)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedStats((p) => [...p, s]);
                    else setSelectedStats((p) => p.filter((x) => x !== s));
                  }}
                />
                {s}
              </label>
            ))}
          </div>
        </div>

          <div className="modal-actions">
            <button className="btn-cancel" onClick={onClose} type="button">
              Cancel
            </button>
            <button
              type="submit"
              className="btn-add"
              >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddPriorityItemModal;
