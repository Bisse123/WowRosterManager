import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  getClassColor,
  getClassIconPath,
  getRoleIconPath,
  WOW_ROLES,
} from "../../utils/wowClasses";
import titleCase from "../../utils/general";

function SplitsPlayerCard({ player, priorityItems }) {
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

  const isPriority = Boolean(priorityItems && priorityItems.length);
  if (isPriority) {
    console.log(
      "Rendering SplitsPlayerCard for",
      player.name,
      "with priority items:",
      priorityItems,
    );
  }
  const classColor = getClassColor(player.class);

  const mainRoleData = WOW_ROLES.find((r) => r.key === player.role) || null;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-player-id={player.id}
      className={`splits-player-card ${isPriority ? "is-priority" : ""}`}
      style={{ ...style }}
      tabIndex={0}
    >
      <div className="splits-player-card-info">
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
          {getClassIconPath(player.class) ? (
            <img
              src={getClassIconPath(player.class)}
              alt={`${player.class} icon`}
              className="player-icon-img"
            />
          ) : null}
        </div>

        <div className="player-name" style={{ color: classColor }}>
          {player.name}
          {player.id.match(/-alt\d+$/)
            ? player.charName
              ? ` - ${player.charName}`
              : ` - Alt`
            : null}
        </div>
      </div>
      {isPriority && (
        <div className="player-priority-items">
          {priorityItems.map((t) => titleCase(t)).join(", ")}
        </div>
      )}
    </div>
  );
}

export default SplitsPlayerCard;
