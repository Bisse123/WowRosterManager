import { useDroppable } from "@dnd-kit/core";
import { useRef, useState } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SplitsPlayerCard from "./SplitsPlayerCard";
import { detectRaidBuffs, getBuffIconPath } from "../../utils/buffDetection";
import { TOKEN_TYPES, getTokenCounts } from "../../utils/tokenDetection";

function SplitsSection({ title, split, players }) {
  const { setNodeRef } = useDroppable({
    id: split,
  });

  const { setNodeRef: setEmptyRef } = useDroppable({
    id: `${split}-empty`,
  });
  const rosterRef = useRef(null);
  const setRefs = (node) => {
    rosterRef.current = node;
    setNodeRef(node);
  };
  const mainsAndTrials = players.filter((p) => !p.id.includes("-alt") && p.status !== "Bench");
  const tanks = players.filter((p) => p.role === "tank");
  const healers = players.filter((p) => p.role === "healer");
  const melee = players.filter((p) => p.role === "melee");
  const ranged = players.filter((p) => p.role === "ranged");

  const buffs = detectRaidBuffs(players);
  const renderBuffIcon = (name, covered) => {
    const iconPath = getBuffIconPath(name);
    const [imgError, setImgError] = useState(false);
    if (imgError) {
      return (
        <div
          key={name}
          className={`splits-buff-icon ${covered ? "covered" : "missing"}`}
          title={name}
        >
          ?
        </div>
      );
    }
    return (
      <img
        key={name}
        className={`splits-buff-icon ${covered ? "covered" : "missing"}`}
        src={iconPath}
        alt={name}
        style={{
          filter: covered ? "none" : "grayscale(100%) brightness(100%)",
        }}
        onError={() => setImgError(true)}
        title={name}
      />
    );
  };

  // Render all buff icons, separated by line
  const standardBuffIcons = buffs.standardBuffs.map(({ name, covered }) =>
    renderBuffIcon(name, covered),
  );
  const raidUtilityIcons = buffs.raidUtility.map(({ name, covered }) =>
    renderBuffIcon(name, covered),
  );

  return (
    <div className="splits-section">
      {split !== "Unassigned" && (
      <div>
        <div className="splits-tokens">
          {Object.keys(TOKEN_TYPES).map((tokenKey) => {
            const count = getTokenCounts(tokenKey, mainsAndTrials) || 0;
            const color =
              count > 0
                ? { color: "rgba(0, 255, 0, 1)" }
                : { color: "rgba(255,0,0,1)" };
            return (
              <div key={tokenKey}>
                <label style={color}>{tokenKey}</label>
                <span className="count">{count}</span>
              </div>
            );
          })}
        </div>

        <div className="splits-coverage">
          <div className="splits-icons">{standardBuffIcons}</div>
          <div className="splits-icons">{raidUtilityIcons}</div>
        </div>
      </div>
      )}

      <div className="splits-header">
        <h2>{title}</h2>
        <span className="count-badge">
          {players.length} ({tanks.length} + {healers.length} + {melee.length} +{" "}
          {ranged.length})
        </span>
      </div>

      <div className="splits-scroll">
        <div className="splits-list" ref={setRefs}>
          <SortableContext
            items={players.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {players.map((player) => (
              <SplitsPlayerCard key={player.id} player={player} />
            ))}
          </SortableContext>
          {players.length === 0 && (
            <div className="empty-roster" ref={setEmptyRef}>
              Drag players here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SplitsSection;
