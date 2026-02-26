import {
  getClassColor,
  getClassIconPath,
  getRoleIconPath,
  WOW_ROLES,
} from "../../utils/wowClasses";

function PrioritiesPlayerCard({
  player,
  onPriorityChange,
  currentPriority,
  isPriority,
}) {
  if (!player) return null;

  const classColor = getClassColor(player.mainClass || player.class);
  const mainRoleData =
    WOW_ROLES.find((r) => r.key === (player.mainRole || player.role)) || null;

  const handleChange = (e) => {
    const val = Number(e.target.value);
    onPriorityChange && onPriorityChange(player.id, val);
  };

  return (
    <div
      className={`priorities-player-card ${isPriority ? "is-priority" : ""}`}
      data-player-id={player.id}
      tabIndex={0}
    >
      <div className="icons-horizontal">
        {mainRoleData?.key && getRoleIconPath(mainRoleData.key) ? (
          <img
            src={getRoleIconPath(mainRoleData.key)}
            alt={`${mainRoleData.name} icon`}
            className="role-icon-img"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : null}
        {getClassIconPath(player.mainClass || player.class) ? (
          <img
            src={getClassIconPath(player.mainClass || player.class)}
            alt={`${player.mainClass || player.class} icon`}
            className="player-icon-img"
          />
        ) : null}
        <div className="player-name" style={{ color: classColor }}>
          {player.mainName} - {player.status}
        </div>
      </div>

      <div className="priority-select">
        <select value={currentPriority ?? 5} onChange={handleChange}>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default PrioritiesPlayerCard;
