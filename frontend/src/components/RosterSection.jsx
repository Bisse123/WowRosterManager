import { useDroppable } from '@dnd-kit/core';
import { useRef } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import PlayerCard from './PlayerCard';

function RosterSection({ title, status, players, onEdit, onRemove }) {
  const { setNodeRef } = useDroppable({
    id: status
  });
  const { setNodeRef: setEmptyRef } = useDroppable({
    id: `${status}-empty`
  });
  const { setNodeRef: setEndRef } = useDroppable({
    id: `${status}-end`
  });
  const rosterRef = useRef(null);
  // We'll attach the droppable ref to the roster list so the drop target
  // grows with the list as players are added.
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
        <div className="player-card player-card-header">
          <div className="role-icon" title="Role Icon"> </div>
          <div className="player-icon" title="Class Icon"> </div>
          <div className="player-name">Name</div>
          <div className="player-class">Class</div>
          <div className="player-spec">Role</div>
          <div className="player-alt">Alt 1</div>
          <div className="player-alt">Alt 2</div>
          <div className="player-notes">Notes</div>
          <div className="player-edit-icon" aria-hidden />
          <div className="player-remove-icon" aria-hidden />
        </div>

        <div className={`roster-list`} ref={setRefs}>
        <SortableContext
          items={players.map(p => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {players.map((player) => (
            <div key={player.id} className="player-entry-wrapper">
                <PlayerCard
                  player={player}
                  onEdit={onEdit}
                  onRemove={onRemove}
                />
            </div>
          ))}
        </SortableContext>

        {players.length === 0 && (
          <div className="empty-roster" ref={setEmptyRef}>
            Drag players here
          </div>
        )}
        {/* End sentinel to accept drops at the end of non-empty lists */}
        {players.length > 0 && (
          <div className="end-drop-sentinel" ref={setEndRef} aria-hidden />
        )}
        </div>
      </div>
    </div>
  );
}

export default RosterSection;