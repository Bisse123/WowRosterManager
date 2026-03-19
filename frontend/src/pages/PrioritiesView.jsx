import { useEffect, useState } from "react";
import PrioritySection from "../components/Priorities/PrioritiesSection";
import Toolbar from "../components/Toolbar";

function PrioritiesView({
  toolbarProps,
  players = [],
  priorities = {},
  onPriorityChange,
  altSlotCount = 3,
}) {
  const [searchValue, setSearchValue] = useState("");
  const priorityKeys = Object.keys(priorities);
  const [filteredPlayers, setFilteredPlayers] = useState([]);

  useEffect(() => {
    const expandedPlayers = [];

    players.forEach((player) => {
      if (player.status !== "Main" && player.status !== "Trial") return;
      expandedPlayers.push({
        id: `${player.id}-main`,
        name: player.mainName,
        class: player.mainClass,
        role: player.mainRole,
        status: player.status,
      });
      
      for (let i = 1; i <= altSlotCount; i++) {
        if (player[`alt${i}Name`] || player[`alt${i}Class`]) {
          expandedPlayers.push({
            id: `${player.id}-alt${i}`,
            name: player.mainName,
            class: player[`alt${i}Class`],
            role: player[`alt${i}Role`] || "",
            status: "Alt",
          });
        }
      }
    });

    if (!searchValue) {
      setFilteredPlayers(expandedPlayers || []);
      return;
    }
    const lower = searchValue.toLowerCase();
    const filtered = (expandedPlayers || []).filter((p) => {
      return (
        p.name.toLowerCase().includes(lower) ||
        p.class.toLowerCase().includes(lower) ||
        lower === "main" && !p.id.includes("-alt") ||
        lower === "alt" && p.id.includes("-alt")
      );
    });
    setFilteredPlayers(filtered);
  }, [players, searchValue]);

  return (
    <div className="priorities-view">
      <Toolbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        {...toolbarProps}
      />
      <div className="priorities-content">
        <div className="priorities-container">
          {priorityKeys.map((tk) => (
            <PrioritySection
              key={tk}
              tokenKey={tk}
              players={filteredPlayers}
              priorities={priorities}
              onPriorityChange={onPriorityChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default PrioritiesView;
