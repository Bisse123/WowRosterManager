import { useDroppable } from "@dnd-kit/core";
import { useRef } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import RosterPlayerCard from "./RosterPlayerCard";
import { ALT_SLOT_COUNT } from "../../App";

function RosterSection({
  title,
  status,
  players,
  onEdit,
  onRemove,
  altSlotCount = ALT_SLOT_COUNT,
}) {
  const { setNodeRef } = useDroppable({
    id: status,
  });
  const { setNodeRef: setEmptyRef } = useDroppable({
    id: `${status}-empty`,
  });
  const rosterRef = useRef(null);
  const setRefs = (node) => {
    rosterRef.current = node;
    setNodeRef(node);
  };

  return (
    <div className="roster-section">
      <div className="roster-header">
        <h2>{title}</h2>
        <span className="count-badge">{players.length}</span>
      </div>

      {/* Scrolling area: header row + list scroll horizontally together */}
      <div className="roster-scroll">
        <div className="roster-player-card roster-player-card-header">
          <div className="icons-horizontal"> </div>
          <div className="player-name">Name</div>
          <div className="player-class">Class</div>
          <div className="player-spec">Role</div>
          {[...Array(altSlotCount)].map((_, i) => (
            <div className="player-alt" key={i}>{`Alt ${i + 1}`}</div>
          ))}
          <div className="player-notes">Notes</div>
          <div className="player-actions-vertical">
            <div className="player-edit-icon" aria-hidden />
            <div className="player-remove-icon" aria-hidden />
          </div>
        </div>

        <div className={`roster-list`} ref={setRefs}>
          <SortableContext
            items={players.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {players.map((player) => (
              <RosterPlayerCard
                key={player.id}
                player={player}
                onEdit={onEdit}
                onRemove={onRemove}
                altSlotCount={altSlotCount}
              />
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

export default RosterSection;
