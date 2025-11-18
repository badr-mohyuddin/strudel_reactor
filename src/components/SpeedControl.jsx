// src/components/controls/SpeedControl.jsx
import { useState } from "react";

export default function SpeedControl({ speed, onSpeed, speeds }) {
    const [customValue, setCustomValue] = useState("");

    const handleCustomChange = (e) => {
        const value = Number(e.target.value);
        setCustomValue(e.target.value);

        if (!isNaN(value)) {
            onSpeed(value);      // set speed
        }
    };

    const isRadioSelected = speeds.includes(speed);

    return (
        <div className="mb-1 speed-block">
            <label className="m-0 fw-semibold d-block mb-2">Speed Multiplier</label>

            <div className="speed-toggle" role="group" aria-label="Speed Multiplier">
                {speeds.map(v => {
                    const id = `speed-${String(v).replace('.', '-')}`;
                    return (
                        <div key={v} className="speed-item">
                            <input
                                id={id}
                                type="radio"
                                name="speed"
                                value={v}
                                checked={isRadioSelected && speed === v}
                                onChange={() => {
                                    setCustomValue("");   // clear custom input
                                    onSpeed(v);
                                }}
                                className="vh-radio"
                            />
                            <label
                                htmlFor={id}
                                className={`btn btn-speed ${isRadioSelected && speed === v ? 'active' : ''}`}
                            >
                                {v}
                            </label>
                        </div>
                    );
                })}

                {/* --- Custom Input --- */}
                <div className="speed-item ms-2">
                    <input
                        type="number"
                        step="0.01"
                        placeholder="Custom"
                        className="form-control"
                        value={customValue}
                        onChange={handleCustomChange}
                        onFocus={() => {
                            // deselect radio buttons when typing
                            if (isRadioSelected) onSpeed(Number(customValue) || 1);
                        }}
                        style={{ width: "100px" }}
                    />
                </div>
            </div>
        </div>
    );
}
