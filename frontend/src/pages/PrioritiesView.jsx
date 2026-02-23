import PrioritySection from "../components/Priorities/PrioritiesSection";
import Toolbar from "../components/Toolbar";

function PrioritiesView({
  toolbarProps,
  players = [],
  priorities = {},
  togglePlayer,
}) {
  const priorityKeys = Object.keys(priorities);

  const mainPlayers = players.filter((p) => p.status === "Main");
  const trialPlayers = players.filter((p) => p.status === "Trial");
  const benchPlayers = players.filter((p) => p.status === "Bench");

  return (
    <div className="priorities-view">
      <Toolbar {...toolbarProps }/>
      <div className="priorities-content">
        <div className="priorities-container">
          {priorityKeys.map((tk) => (
            <PrioritySection
              key={tk}
              tokenKey={tk}
              players={mainPlayers.concat(trialPlayers)}
              priorities={priorities}
              togglePlayer={togglePlayer}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default PrioritiesView;
