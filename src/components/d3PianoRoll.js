// src/utils/d3PianoRoll.js
import * as d3 from "d3";
import { noteToMidi, freqToMidi } from "@strudel/core";

/**
 * General MIDI drum map (core subset)
 * extend as you like
 */
const GM_DRUM_MAP = {
  kick: 36, bd: 36, bass: 36, kickdrum: 36,
  sn: 38, snare: 38, sd: 38, snr: 38,
  chh: 42, ch: 42, hh: 42, hihat: 42, "closed-hh": 42,
  oh: 46, ohh: 46, "open-hh": 46,
  crash: 49, ride: 51, tomlow: 41, tommid: 45, tomhi: 50, clap: 39,
  cp: 39, rim: 51, rimshot: 51,
  psr: 50 // fallback for synth/drum-like names
};

function mapSampleNameToGM(sname = "") {
  if (!sname || typeof sname !== "string") return null;
  const key = sname.toLowerCase().replace(/[^a-z0-9]/g, "");
  return GM_DRUM_MAP[key] ?? null;
}

// Extract numeric MIDI or category from a hap (safe)
function getMidiOrCategory(hap) {
  const v = (hap.value ?? {});
  const { note, n, freq, s } = v;

  // 1) frequency -> midi
  if (freq !== undefined && freq !== null) {
    try { return { type: "midi", value: Number(freqToMidi(freq)) }; } catch { /* fallthrough */ }
  }

  // 2) numeric n -> midi (may be BigInt or number)
  if (n !== undefined && n !== null) {
    try { return { type: "midi", value: Number(n) }; } catch { /* fallthrough */ }
  }

  // 3) named note string
  if (typeof note === "string") {
    try { return { type: "midi", value: Number(noteToMidi(note)) }; } catch { /* fallthrough */ }
  }

  // 4) sample/instrument name s -> drum lane (GM)
  if (typeof s === "string") {
    const gm = mapSampleNameToGM(s);
    if (gm !== null) return { type: "midi", value: gm, label: s };
    // else treat as instrument label placed at a midi lane for visibility
    return { type: "instrument", value: s };
  }

  // fallback unknown
  return { type: "unknown", value: null };
}

/**
 * drawD3Haps
 * @param {Array} haps - array of Strudel haps
 * @param {number} time - current time (seconds)
 * @param {Array} drawTime - [lookbehind, lookahead] (seconds) e.g. [-2, 2]
 * @param {Object} opts - visual options
 */
