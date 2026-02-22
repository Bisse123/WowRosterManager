import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  getClassColor,
  getClassIconPath,
  getRoleIconPath,
  WOW_ROLES,
} from "../../utils/wowClasses";
import { ALT_SLOT_COUNT } from "../../App";

function RosterPlayerCard({
  player,
  onEdit,
  onRemove,
  altSlotCount = ALT_SLOT_COUNT,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.6 : 1,
    border: isSortableDragging ? "2px dashed rgba(255,255,255,0.6)" : undefined,
    backgroundImage: isSortableDragging
      ? "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 6px, transparent 6px 12px)"
      : undefined,
    pointerEvents: isSortableDragging ? "none" : undefined,
  };

  const classColor = getClassColor(player.mainClass);

  const mainRoleData = WOW_ROLES.find((r) => r.key === player.mainRole) || null;
  // Prepare alt role data for all alt slots
  const altRoleDataArr = [];
  for (let i = 1; i <= altSlotCount; i++) {
    const altRoleKey = `alt${i}Role`;
    altRoleDataArr.push(
      WOW_ROLES.find((r) => r.key === player[altRoleKey]) || null,
    );
  }
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-player-id={player.id}
      className={`roster-player-card`}
      style={{ ...style }}
      tabIndex={0}
    >
      <div className="icons-horizontal">
        {mainRoleData?.key && getRoleIconPath(mainRoleData.key) ? (
          <img
            src={getRoleIconPath(mainRoleData.key)}
            alt={`${mainRoleData.name} icon`}
            className="role-icon-img"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}
        {getClassIconPath(player.mainClass) ? (
          <img
            src={getClassIconPath(player.mainClass)}
            alt={`${player.mainClass} icon`}
            className="player-icon-img"
          />
        ) : null}
      </div>

      <div className="player-name" style={{ color: classColor }}>
        {player.mainName}
      </div>

      <div className="player-class" style={{ color: classColor }}>
        {player.mainClass}
      </div>

      <div className="player-spec">
        <span
          className={"role-badge"}
          style={{
            background: mainRoleData?.bg || undefined,
            color: mainRoleData?.color || undefined,
          }}
        >
          {mainRoleData?.name || player.mainRole}
        </span>
      </div>

      {[...Array(altSlotCount)].map((_, i) => {
        const altNameKey = `alt${i + 1}Name`;
        const altClassKey = `alt${i + 1}Class`;
        const altRoleKey = `alt${i + 1}Role`;
        const altName = player[altNameKey];
        const altClass = player[altClassKey];
        const altRole = player[altRoleKey];
        const altRoleData = altRoleDataArr[i];
        return (
          <div className="player-alt" key={i}>
            {altClass && (
              <span style={{ color: getClassColor(altClass) }}>
                {altName ? (
                  <>
                    {altName}
                    <br />
                  </>
                ) : null}
                {altClass}
                {altRole ? ` - ${altRoleData?.name || altRole}` : ""}
              </span>
            )}
          </div>
        );
      })}

      <div className="player-notes">{player.notes}</div>

      <div className="player-actions-horizontal">
        <button
          type="button"
          className="player-edit-icon"
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            background: "none",
            padding: 0,
          }}
          title="Edit player"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            if (onEdit) onEdit(player);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
              fill="#ffffff"
            />
          </svg>
        </button>

        <button
          type="button"
          className="player-remove-icon"
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            background: "transparent",
            padding: 0,
          }}
          title="Remove player"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            if (onRemove) onRemove(player.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M6 7h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7z"
              stroke="#ff4d4f"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 11l4 4M14 11l-4 4"
              stroke="#ff4d4f"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"
              stroke="#ff4d4f"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default RosterPlayerCard;
