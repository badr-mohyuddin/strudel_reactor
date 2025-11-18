// src/components/tabs/InstrumentsTab.jsx
export default function InstrumentsTab({ melodyOn, onMelody, drumsOn, onDrums, chordsOn, onChords, bassOn, onBass, extraOn, onExtra }) {
    const instruments = [
        { id: "melody", label: "Melody (Kalimba / Guitar)", checked: melodyOn, onChange: onMelody },
        { id: "drums", label: "Drums", checked: drumsOn, onChange: onDrums },
        { id: "chords", label: "Chords (E-Piano)", checked: chordsOn, onChange: onChords },
        { id: "bass", label: "Bass", checked: bassOn, onChange: onBass },
        { id: "extra", label: "Extra (Organ + Arp)", checked: extraOn, onChange: onExtra },
    ];

    return (
        <section className="cp-pattern mb-3">
            <h6 className="mb-2">Instruments</h6>
            <div className="d-grid gap-2">
                {instruments.map(({ id, label, checked, onChange }) => (
                    <label key={id} className="cp-toggle-row">
                        <span className="cp-toggle-label">{label}</span>
                        <input
                            id={`ins-${id}`}
                            type="checkbox"
                            className="cp-toggle-input"
                            checked={!!checked}
                            onChange={(e) => onChange?.(e.target.checked)}
                            aria-label={`${label} ${checked ? "on" : "off"}`}
                        />
                        <span className="cp-toggle-switch" aria-hidden />
                    </label>
                ))}
            </div>
        </section>
    );
}