export function drawD3Haps(haps = [], time = 0, drawTime = [-2, 2], opts = {}) {
  const {
    svgId = "#d3-roll",
    noteHeight = 10,
    noteRadius = 3,
    neonMelodic = "#7bf",   // melodic glow
    neonDrum = "#ff6a00",   // drum glow
    bg = "#07060a",
    gridColor = "#111217",
    labelColor = "#e6f7ff",
    showLabels = true,
  } = opts;

  const svg = d3.select(svgId);
  if (!svg.node()) return;

  // ensure an explicit height (fallback)
  const width = svg.node().clientWidth || 800;
  const height = svg.node().clientHeight || 240;

  // compute time domain absolute from current time + offsets
  const t0 = time + drawTime[0];
  const t1 = time + drawTime[1];

  const xScale = d3.scaleLinear().domain([t0, t1]).range([0, width]).clamp(true);

  // convert haps to draw-ready objects
  const prepared = haps.map(hap => {
    // prefer hap.whole.* (Strudel internal), fallback to hap.begin/hap.end
    const begin = (hap.whole && hap.whole.begin !== undefined) ? Number(hap.whole.begin) : (hap.begin ?? 0);
    const end = (hap.whole && hap.whole.end !== undefined) ? Number(hap.whole.end) : (hap.end ?? (begin + (hap.duration ?? 0.25)));
    const dur = Math.max(0, (end - begin) || (hap.duration || 0.25));
    const pitchInfo = getMidiOrCategory(hap);

    return {
      raw: hap,
      start: Number(begin),
      end: Number(end),
      duration: dur,
      pitchInfo, // {type, value, label?}
    };
  });

  // figure Y domain from numeric midi values (include drums mapped to GM)
  const midiVals = prepared
    .map(p => (p.pitchInfo && p.pitchInfo.type === "midi") ? p.pitchInfo.value : null)
    .filter(v => v !== null && !Number.isNaN(v));

  // default range if empty
  const minMidi = (midiVals.length ? d3.min(midiVals) - 2 : 36);
  const maxMidi = (midiVals.length ? d3.max(midiVals) + 2 : 84);

  const yScale = d3.scaleLinear().domain([minMidi, maxMidi]).range([height - noteHeight, 0]);

  // clear & background
  svg.selectAll("*").remove();
  svg.attr("viewBox", `0 0 ${width} ${height}`);

  // background rect
  svg.append("rect")
    .attr("x", 0).attr("y", 0).attr("width", width).attr("height", height)
    .attr("fill", bg);

  // subtle grid lines for MIDI rows
  const midiStep = 1;
  const rows = d3.range(Math.floor(minMidi), Math.ceil(maxMidi) + 1, midiStep);
  const grid = svg.append("g").attr("class", "d3-grid");
  grid.selectAll("line")
    .data(rows)
    .join("line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", d => yScale(d) + noteHeight / 2)
    .attr("y2", d => yScale(d) + noteHeight / 2)
    .attr("stroke", gridColor)
    .attr("stroke-width", 0.5)
    .attr("opacity", 0.5);

  // defs for neon filters
  const defs = svg.append("defs");
  defs.append("filter")
    .attr("id", "neon-glow-melodic")
    .append("feGaussianBlur")
    .attr("stdDeviation", 6)
    .attr("result", "coloredBlur");
  defs.append("filter")
    .attr("id", "neon-glow-drum")
    .append("feGaussianBlur")
    .attr("stdDeviation", 6)
    .attr("result", "coloredBlur");

  // draw notes
  const notes = svg.append("g").attr("class", "d3-notes");

  const noteNodes = notes.selectAll("g.note")
    .data(prepared.filter(d => d.pitchInfo && (d.pitchInfo.type === "midi" || d.pitchInfo.type === "instrument")))
    .join("g")
    .attr("class", "note")
    .attr("transform", d => `translate(${xScale(d.start)}, ${yScale(d.pitchInfo.type === "midi" ? d.pitchInfo.value : (minMidi))})`);

  // rects
  noteNodes.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", d => Math.max(2, xScale(d.end) - xScale(d.start)))
    .attr("height", noteHeight)
    .attr("rx", noteRadius)
    .attr("ry", noteRadius)
    .attr("fill", d => (d.pitchInfo.type === "midi" && d.pitchInfo.value >= 35 && d.pitchInfo.value <= 81 && Number.isFinite(d.pitchInfo.value))
                      ? neonMelodic
                      : neonDrum)
    .attr("opacity", 0.95)
    .attr("filter", d => (d.pitchInfo.type === "midi" ? "url(#neon-glow-melodic)" : "url(#neon-glow-drum)"))
    .attr("stroke", d => d.pitchInfo.type === "midi" ? neonMelodic : neonDrum)
    .attr("stroke-width", 0.6);

  // labels
  if (showLabels) {
    noteNodes.append("text")
      .text(d => {
        if (d.pitchInfo.type === "midi") return d.raw.value?.note ?? d.raw.value?.n ?? d.pitchInfo.value;
        if (d.pitchInfo.type === "instrument") return d.pitchInfo.value;
        return "";
      })
      .attr("x", 4)
      .attr("y", noteHeight / 1.6)
      .attr("font-size", Math.max(10, noteHeight * 0.9))
      .attr("fill", labelColor)
      .attr("pointer-events", "none");
  }

  // draw playhead (center)
  svg.append("line")
    .attr("x1", xScale(time))
    .attr("x2", xScale(time))
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "#fff")
    .attr("stroke-width", 1)
    .attr("opacity", 0.9);

  // optional: return prepared for testing / debugging
  return prepared;
}
