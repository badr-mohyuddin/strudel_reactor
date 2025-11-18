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
import ControlsPanel from './components/ControlsPanel';
import PreprocessTextArea from './components/PreprocessTextarea';
import ProcButtons from './components/ProcButtons';
import PlayButton from './components/PlayButton';
import { Preprocess } from './utils/PreprocessLogic';

let globalEditor = null;

export default function StrudelDemo() {
  const hasRun = useRef(false);

  // --- States ---
  const [procText, setProcText] = useState(stranger_tune);

  const [volume, setVolume] = useState(0.5);
  const [speed, setSpeed] = useState(1);

  const [melodyOn, setMelodyOn] = useState(true);
  const [drumsOn, setDrumsOn] = useState(true);
  const [chordsOn, setChordsOn] = useState(true);
  const [bassOn, setBassOn] = useState(true);
  const [extraOn, setExtraOn] = useState(true);

  const [space, setSpace] = useState(0.3);
  const [bright, setBright] = useState(0.5);
  const [width, setWidth] = useState(0.5);
  const [chordLen, setChordLen] = useState(0.7);

  const [drumKit, setDrumKit] = useState(0);
  const [melodyStyle, setMelodyStyle] = useState(0);
  const [section, setSection] = useState(0);

  // --- Preprocessing / Proc ---
  const Proc = (doPlay = false) => {
    if (!globalEditor) return;

    const tune = Preprocess({
      inputText: procText || stranger_tune,
      volume,
      speed,
      melodyOn,
      drumsOn,
      chordsOn,
      bassOn,
      extraOn,
      space,
      bright,
      width,
      chordLen,
      drumKit,
      melodyStyle,
      section
    });

    if (!tune || !tune.trim()) {
      console.warn("No code to evaluate — tune is empty");
      return;
    }

    // Update editor
    globalEditor.setCode(tune);

    // Live updates
    globalEditor.setVolume?.(volume);
    globalEditor.setFX?.({ space, bright, width, chordLen });
    globalEditor.setInstrumentEnabled?.('melody', melodyOn);
    globalEditor.setInstrumentEnabled?.('drums', drumsOn);
    globalEditor.setInstrumentEnabled?.('chords', chordsOn);
    globalEditor.setInstrumentEnabled?.('bass', bassOn);
    globalEditor.setInstrumentEnabled?.('extra', extraOn);
    globalEditor.setDrumKit?.(drumKit);
    globalEditor.setMelodyStyle?.(melodyStyle);
    globalEditor.setSection?.(section);

    if (doPlay) globalEditor.evaluate();
  };

  const procAndPlay = () => Proc(true);

  // --- Initialize StrudelMirror editor ---
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
            neonMelodic: '#4DF0FF',
            neonDrum: '#FF7B3A',
            bg: '#05040a',
            gridColor: '#0f0f12',
            labelColor: '#e6f7ff',
            showLabels: true
          });
        } catch (err) {
          console.warn("D3 piano-roll draw error:", err);
        }
      },
      prebake: async () => {
        initAudioOnFirstClick();
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

    // Load initial tune
    Proc();
  }, []);

  // --- Live parameter updates ---
  useEffect(() => {
    if (!globalEditor) return;
    Proc(); // update editor whenever any control changes
  }, [
    procText,
    volume, speed,
    melodyOn, drumsOn, chordsOn, bassOn, extraOn,
    space, bright, width, chordLen,
    drumKit, melodyStyle, section
  ]);

  return (
    <div className="demo-container animated-gradient-bg text-light py-4 px-3">
      <h2 className="text-center mb-4 fw-bold text-glow">🎛️ Strudel Demo Workstation</h2>
      <main className="container-fluid">
        <div className="row mb-4">
          {/* Preprocessing */}
          <div className="col-md-8">
            <div className="glass-card p-3 mb-3">
              <h5 className="fw-semibold mb-2">Preprocessing</h5>
              <PreprocessTextArea value={procText} onChange={setProcText} />
            </div>
          </div>
          {/* Controls Panel */}
          <div className="col-md-4">
            <div className="glass-card p-3">
              <h5 className="fw-semibold mb-3">Controls</h5>
              <ControlsPanel
                disabled={false}
                volume={volume} onVolume={setVolume}
                speed={speed} onSpeed={setSpeed}
                melodyOn={melodyOn} onMelody={setMelodyOn}
                drumsOn={drumsOn} onDrums={setDrumsOn}
                chordsOn={chordsOn} onChords={setChordsOn}
                bassOn={bassOn} onBass={setBassOn}
                extraOn={extraOn} onExtra={setExtraOn}
                space={space} onSpace={setSpace}
                bright={bright} onBright={setBright}
                width={width} onWidth={setWidth}
                chordLen={chordLen} onChordLen={setChordLen}
                drumKit={drumKit} onDrumKit={setDrumKit}
                melodyStyle={melodyStyle} onMelodyStyle={setMelodyStyle}
                section={section} onSection={setSection}
              />
              <hr className="divider" />
              <ProcButtons proc={Proc} procAndPlay={procAndPlay} />
              <PlayButton
                evaluate={() => { initAudioOnFirstClick(); globalEditor?.evaluate(); }}
                stop={() => globalEditor?.stop()}
              />
            </div>
          </div>
        </div>

        {/* Editor + Piano Roll */}
        <div className="row">
          <div className="col-md-8">
            <div className="glass-card p-3 mb-3">
              <h5 className="fw-semibold mb-2">Code Editor</h5>
              <div id="editor" className="editor-box mb-3" />
              <div id="output" />
            </div>
          </div>
          <div className="col-md-4">
            <div className="glass-card p-3">
              <h5 className="fw-semibold mb-2">Piano Roll Visualizer</h5>
              <svg id="d3-roll" className="w-100 rounded shadow-sm" style={{ height: '400px' }} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
