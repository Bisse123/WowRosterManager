import { useEffect, useRef, useState } from "react";
import { getInitialPlayerData } from "../components/Roster/AddPlayerModal";

function ImportExportModals({
  showModal, // false | 'Import' | 'Export'
  setShowModal,
  RosterPlayers,
  setRosterPlayers,
  SplitsPlayers,
  setSplitsPlayers,
  altSlotCount,
  setAltSlotCount,
  setSplitAmount,
}) {
  const [string, setString] = useState("");
  const [pendingSplitsString, setPendingSplitsString] = useState("");
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
            importPlayers(textAreaRef.current ? textAreaRef.current.value : string);
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

  const importPlayers = (inputString = string) => {
    let rosterString = "";
    let splitsString = "";
    const lines = inputString.split(/\r?\n/);
    let rosterStart = -1;
    let splitsStart = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === "Roster") rosterStart = i;
      if (lines[i].trim() === "Splits") splitsStart = i;
    }
    if (rosterStart !== -1 && splitsStart !== -1) {
      // Both headers found
      rosterString = lines.slice(rosterStart + 1, splitsStart).join("\n");
      splitsString = lines.slice(splitsStart + 1).join("\n");
    } else if (rosterStart !== -1) {
      // Only Roster found
      rosterString = lines.slice(rosterStart + 1).join("\n");
    } else if (splitsStart !== -1) {
      // Only Splits found
      splitsString = lines.slice(splitsStart + 1).join("\n");
    } else {
      // No headers found, treat whole string as roster
      rosterString = inputString;
    }
    let importSuccess = true;
    if (rosterString.trim()) {
      importSuccess = importRosterPlayers(rosterString);
    } else {
      alert("No roster data found to import.");
      importSuccess = false;
    }
    if (importSuccess && splitsString.trim()) {
      setPendingSplitsString(splitsString);
    } else if (importSuccess) {
      setShowModal(false);
    }
  };

  // useEffect to import splits after SplitsPlayers are set from roster import
  useEffect(() => {
    if (pendingSplitsString) {
      importSplitsPlayers(pendingSplitsString);
      setPendingSplitsString("");
      setShowModal(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [RosterPlayers]);

  const exportPlayers = () => {
    // Export Roster section
    const rosterTSV = exportRosterPlayers();
    // Export Splits section (placeholder logic, adjust as needed)
    const splitsTSV = exportSplitsPlayers();
    // Combine with headers
    let exportString = "Roster\n" + rosterTSV;
    if (splitsTSV && splitsTSV.trim()) {
      exportString += "\nSplits\n" + splitsTSV;
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
          if (player.mainClass === playerClass && player.mainRole === role) {
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

  if (!showModal) return null;
  const isImport = showModal === "Import";
  const isExport = showModal === "Export";
  return (
    <div
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
            className="btn-primary"
            style={{ padding: "10px 22px", fontWeight: 600, fontSize: 15 }}
            onClick={isImport ? importPlayers : copyExported}
          >
            {isImport ? `Import` : `Export`}
          </button>
          <button
            className="btn-secondary"
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
