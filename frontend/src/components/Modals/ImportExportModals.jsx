import { useEffect, useRef, useState } from "react";
import { getInitialPlayerData } from "./AddPlayerModal";
import titleCase from "../../utils/general";

function ImportExportModals({
  showModal, // false | 'Import' | 'Export'
  setShowModal,
  RosterPlayers,
  setRosterPlayers,
  SplitsPlayers,
  setSplitsPlayers,
  priorities,
  setPriorities,
  altSlotCount,
  setAltSlotCount,
  setSplitAmount,
}) {
  const [string, setString] = useState("");
  const [pendingSplitsString, setPendingSplitsString] = useState("");
  const [pendingPrioritiesString, setPendingPrioritiesString] = useState("");
  const textAreaRef = useRef(null);

  useEffect(() => {
    if (!showModal) return;
    setString("");
    if (showModal === "Import" && textAreaRef.current) {
      textAreaRef.current.focus();
    } else if (showModal === "Export") {
      exportPlayers();
    }

    const handleKeyDown = (e) => {
      if (!e.shiftKey && !e.ctrlKey && !e.altKey) {
        if (e.key === "Enter") {
          e.preventDefault();
          if (showModal === "Import") {
            importPlayers(
              textAreaRef.current ? textAreaRef.current.value : string,
            );
          } else if (showModal === "Export") {
            copyExported();
          }
        } else if (e.key === "Escape") {
          e.preventDefault();
          setShowModal(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showModal]);

  const importPlayers = () => {
    let rosterString = "";
    let splitsString = "";
    let prioritiesString = "";
    const inputString = textAreaRef.current ? textAreaRef.current.value : string;
    const lines = inputString.split(/\r?\n/);
    // collect header positions so we can support any ordering
    const headerPositions = {};
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trim();
      if (t === "Roster" || t === "Splits" || t === "Priorities") {
        headerPositions[t] = i;
      }
    }
    if (Object.keys(headerPositions).length > 0) {
      const ordered = Object.entries(headerPositions).sort((a, b) => a[1] - b[1]);
      for (let h = 0; h < ordered.length; h++) {
        const name = ordered[h][0];
        const start = ordered[h][1] + 1;
        const end = h + 1 < ordered.length ? ordered[h + 1][1] : lines.length;
        const section = lines.slice(start, end).join("\n");
        if (name === "Roster") rosterString = section;
        else if (name === "Splits") splitsString = section;
        else if (name === "Priorities") prioritiesString = section;
      }
    } else {
      rosterString = inputString;
    }
    let importSuccess = true;
    if (rosterString.trim()) {
      importSuccess = importRosterPlayers(rosterString);
    } else {
      alert("No roster data found to import.");
      importSuccess = false;
    }
    if (importSuccess) {
      if (splitsString.trim()) setPendingSplitsString(splitsString);
      if (prioritiesString.trim()) setPendingPrioritiesString(prioritiesString);
      if (!splitsString.trim() && !prioritiesString.trim()) setShowModal(false);
    }
  };

  // useEffect to import splits after SplitsPlayers are set from roster import
  useEffect(() => {
    let importSplitsSuccess = true;
    let importPrioritySuccess = true;
    if (pendingSplitsString) {
      importSplitsSuccess = importSplitsPlayers(pendingSplitsString);
      setPendingSplitsString("");
    }
    if (pendingPrioritiesString) {
      importPrioritySuccess = importPriorities(pendingPrioritiesString);
      setPendingPrioritiesString("");
    }
    if (importSplitsSuccess && importPrioritySuccess) {
      setShowModal(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [RosterPlayers]);

  const exportPlayers = () => {
    // Export Roster section
    const rosterTSV = exportRosterPlayers();
    // Export Splits section
    const splitsTSV = exportSplitsPlayers();
    // Export Priorities section
    const prioritiesTSV = exportPriorities();

    // Combine with headers
    let exportString = "Roster\n" + rosterTSV;
    if (splitsTSV && splitsTSV.trim()) {
      exportString += "\nSplits\n" + splitsTSV;
    }
    if (prioritiesTSV && prioritiesTSV.trim()) {
      exportString += "\nPriorities\n" + prioritiesTSV;
    }
    setString(exportString);
  };

  const copyExported = () => {
    if (textAreaRef.current) {
      textAreaRef.current.select();
      document.execCommand("copy");
    }
  };

  const importRosterPlayers = (rosterString) => {
    try {
      const lines = rosterString.trim().split(/\r?\n/);
      if (lines.length < 2) throw new Error("No data rows found");
      const headers = lines[0].split("\t");
      const importedRosterPlayers = lines.slice(1).map((line) => {
        const values = line.split("\t");
        const playerData = {};
        let maxAlt = 0;
        headers.forEach((header, idx) => {
          const altMatch = header.match(/^Alt(\d+) (Name|Class|Role)$/);
          if (header === "Name") playerData.mainName = values[idx] || "";
          else if (header === "Class") playerData.mainClass = values[idx] || "";
          else if (header === "Role")
            playerData.mainRole = values[idx] ? values[idx].toLowerCase() : "";
          else if (header === "Status") playerData.status = values[idx] || "";
          else if (header === "Note") playerData.notes = values[idx] || "";
          else if (altMatch) {
            const altIdx = altMatch[1];
            const altType = altMatch[2];
            const maxAltIdx = parseInt(altIdx, 10);
            if (maxAltIdx > maxAlt) maxAlt = maxAltIdx;
            if (altType === "Name")
              playerData[`alt${altIdx}Name`] = values[idx] || "";
            else if (altType === "Class")
              playerData[`alt${altIdx}Class`] = values[idx] || "";
            else if (altType === "Role")
              playerData[`alt${altIdx}Role`] = values[idx]
                ? values[idx].toLowerCase()
                : "";
          }
        });
        if (maxAlt > 0 && typeof setAltSlotCount === "function") {
          setAltSlotCount(maxAlt);
        }
        
        return {
          id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...getInitialPlayerData(
            playerData,
            maxAlt > 0 ? maxAlt : altSlotCount,
          ),
        };
      });
      setRosterPlayers(importedRosterPlayers);
      return true;
    } catch (err) {
      alert("Failed to import: " + (err.message || err));
      return false;
    }
  };

  // Import Splits section using headers ["Name", "Character", "Class", "Role", "Split"]
  const importSplitsPlayers = (splitsString) => {
    try {
      const lines = splitsString.trim().split(/\r?\n/);
      if (lines.length < 2) throw new Error("No data rows found in Splits");
      const headers = lines[0].split("\t");
      const idxName = headers.indexOf("Name");
      const idxCharName = headers.indexOf("Character");
      const idxClass = headers.indexOf("Class");
      const idxRole = headers.indexOf("Role");
      const idxSplit = headers.indexOf("Split");
      if (
        idxName === -1 ||
        idxCharName === -1 ||
        idxClass === -1 ||
        idxRole === -1 ||
        idxSplit === -1
      ) {
        throw new Error("Splits headers missing required columns");
      }
      let maxSplit = 0;
      const splits = lines.slice(1).map((line) => {
        const values = line.split("\t");
        const name = values[idxName] || "";
        const charName = values[idxCharName] || "";
        const playerClass = values[idxClass] || "";
        const role = values[idxRole] ? values[idxRole].toLowerCase() : "";
        let split = values[idxSplit] || "Unassigned";
        const splitIdx =
          split.match(/split[-\s]*(\d+)/i) || split.match(/Split\s*(\d+)/);
        if (splitIdx) {
          split = `split-${splitIdx[1]}`;
          let maxSplitIdx = parseInt(splitIdx[1], 10);
          if (maxSplitIdx && maxSplitIdx > maxSplit) {
            maxSplit = maxSplitIdx;
          }
        }
        const player = RosterPlayers.find((p) => p.mainName === name);
        if (player) {
          if (
            player.mainName === charName &&
            player.mainClass === playerClass &&
            player.mainRole === role
          ) {
            return {
              id: `${player.id}-main`,
              name: name,
              charName: charName,
              class: playerClass,
              role: role,
              split: split,
            };
          }
          for (let i = 1; i <= altSlotCount; i++) {
            if (
              player[`alt${i}Name`] === charName &&
              player[`alt${i}Class`] === playerClass &&
              player[`alt${i}Role`] === role
            ) {
              return {
                id: `${player.id}-alt${i}`,
                name: name,
                charName: charName,
                class: playerClass,
                role: role,
                split: split,
              };
            }
          }
        }
        // If no valid player found, return null
        return null;
      });

      const importedSplitsPlayers = splits.filter((entry) => entry !== null);
      if (maxSplit > 0 && typeof setSplitAmount === "function") {
        setSplitAmount(maxSplit);
      }
      setSplitsPlayers(() => {
        return importedSplitsPlayers;
      });
      return true;
    } catch (err) {
      alert("Failed to import splits: " + (err.message || err));
      return false;
    }
  };

  const importPriorities = (prioritiesString) => {
    try {
      const lines = prioritiesString.trim().split(/\r?\n/);
      if (lines.length < 2) throw new Error("No data rows found in Priorities");
      const headers = lines[0].split("\t");
      const idxToken = headers.indexOf("Token");
      const idxTypes = headers.indexOf("Types");
      const idxP1 = headers.indexOf("P1") !== -1 ? headers.indexOf("P1") : headers.indexOf("Priority1");
      const idxP2 = headers.indexOf("P2") !== -1 ? headers.indexOf("P2") : headers.indexOf("Priority2");
      const idxP3 = headers.indexOf("P3") !== -1 ? headers.indexOf("P3") : headers.indexOf("Priority3");
      const idxP4 = headers.indexOf("P4") !== -1 ? headers.indexOf("P4") : headers.indexOf("Priority4");
      const idxPlayers = headers.indexOf("Players"); // fallback legacy

      if (idxToken === -1 || idxTypes === -1) {
        throw new Error("Priorities headers missing required columns (Token, Types)");
      }
      const importedPriorities = {};
      lines.slice(1).forEach((line) => {
        const values = line.split("\t");
        const tokenKey = (values[idxToken] || "").toLowerCase();
        const types = idxTypes !== -1 && values[idxTypes]
          ? values[idxTypes].toLowerCase().split(",").map((t) => t.trim())
          : [];

        const playersMap = {};
        // If P1..P4 columns present, parse each into playersMap with corresponding priority
        const addNamesFromColumn = (colIdx, priority) => {
          if (colIdx === -1) return;
          const names = values[colIdx] ? values[colIdx].split(",").map((n) => n.trim()).filter(Boolean) : [];
          names.forEach((name) => {
            const player = RosterPlayers.find((p) => p.mainName === name);
            if (player) playersMap[player.id] = priority;
          });
        };

        if (idxP1 !== -1 || idxP2 !== -1 || idxP3 !== -1 || idxP4 !== -1) {
          addNamesFromColumn(idxP1, 1);
          addNamesFromColumn(idxP2, 2);
          addNamesFromColumn(idxP3, 3);
          addNamesFromColumn(idxP4, 4);
        } else if (idxPlayers !== -1) {
          // legacy 'Players' column: treat listed players as priority 1
          const playerNames = values[idxPlayers]
            ? values[idxPlayers].split(",").map((n) => n.trim()).filter(Boolean)
            : [];
          playerNames.forEach((name) => {
            const player = RosterPlayers.find((p) => p.mainName === name);
            if (player) playersMap[player.id] = 1;
          });
        }

        if (tokenKey) {
          importedPriorities[tokenKey] = {
            players: playersMap,
            types: types,
          };
        }
      });
      setPriorities(importedPriorities);
      return true;
    } catch (err) {
      alert("Failed to import priorities: " + (err.message || err));
      return false;
    }
  };

  const exportRosterPlayers = () => {
    const headers = [
      "Name",
      "Class",
      "Role",
      "Status",
      "Note",
      ...Array.from({ length: altSlotCount }, (_, i) => [
        `Alt${i + 1} Name`,
        `Alt${i + 1} Class`,
        `Alt${i + 1} Role`,
      ]).flat(),
    ];
    const rows = RosterPlayers.map((p) => {
      const mainRole = p.mainRole
        ? p.mainRole.charAt(0).toUpperCase() + p.mainRole.slice(1)
        : "";
      const row = [
        p.mainName || "",
        p.mainClass || "",
        mainRole || "",
        p.status || "",
        p.notes || "",
      ];
      for (let i = 1; i <= altSlotCount; i++) {
        const altRole = p[`alt${i}Role`]
          ? p[`alt${i}Role`].charAt(0).toUpperCase() + p[`alt${i}Role`].slice(1)
          : "";
        row.push(
          p[`alt${i}Name`] || "",
          p[`alt${i}Class`] || "",
          altRole || "",
        );
      }
      return row.map((v) => String(v).replace(/\t/g, " ")).join("\t");
    });
    const tsv = [headers.join("\t"), ...rows].join("\n");
    return tsv;
  };

  const exportSplitsPlayers = () => {
    if (!SplitsPlayers || SplitsPlayers.length === 0) return "";
    const headers = ["Name", "Character", "Class", "Role", "Split"];
    const rows = SplitsPlayers.map((p) => {
      const role = p.role
        ? p.role.charAt(0).toUpperCase() + p.role.slice(1).toLowerCase()
        : "";
      let splitValue = p.split || "";
      // If split is like 'split-1' or 'split 1', format as 'Split 1' for export
      const match = splitValue.match(/split[-\s]*(\d+)/i);
      if (match) {
        splitValue = `Split ${match[1]}`;
      }
      return [
        p.name || "",
        p.charName || "",
        p.class || "",
        role || "",
        splitValue,
      ]
        .map((v) => String(v).replace(/\t/g, " "))
        .join("\t");
    });
    return [headers.join("\t"), ...rows].join("\n");
  };

  const exportPriorities = () => {
    const tokenKeys = Object.keys(priorities);
    if (tokenKeys.length === 0) return "";
    const headers = ["Token", "P1", "P2", "P3", "P4", "Types"];
    const rows = tokenKeys.map((tokenKey) => {
      const tokenData = priorities[tokenKey] || {};
      const playersMap = tokenData.players || {};
      const pBuckets = { 1: [], 2: [], 3: [], 4: [] };
      Object.keys(playersMap).forEach((id) => {
        const pr = Number(playersMap[id]);
        if (pr >= 1 && pr <= 4) pBuckets[pr].push(id);
      });
      const formatNames = (ids) => ids
        .map((id) => {
          const player = RosterPlayers.find((p) => p.id === id);
          return player ? player.mainName : null;
        })
        .filter((name) => name !== null)
        .join(", ");

      const types = (tokenData.types || []).map((t) => titleCase(t)).join(", ");
      return [
        titleCase(tokenKey),
        formatNames(pBuckets[1]),
        formatNames(pBuckets[2]),
        formatNames(pBuckets[3]),
        formatNames(pBuckets[4]),
        types,
      ].join("\t");
    });
    return [headers.join("\t"), ...rows].join("\n");
  };

  if (!showModal) return null;
  const isImport = showModal === "Import";
  const isExport = showModal === "Export";
  return (
    <div
      onMouseDown={() => setShowModal(false)}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          background: "#222",
          padding: 32,
          borderRadius: 12,
          maxWidth: 700,
          width: "90%",
        }}
      >
        <h2 style={{ color: "#ffd700", marginBottom: 16 }}>
          {isImport ? "Import TSV" : "Exported TSV"}
        </h2>
        <textarea
          ref={textAreaRef}
          value={string}
          onChange={isImport ? (e) => setString(e.target.value) : undefined}
          readOnly={isExport}
          style={{
            width: "100%",
            height: 300,
            fontSize: 14,
            fontFamily: "monospace",
            marginBottom: 16,
            color: "#fff",
            background: "#111",
            border: "1px solid #555",
            borderRadius: 6,
            padding: 10,
          }}
          placeholder={isImport ? "Paste exported TSV here..." : undefined}
          onFocus={isExport ? (e) => e.target.select() : undefined}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button
            className="btn-add"
            style={{ padding: "10px 22px", fontWeight: 600, fontSize: 15 }}
            onClick={isImport ? importPlayers : copyExported}
          >
            {isImport ? `Import` : `Export`}
          </button>
          <button
            className="btn-cancel"
            style={{ padding: "10px 22px", fontWeight: 600, fontSize: 15 }}
            onClick={() => setShowModal(false)}
          >
            {isImport ? "Cancel" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportExportModals;
