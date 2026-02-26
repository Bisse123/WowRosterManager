import React from "react";
import PrioritiesPlayerCard from "./PrioritiesPlayerCard";
import { isClassEligibleForType } from "../../utils/ItemTypes";
import titleCase from "../../utils/general";
function PrioritySection({
  tokenKey,
  players = [],
  priorities = {},
  onPriorityChange,
}) {
  const priorityPlayersMap = (priorities[tokenKey] && priorities[tokenKey].players) || {};
  const priorityPlayers = Object.keys(priorityPlayersMap || {});
  const priorityTypes = (priorities[tokenKey] && priorities[tokenKey].types) || [];

  const isEligible = (player) => {
    const cls = player.mainClass;
    const role = player.mainRole;
    const eligibleForAtLeastOneType = isClassEligibleForType(cls, role, priorityTypes);
    return eligibleForAtLeastOneType;
  };

  const playersForDisplay = players
    .filter((p) => isEligible(p))
    .sort((a, b) => {
      const statusOrder = { Main: 0, Trial: 1, Bench: 2 };
      const roleOrder = { melee: 0, ranged: 1, tank: 2, healer: 3 };
      const pA = Number(priorityPlayersMap[a.id] ?? 5);
      const pB = Number(priorityPlayersMap[b.id] ?? 5);
      if (pA !== pB) return pA - pB;
      const sA = statusOrder[a.status] ?? 99;
      const sB = statusOrder[b.status] ?? 99;
      if (sA !== sB) return sA - sB;
      const rA = roleOrder[a.mainRole] ?? 99;
      const rB = roleOrder[b.mainRole] ?? 99;
      if (rA !== rB) return rA - rB;
      const cA = a.mainClass.toLowerCase();
      const cB = b.mainClass.toLowerCase();
      if (cA !== cB) return cA.localeCompare(cB);

      const nA = a.mainName.toLowerCase();
      const nB = b.mainName.toLowerCase();
      if (nA !== nB) return nA.localeCompare(nB);
      return 0;
    });

  return (
    <div className="priorities-section">
      <div className="priorities-header">
        <h2>{titleCase(tokenKey)}</h2>
        <div className="count">{priorityPlayers.length}</div>
      </div>
        <div className="priorities-header priorities-subheader">
          <h3>{priorityTypes.map((t) => titleCase(t)).join(", ")}</h3>
        </div>

      <div className="priorities-scroll">
        <div className="priorities-list">
          {playersForDisplay.map((p) => (
            <PrioritiesPlayerCard
              key={p.id}
              player={p}
              onPriorityChange={(id, val) => onPriorityChange && onPriorityChange(tokenKey, id, val)}
              currentPriority={priorityPlayersMap[p.id]}
              isPriority={priorityPlayers.includes(p.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default PrioritySection;
