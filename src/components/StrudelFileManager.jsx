// src/components/StrudelFileManager.jsx
import { useEffect, useRef } from "react";

export default function StrudelFileManager({ code, onLoad }) {
    const fileInputRef = useRef(null);

    // --- Load JSON file ---
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const json = JSON.parse(evt.target.result);

                if (!json.code) {
                    alert("Invalid file: missing `code` field");
                    return;
                }

                onLoad(json.code);
            } catch (err) {
                alert("Invalid JSON file");
            }
        };
        reader.readAsText(file);
    };

    // --- Save JSON file ---
    const handleSave = () => {
        const data = {
            timestamp: Date.now(),
            code: code
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = "strudel-code.json";
        a.click();

        URL.revokeObjectURL(url);
    };

    // --- Keyboard Shortcuts (Ctrl+S, Ctrl+O) ---
    useEffect(() => {
        const handler = (e) => {
            const key = e.key.toLowerCase();
            const isCtrl = e.ctrlKey || e.metaKey;

            // Ctrl+S → Save
            if (isCtrl && key === "s") {
                e.preventDefault();
                handleSave();
            }

            // Ctrl+O → Open
            if (isCtrl && key === "o") {
                e.preventDefault();
                fileInputRef.current?.click();
            }
        };

        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [code]);

    return (
        <div className="glass-card p-3 mb-3">
            <h5 className="fw-semibold mb-3">File Manager</h5>

            <div className="d-flex gap-2">
                {/* LOAD BUTTON */}
                <button
                    className="btn btn-sm btn-outline-info"
                    onClick={() => fileInputRef.current?.click()}
                >
                    Load .json
                </button>

                <input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                />

                {/* SAVE BUTTON */}
                <button
                    className="btn btn-sm btn-outline-success"
                    onClick={handleSave}
                >
                    Save .json
                </button>
            </div>

            <small className="text-secondary d-block mt-2">
                <kbd>Ctrl</kbd>+<kbd>S</kbd> to save &nbsp;•&nbsp; 
                <kbd>Ctrl</kbd>+<kbd>O</kbd> to load
            </small>
        </div>
    );
}
