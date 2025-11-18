// src/components/ControlsPanel.jsx
import { useState } from "react";
import InstrumentsTab from "./InstrumentsTab";
import MasterVolume from "./MasterVolume";
import SpeedControl from "./SpeedControl";

const speeds = [0.5, 1, 1.5, 2];

export default function ControlsPanel(props) {
    const [showInstruments, setShowInstruments] = useState(true);

    return (
        <aside className={`cp-card p-3 ${props.disabled ? 'cp-disabled' : ''}`}>
            <h5 className="cp-title m-0">Controls Panel</h5>
            <small>Real-time control over the Strudel REPL</small>

            {/* Accordion Header */}
            <div
                className="accordion-header d-flex justify-content-between align-items-center mt-3 mb-2"
                onClick={() => setShowInstruments(prev => !prev)}
                style={{ cursor: "pointer" }}
            >
                <strong>Instruments</strong>
                <span>{showInstruments ? "▲" : "▼"}</span>
            </div>

            {/* Accordion Content */}
            {showInstruments && (
                <div className="accordion-body">
                    <InstrumentsTab />
                </div>
            )}

            <MasterVolume volume={props.volume} onVolume={props.onVolume} />
            <SpeedControl speed={props.speed} onSpeed={props.onSpeed} speeds={speeds} />
        </aside>
    );
}
