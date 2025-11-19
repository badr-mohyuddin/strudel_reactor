// src/utils/d3PianoRoll.js
import * as d3 from "d3";
import { noteToMidi, freqToMidi } from "@strudel/core";

const GM_DRUM_MAP = {
  kick: 36, bd: 36, bass: 36, kickdrum: 36,
  sn: 38, snare: 38, sd: 38, snr: 38,
  chh: 42, ch: 42, hh: 42, hihat: 42, "closed-hh": 42,
  oh: 46, ohh: 46, "open-hh": 46,
  crash: 49, ride: 51, tomlow: 41, tommid: 45, tomhi: 50, clap: 39,
  cp: 39, rim: 51, rimshot: 51,
  psr: 50
};

function mapSampleNameToGM(sname = "") {
  if (!sname || typeof sname !== "string") return null;
  const key = sname.toLowerCase().replace(/[^a-z0-9]/g, "");
  return GM_DRUM_MAP[key] ?? null;
}

function getMidiOrCategory(hap) {
  const v = hap.value ?? {};
  const { note, n, freq, s } = v;

  if (freq != null) return { type: "midi", value: Number(freqToMidi(freq)) };
  if (n != null) return { type: "midi", value: Number(n) };
  if (typeof note === "string") return { type: "midi", value: Number(noteToMidi(note)) };
  if (typeof s === "string") {
    const gm = mapSampleNameToGM(s);
    if (gm != null) return { type: "midi", value: gm, label: s };
    return { type: "instrument", value: s };
  }

  return { type: "unknown", value: null };
}

export function drawD3Haps(haps = [], time = 0, drawTime = [-2, 2], opts = {}) {
  const {
    svgId = "#d3-roll",
    noteHeight = 12,
    noteRadius = 3,
    neonMelodic = "#00FFC3",
    neonDrum = "#3CB6B6",
    bg = "#0B0C10",
    gridColor = "#1A2B3C",
    labelColor = "#E0F7FA",
    showLabels = true,
  } = opts;

  const svg = d3.select(svgId);
  if (!svg.node()) return;

  // Use the actual container height
  const svgContainer = document.querySelector(svgId);
  const rect = svgContainer.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height; 

  // Compute time domain
  const t0 = time + drawTime[0];
  const t1 = time + drawTime[1];
  const xScale = d3.scaleLinear().domain([t0, t1]).range([0, width]).clamp(true);

  // Prepare haps
  const prepared = haps.map(hap => {
    const begin = hap.whole?.begin ?? hap.begin ?? 0;
    const end = hap.whole?.end ?? hap.end ?? (begin + (hap.duration ?? 0.25));
    const dur = Math.max(0, end - begin);
    const pitchInfo = getMidiOrCategory(hap);
    return { raw: hap, start: Number(begin), end: Number(end), duration: dur, pitchInfo };
  });

  // Y scale (dynamic to container height)
  const midiVals = prepared
    .map(p => p.pitchInfo?.type === "midi" ? p.pitchInfo.value : null)
    .filter(v => v != null);

  const minMidi = midiVals.length ? d3.min(midiVals) - 2 : 36;
  const maxMidi = midiVals.length ? d3.max(midiVals) + 2 : 84;

  const yScale = d3.scaleLinear().domain([minMidi, maxMidi]).range([height - noteHeight, 0]);

  // Clear SVG
  svg.selectAll("*").remove();
  svg.attr("width", width)
   .attr("height", height)
   .attr("viewBox", `0 0 ${width} ${height}`);

  // Background
  svg.append("rect").attr("x", 0).attr("y", 0).attr("width", width).attr("height", height).attr("fill", bg);

  // Grid lines
  const rows = d3.range(Math.floor(minMidi), Math.ceil(maxMidi) + 1, 1);
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

  // Filters for neon glow
  const defs = svg.append("defs");
  defs.append("filter").attr("id", "neon-glow-melodic").append("feGaussianBlur").attr("stdDeviation", 6);
  defs.append("filter").attr("id", "neon-glow-drum").append("feGaussianBlur").attr("stdDeviation", 6);

  // Notes
  const notes = svg.append("g").attr("class", "d3-notes");

  const noteNodes = notes.selectAll("g.note")
    .data(prepared.filter(d => d.pitchInfo?.type === "midi" || d.pitchInfo?.type === "instrument"))
    .join("g")
    .attr("class", "note")
    .attr("transform", d => `translate(${xScale(d.start)}, ${yScale(d.pitchInfo.type === "midi" ? d.pitchInfo.value : minMidi)})`);

  noteNodes.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", d => Math.max(2, xScale(d.end) - xScale(d.start)))
    .attr("height", noteHeight)
    .attr("rx", noteRadius)
    .attr("ry", noteRadius)
    .attr("fill", d => d.pitchInfo.type === "midi" ? neonMelodic : neonDrum)
    .attr("stroke", d => d.pitchInfo.type === "midi" ? neonMelodic : neonDrum)
    .attr("stroke-width", 0.6)
    .attr("opacity", 0.95)
    .attr("filter", d => d.pitchInfo.type === "midi" ? "url(#neon-glow-melodic)" : "url(#neon-glow-drum)");

  if (showLabels) {
    noteNodes.append("text")
      .text(d => d.pitchInfo.type === "midi" ? (d.raw.value?.note ?? d.raw.value?.n ?? d.pitchInfo.value) : d.pitchInfo.value)
      .attr("x", 4)
      .attr("y", noteHeight / 1.6)
      .attr("font-size", Math.max(10, noteHeight * 0.9))
      .attr("fill", labelColor)
      .attr("pointer-events", "none");
  }

  // Playhead
  svg.append("line")
    .attr("x1", xScale(time))
    .attr("x2", xScale(time))
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "#fff")
    .attr("stroke-width", 1)
    .attr("opacity", 0.9);
}
