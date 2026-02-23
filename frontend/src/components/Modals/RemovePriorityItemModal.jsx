import { useEffect } from "react";
import { TOKEN_TYPES } from "../../utils/tokenDetection";
import titleCase from "../../utils/general";
function RemovePriorityItemModal({ show, onClose, priorities = {}, onRemove }) {
  if (!show) return null;

  const keys = Object.keys(priorities || {});
  const defaultKeys = Object.keys(TOKEN_TYPES || {});
  const removableKeys = keys.filter((k) => !defaultKeys.includes(k));

    useEffect(() => {
      if (!show) return;
      const handleKeyDown = (e) => {
        if (!e.shiftKey && !e.ctrlKey && !e.altKey) {
          if (e.key === "Escape") {
            e.preventDefault();
            onClose && onClose();
          }
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      }
    }, [show]);
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-content" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2>Remove Priority Item</h2>
        <div style={{ maxHeight: "40vh", overflowY: "auto", padding: 6 }}>
          {removableKeys.length === 0 && <div>No removable priority items found.</div>}
          {removableKeys.map((k) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{titleCase(k)}</div>
                <div style={{ fontSize: 12, color: "#aaa" }}>{(priorities[k] && (priorities[k].types || []).join(", ")) || ""}</div>
              </div>
              <div>
                <button
                  className="toolbar-btn"
                  onClick={() => onRemove && onRemove(k)}
                  title={`Remove ${k}`}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="modal-actions" style={{ marginTop: 12 }}>
          <button
            className="btn-remove"
            type="button"
            onClick={() => {
              if (removableKeys.length === 0) return;
              removableKeys.forEach((k) => onRemove && onRemove(k));
              onClose && onClose();
            }}
            disabled={removableKeys.length === 0}
            title={removableKeys.length === 0 ? "No removable items" : `Remove all (${removableKeys.length})`}
          >
            Remove All
          </button>
          <button className="btn-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default RemovePriorityItemModal;
