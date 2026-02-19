import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  getClassColor,
  getClassIconPath,
  getRoleIconPath,
  WOW_ROLES,
} from "../../utils/wowClasses";

function SplitsPlayerCard({
  player,
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

  const classColor = getClassColor(player.class);

  const mainRoleData = WOW_ROLES.find((r) => r.key === player.role) || null;
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-player-id={player.id}
      className={`splits-player-card`}
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
      </div>
    </div>
  );
}

export default SplitsPlayerCard;
