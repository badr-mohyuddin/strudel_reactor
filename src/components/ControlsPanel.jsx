import { useState } from "react";
import InstrumentsTab from "./InstrumentsTab";
import MasterVolume from "./MasterVolume";
import SpeedControl from "./SpeedControl";

export default function ControlsPanel({
  instruments, setInstruments,
  volume, onVolume,
  speed, onSpeed,
  speedOptions, setSpeedOptions,
  disabled
}) {
  const [showInstruments, setShowInstruments] = useState(true);

  return (
    <aside className={`cp-card p-3 ${disabled ? 'cp-disabled' : ''}`}>
      <h5 className="cp-title m-0">Controls Panel</h5>
      <small>Real-time control over the Strudel REPL</small>

      <div className="row g-2 mt-3">
        {/* Left: Instruments */}
        <div className="col-6">
          <InstrumentsTab instruments={instruments} setInstruments={setInstruments} />
        </div>

        {/* Right: Volume + Speed */}
        <div className="col-6 d-flex flex-column gap-3">
          <MasterVolume volume={volume} onVolume={onVolume} />
          <SpeedControl
            speed={speed}
            onSpeed={onSpeed}
            speeds={speedOptions}
            setSpeeds={setSpeedOptions}
          />
        </div>
      </div>
    </aside>
  );
}
