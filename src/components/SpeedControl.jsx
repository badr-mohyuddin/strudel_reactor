import { useState } from "react";

export default function SpeedControl({ speed, onSpeed, speeds, setSpeeds }) {
  const [newSpeed, setNewSpeed] = useState("");

  const addSpeed = () => {
    const val = parseFloat(newSpeed);
    if (!isNaN(val) && !speeds.includes(val)) {
      setSpeeds(prev => [...prev, val].sort((a,b)=>a-b));
      setNewSpeed("");
    }
  };

  return (
    <section className="cp-pattern mb-3">
      <h6 className="mb-2">Speed</h6>

      <select
        className="form-select mb-2"
        value={speed}
        onChange={(e) => onSpeed(parseFloat(e.target.value))}
      >
        {speeds.map((s) => <option key={s} value={s}>{s}x</option>)}
      </select>

      <div className="d-flex gap-2">
        <input
          type="number"
          min="0.1"
          step="0.1"
          className="form-control form-control-sm"
          placeholder="Add speed"
          value={newSpeed}
          onChange={(e) => setNewSpeed(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSpeed()}
        />
        <button type="button" className="btn btn-sm btn-outline-light" onClick={addSpeed}>
          + Add
        </button>
      </div>
    </section>
  );
}
