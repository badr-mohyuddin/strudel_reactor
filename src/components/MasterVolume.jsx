// src/components/controls/MasterVolume.jsx
export default function MasterVolume({ volume, onVolume }) {
    return (
        <div className="mb-1">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="m-0 fw-semibold">Master Volume</label>
                <span className="cp-value-badge">{Math.round(volume * 100)}%</span>
            </div>
            <input
                className="cp-range"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={e => onVolume?.(Number(e.target.value))}
                aria-label="Master volume"
            />
        </div>
    );
}
