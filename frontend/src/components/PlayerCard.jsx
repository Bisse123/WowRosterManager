import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getClassColor, getClassIconPath, getRoleIconPath, WOW_ROLES } from '../utils/wowClasses';

function PlayerCard({ player, onEdit, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Keep the original sortable node visible while dragging but style it
    // as a lightweight preview: reduced opacity, dashed border and subtle
    // diagonal stripes. We still disable pointer events while dragging.
    opacity: isSortableDragging ? 0.6 : 1,
    border: isSortableDragging ? '2px dashed rgba(255,255,255,0.6)' : undefined,
    backgroundImage: isSortableDragging ? 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 6px, transparent 6px 12px)' : undefined,
    pointerEvents: isSortableDragging ? 'none' : undefined,
  };

  const classColor = getClassColor(player.class);
  const roleKey = (() => {
    const r = (player.mainSpecRole || '').toLowerCase();
    if (r.includes('tank')) return 'tank';
    if (r.includes('healer')) return 'healer';
    if (r.includes('melee')) return 'melee';
    if (r.includes('ranged')) return 'ranged';
    return '';
  })();

  const roleData = WOW_ROLES.find(r => r.key === roleKey) || null;
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-player-id={player.id}
      className={`player-card`}
      style={{ ...style }}
      tabIndex={0}
    >
        {roleKey && getRoleIconPath(roleKey) ? (
          <img
            src={getRoleIconPath(roleKey)}
            alt={`${player.mainSpecRole} icon`}
            className="role-icon-img"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : null}
      <div className="player-icon">
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

      <div className="player-class" style={{ color: classColor }}>
        {player.class}
      </div>

      <div className="player-spec">
        <span
          className={`role-badge`}
          style={{ background: roleData?.bg || undefined, color: roleData?.color || undefined }}
        >
          {player.mainSpecRole}
        </span>
      </div>

      <div className="player-alt">
        {player.alt1Class && (
          <span style={{ color: getClassColor(player.alt1Class) }}>
            {player.alt1Class} - {player.alt1SpecRole}
          </span>
        )}
      </div>

      <div className="player-alt">
        {player.alt2Class && (
          <span style={{ color: getClassColor(player.alt2Class) }}>
            {player.alt2Class} - {player.alt2SpecRole}
          </span>
        )}
      </div>

      <div className="player-notes">
        {player.notes}
      </div>

        <button
          type="button"
          className="player-edit-icon"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', background: 'none', padding: 0 }}
          title="Edit player"
          tabIndex={0}
          onClick={e => {
            e.stopPropagation();
            if (onEdit) onEdit(player);
          }}
          onPointerDown={e => e.stopPropagation()}
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
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', background: 'transparent', padding: 0 }}
          title="Remove player"
          tabIndex={0}
          onClick={e => {
            e.stopPropagation();
            if (onRemove) onRemove(player.id);
          }}
          onPointerDown={e => e.stopPropagation()}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M6 7h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7z" stroke="#ff4d4f" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 11l4 4M14 11l-4 4" stroke="#ff4d4f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="#ff4d4f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
    </div>
  );
}

export default PlayerCard;