import './App.css';
import { useEffect, useRef } from "react";
import { StrudelMirror } from '@strudel/codemirror';
import { evalScope } from '@strudel/core';
//import { drawPianoroll } from '@strudel/draw';
import { initAudioOnFirstClick } from '@strudel/webaudio';
import { transpiler } from '@strudel/transpiler';
import { getAudioContext, webaudioOutput, registerSynthSounds } from '@strudel/webaudio';
import { registerSoundfonts } from '@strudel/soundfonts';
import { stranger_tune } from './tunes';
import console_monkey_patch, { getD3Data } from './console-monkey-patch';
import DJControls from './components/DJControls';
import PlayButton from './components/PlayButton';
import ProcButtons from './components/ProcButtons';
import PreprocessTextArea from './components/PreprocessTextarea';
import { drawD3Haps } from './utils/d3PianoRoll';

let globalEditor = null;

const handleD3Data = (event) => {
    console.log(event.detail);
};

export function SetupButtons() {

    document.getElementById('play').addEventListener('click', () => globalEditor.evaluate());
    document.getElementById('stop').addEventListener('click', () => globalEditor.stop());
    document.getElementById('process').addEventListener('click', () => {
        Proc()
    }
    )
    document.getElementById('process_play').addEventListener('click', () => {
        if (globalEditor != null) {
            Proc()
            globalEditor.evaluate()
        }
    }
    )
}



export function ProcAndPlay() {
    if (globalEditor != null && globalEditor.repl.state.started === true) {
        console.log(globalEditor)
        Proc()
        globalEditor.evaluate();
    }
}

export function Proc() {

    let proc_text = document.getElementById('proc').value
    let proc_text_replaced = proc_text.replaceAll('<p1_Radio>', ProcessText);
    ProcessText(proc_text);
    globalEditor.setCode(proc_text_replaced)
}

export function ProcessText(match, ...args) {

    let replace = ""
    if (document.getElementById('flexRadioDefault2').checked) {
        replace = "_"
    }

    return replace
}

export default function StrudelDemo() {

const hasRun = useRef(false);

useEffect(() => {

    if (!hasRun.current) {
        document.addEventListener("d3Data", handleD3Data);
        console_monkey_patch();
        hasRun.current = true;
            const drawTime = [-2, 2]; // time window of drawn haps

            globalEditor = new StrudelMirror({
                defaultOutput: webaudioOutput,
                getTime: () => getAudioContext().currentTime,
                transpiler,
                root: document.getElementById('editor'),
                drawTime,
                onDraw: (haps, time) => {
                    try {
                    drawD3Haps(haps, time, drawTime, {
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
                    initAudioOnFirstClick(); // needed to make the browser happy (don't await this here..)
                    const loadModules = evalScope(
                        import('@strudel/core'),
                        import('@strudel/draw'),
                        import('@strudel/mini'),
                        import('@strudel/tonal'),
                        import('@strudel/webaudio'),
                    );
                    await Promise.all([loadModules, registerSynthSounds(), registerSoundfonts()]);
                },
            });
            
        document.getElementById('proc').value = stranger_tune
        SetupButtons()
        Proc()
    }

}, []);


return (
  <div className="demo-container animated-gradient-bg text-light py-4 px-3">
    <h2 className="text-center mb-4 fw-bold text-glow">🎛️ Strudel Demo Workstation</h2>
    <main className="container-fluid">
      <div className="row mb-4">
        {/* Preprocessing & Controls */}
        <div className="col-md-8">
          <div className="glass-card p-3 mb-3">
            <h5 className="fw-semibold mb-2">Preprocessing</h5>
            <PreprocessTextArea />
          </div>
        </div>
        <div className="col-md-4">
          <div className="glass-card p-3">
            <h5 className="fw-semibold mb-3">Controls</h5>
            <ProcButtons />
            <PlayButton />
            <hr className="divider" />
            <DJControls />
          </div>
        </div>
      </div>

      {/* Editor + Visual Output */}
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
            <svg id="d3-roll" className="w-100 rounded shadow-sm" style={{height:'400px'}}></svg>
          </div>
        </div>
      </div>
    </main>
  </div>
);


}