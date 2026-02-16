import { useDroppable } from '@dnd-kit/core';
import { useRef, useState, useEffect } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import PlayerCard from './PlayerCard';

function RosterSection({ title, status, players, selectedPlayer, remoteSelections = {}, onPlayerClick, readonly, onEdit, onRemove, placeholderIndex }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status
  });
  const { setNodeRef: setEmptyRef, isOver: isEmptyOver } = useDroppable({
    id: `${status}-empty`
  });
  const { setNodeRef: setEndRef, isOver: isEndOver } = useDroppable({
    id: `${status}-end`
  });
  const rosterRef = useRef(null);
  const listRef = rosterRef; // alias
  const [placeholderTop, setPlaceholderTop] = useState(null);
  // We'll attach the droppable ref to the roster list so the drop target
  // grows with the list as players are added.
  const setRefs = (node) => {
    rosterRef.current = node;
    setNodeRef(node);
  };

  // Measure column widths from rendered .player-card children and set CSS vars
  useEffect(() => {
    if (typeof placeholderIndex !== 'number' || !rosterRef.current) {
      setPlaceholderTop(null);
      return;
    }

    // find the element at the placeholderIndex among player-card children
    const cards = Array.from(rosterRef.current.querySelectorAll('.player-card'));
    if (cards.length === 0) {
      // empty list: place preview at top padding (approx)
      setPlaceholderTop(8);
      return;
    }

    const idx = Math.max(0, Math.min(placeholderIndex, cards.length));
    let top = 0;
    if (idx < cards.length) {
      const refEl = cards[idx];
      top = refEl.offsetTop;
    } else {
      // after last element: position after last card
      const lastEl = cards[cards.length - 1];
      top = lastEl.offsetTop + lastEl.offsetHeight;
    }

    setPlaceholderTop(top);
  }, [placeholderIndex, players]);

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

        <div className={`roster-list ${isOver ? 'drag-over' : ''}`} ref={setRefs}>
        <SortableContext
          items={players.map(p => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isSelected={selectedPlayer === player.id}
              remoteSelection={remoteSelections[player.id]}
              onClick={() => onPlayerClick(player.id)}
              readonly={readonly}
              onEdit={onEdit}
              onRemove={onRemove}
            />
          ))}
        </SortableContext>

        {/* absolute-positioned preview overlay to avoid reflow of list children */}
        {typeof placeholderIndex === 'number' && placeholderTop !== null && (
          <div className="drop-preview-abs" style={{ top: placeholderTop }} />
        )}

        {players.length === 0 && (
          <div className="empty-roster" ref={setEmptyRef}>
            {readonly ? 'No players in this section' : 'Drag players here'}
          </div>
        )}
        {/* End sentinel to accept drops at the end of non-empty lists */}
        <div className="end-drop-sentinel" ref={setEndRef} aria-hidden />
        </div>
      </div>
    </div>
  );
}

export default RosterSection;