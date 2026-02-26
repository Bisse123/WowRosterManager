import {
  getRoleCounts,
  getClassCounts,
  detectRaidBuffs,
} from "../../utils/buffDetection";
import {
  WOW_CLASSES,
  WOW_ROLES,
  getRoleIconPath,
  getClassIconPath,
  getClassColor,
} from "../../utils/wowClasses";

function Sidebar({
  players,
  mainRosterSize = 0,
  benchRosterSize = 0,
}) {
  const roleCounts = getRoleCounts(players);
  const classCounts = getClassCounts(players);
  const buffCoverage = detectRaidBuffs(players);

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <div className="roster-size">
          <span className="label">ROSTER SIZE</span>
          <span className="value">
            {mainRosterSize} + {benchRosterSize}
          </span>
        </div>
      </div>

      <div className="sidebar-section">
        <h3>ROLE COUNTS</h3>
        <div className="role-counts">
          {WOW_ROLES.map((role) => (
            <div key={role.key} className="role-item">
              <div className="role-left">
                <img
                  src={getRoleIconPath(role.key)}
                  alt={role.name}
                  className="role-icon-img"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span
                  className="role-badge"
                  style={{ background: role.bg, color: role.color }}
                >
                  {role.name}
                </span>
              </div>
              <span className="count">{roleCounts[role.key] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <h3>CLASS DISTRIBUTION</h3>
        <div className="class-list">
          {WOW_CLASSES.map(({ name: className }) => (
            <div key={className} className="class-item">
              <div className="role-left">
                <img
                  src={getClassIconPath(className)}
                  alt={className}
                  className="player-icon-img"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span
                  className="player-class"
                  style={{ color: getClassColor(className) }}
                >
                  {className}
                </span>
              </div>
              <span className="count">{classCounts[className] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <h3>COVERAGE CHECKLIST</h3>

        <div className="coverage-category">
          <h4>STANDARD BUFFS</h4>
          {buffCoverage.standardBuffs.map((buff) => (
            <div
              key={buff.name}
              className={`coverage-item ${buff.covered ? "covered" : "missing"}`}
            >
              <span className="check-icon">{buff.covered ? "✅" : "⭕"}</span>
              <span>{buff.name}</span>
            </div>
          ))}
        </div>

        <div className="coverage-category">
          <h4>RAID UTILITY</h4>
          {buffCoverage.raidUtility.map((utility) => (
            <div
              key={utility.name}
              className={`coverage-item ${utility.covered ? "covered" : "missing"}`}
            >
              <span className="check-icon">
                {utility.covered ? "✅" : "⭕"}
              </span>
              <span>{utility.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
