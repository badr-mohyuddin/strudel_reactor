/* global globalThis */

import './App.css';
import { useEffect, useRef, useState } from "react";
import { StrudelMirror } from '@strudel/codemirror';
import { evalScope } from '@strudel/core';
import { initAudioOnFirstClick, getAudioContext, webaudioOutput, registerSynthSounds } from '@strudel/webaudio';
import { registerSoundfonts } from '@strudel/soundfonts';
import { transpiler } from '@strudel/transpiler';
import { stranger_tune } from './tunes';
import console_monkey_patch from './console-monkey-patch';
import { drawD3Haps } from './components/d3PianoRoll.js';
import InstrumentsTab from './components/InstrumentsTab';
import SpeedControl from './components/SpeedControl';
import StrudelFileManager from './components/StrudelFileManager';
import PreprocessTextArea from './components/PreprocessTextarea';
import { Preprocess } from './utils/PreprocessLogic';

let globalEditor = null;

export default function StrudelDemo() {
  const hasRun = useRef(false);

  const [procText, setProcText] = useState(stranger_tune);
  const [volume, setVolume] = useState(0.5);
  const [speed, setSpeed] = useState(1);
  const [instruments, setInstruments] = useState([
    { id: "main_arp", label: "main_arp", enabled: true },
    { id: "bassline", label: "bassline", enabled: true },
    { id: "drums", label: "drums", enabled: true },
    { id: "drums2", label: "drums2", enabled: true },
  ]);
  const [speedOptions, setSpeedOptions] = useState([0.5, 1, 1.5, 2]);
  const [state, setState] = useState("stop"); // stop | play

  // Accordion state
  const [accordionState, setAccordionState] = useState({
    pianoRoll: true,
    controls: true,
    preprocessing: true,
    editor: true
  });

  const toggleAccordion = (key) => {
    setAccordionState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getProcessedTune = () => Preprocess({ inputText: procText, volume, speed, instruments });

  const playTune = async () => {
    if (!globalEditor) return;
    await initAudioOnFirstClick();
    setState("play");
    const tune = getProcessedTune();
    globalEditor.stop?.();
    globalEditor.setCode(tune);
    globalEditor.evaluate();
  };

  const stopTune = () => {
    globalEditor?.stop();
    setState("stop");
  };

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    console_monkey_patch();

    globalEditor = new StrudelMirror({
      defaultOutput: webaudioOutput,
      getTime: () => getAudioContext().currentTime,
      transpiler,
      root: document.getElementById('editor'),
      onDraw: (haps, time) => {
        try {
          drawD3Haps(haps, time, [-2, 2], {
            svgId: '#d3-roll',
            noteHeight: 12,
            neonMelodic: '#00FFC3',
            neonDrum: '#3CB6B6',
            bg: '#0B0C10',
            gridColor: '#1A2B3C',
            labelColor: '#E0F7FA',
            showLabels: true
          });
        } catch (err) {
          console.warn("D3 piano-roll draw error:", err);
        }
      },
      prebake: async () => {
        await initAudioOnFirstClick();
        const loadModules = evalScope(
          import('@strudel/core'),
          import('@strudel/draw'),
          import('@strudel/mini'),
          import('@strudel/tonal'),
          import('@strudel/webaudio')
        );
        await Promise.all([loadModules, registerSynthSounds(), registerSoundfonts()]);
      }
    });

    globalEditor.setCode(getProcessedTune());
  }, []);

  useEffect(() => {
    if (state === "play" && globalEditor) {
      const tune = getProcessedTune();
      globalEditor.stop?.();
      globalEditor.setCode(tune);
      globalEditor.evaluate();
    }
  }, [volume, speed, instruments, state]);

  useEffect(() => {
    if (!globalEditor) return;
    const tune = getProcessedTune();
    globalEditor.setCode(tune);
  }, [procText]);

  return (
    <div className="demo-container py-4 px-3">
      <h2 className="text-center mb-4 fw-bold text-glow">🎛️ Strudel Demo Workstation</h2>
      <main className="container-fluid">

        {/* Top row: Piano Roll + Controls */}
        <div className="row mb-3 accordion-row" style={{ alignItems: 'flex-start' }}>
          {/* Piano Roll Card */}
          <div className="col-md-8 mb-2">
            <div className="glass-card">
              <h5 className="fw-semibold mb-2 accordion-header" onClick={() => toggleAccordion("pianoRoll")}>
                Piano Roll Visualizer {accordionState.pianoRoll ? '▲' : '▼'}
              </h5>
              <div
                className={`accordion-content ${accordionState.pianoRoll ? '' : 'collapsed'}`}
                style={{
                  transition: 'max-height 0.4s ease, padding 0.4s ease',
                  overflow: 'hidden',
                  padding: accordionState.pianoRoll ? '1rem' : '0'
                }}
              >
                <svg id="d3-roll" className="w-100 rounded shadow-sm" style={{ height: '300px' }} />
              </div>
            </div>
          </div>

          {/* Controls Card */}
          <div className="col-md-4 mb-2">
            <div className="glass-card">
              <h5 className="fw-semibold mb-3 accordion-header" onClick={() => toggleAccordion("controls")}>
                Controls {accordionState.controls ? '▲' : '▼'}
              </h5>
              <div
                className={`accordion-content ${accordionState.controls ? '' : 'collapsed'}`}
                style={{
                  transition: 'max-height 0.4s ease, padding 0.4s ease',
                  overflow: 'hidden',
                  padding: accordionState.controls ? '1rem' : '0'
                }}
              >
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <InstrumentsTab instruments={instruments} setInstruments={setInstruments} />
                  </div>
                  <div className="col-6 d-flex flex-column gap-2">
                    <div>
                      <label className="form-label">Volume</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="form-range"
                      />
                    </div>
                    <SpeedControl
                      speed={speed}
                      onSpeed={setSpeed}
                      speeds={speedOptions}
                      setSpeeds={setSpeedOptions}
                    />
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn-play flex-1" onClick={playTune}>Play</button>
                  <button className="btn-stop flex-1" onClick={stopTune}>Stop</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row: Preprocessing + Editor */}
        <div className="row mb-4 accordion-row" style={{ alignItems: 'flex-start' }}>
          {/* Preprocessing Card */}
          <div className="col-md-6 mb-2">
            <div className="glass-card">
              <h5 className="fw-semibold mb-2 accordion-header" onClick={() => toggleAccordion("preprocessing")}>
                Preprocessing {accordionState.preprocessing ? '▲' : '▼'}
              </h5>
              <div
                className={`accordion-content ${accordionState.preprocessing ? '' : 'collapsed'}`}
                style={{
                  transition: 'max-height 0.4s ease, padding 0.4s ease',
                  overflow: 'hidden',
                  padding: accordionState.preprocessing ? '1rem' : '0'
                }}
              >
                <StrudelFileManager code={procText} onLoad={setProcText} />
                <PreprocessTextArea value={procText} onChange={setProcText} />
              </div>
            </div>
          </div>

          {/* Code Editor Card */}
          <div className="col-md-6 mb-2">
            <div className="glass-card">
              <h5 className="fw-semibold mb-2 accordion-header" onClick={() => toggleAccordion("editor")}>
                Code Editor {accordionState.editor ? '▲' : '▼'}
              </h5>
              <div
                className={`accordion-content ${accordionState.editor ? '' : 'collapsed'}`}
                style={{
                  transition: 'max-height 0.4s ease, padding 0.4s ease',
                  overflow: 'hidden',
                  padding: accordionState.editor ? '1rem' : '0'
                }}
              >
                <div id="editor" className="editor-box" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
