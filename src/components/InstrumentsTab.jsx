import { useState } from "react";

export default function InstrumentsTab({ instruments, setInstruments }) {
  const [newInstrumentName, setNewInstrumentName] = useState("");

  const toggleInstrument = (id, value) => {
    setInstruments(prev =>
      prev.map(ins => ins.id === id ? { ...ins, enabled: value } : ins)
    );
  };

  const addInstrument = () => {
    const trimmedName = newInstrumentName.trim();
    if (!trimmedName) return;
    setInstruments(prev => [...prev, { id: trimmedName, label: trimmedName, enabled: true }]);
    setNewInstrumentName("");
  };

  return (
    <section className="cp-pattern mb-3">
      <h6 className="mb-2">Instruments</h6>

      {/* Two-column grid for instruments */}
      <div className="row g-2">
        {instruments.map(({ id, label, enabled }) => (
          <div className="col-6" key={id}>
            <label className="d-flex align-items-center">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => toggleInstrument(id, e.target.checked)}
                className="me-2"
              />
              {label}
            </label>
          </div>
        ))}
      </div>

      {/* Add new instrument */}
      <div className="d-flex gap-2 mt-2">
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="New instrument"
          value={newInstrumentName}
          onChange={(e) => setNewInstrumentName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addInstrument()}
        />
        <button type="button" className="btn btn-sm btn-outline-light" onClick={addInstrument}>
          + Add
        </button>
      </div>
    </section>
  );
}
