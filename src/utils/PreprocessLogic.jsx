export function Preprocess({
  inputText = "",
  volume = 1,
  speed = 1,
  melodyOn = true,
  drumsOn = true,
  chordsOn = true,
  bassOn = true,
  extraOn = true,
  space = 0.5,
  bright = 0.5,
  width = 0.5,
  chordLen = 0.5,
  drumKit = 0,
  melodyStyle = 0,
  section = 0
}) {
  let outputText = inputText;

  // --- Multiply gain() values except postgain() ---
  outputText = outputText.replace(/([a-zA-Z]*)gain\(([0-9.]+)\)/g, (full, prefix, val) => {
    if (prefix === "post") return full;     // skip postgain()
    return `${prefix}gain(${parseFloat(val) * volume})`;
  });

  // --- Comment out instruments based on toggles ---
  // --- Comment out entire instrument lines dynamically ---
if (!melodyOn)
  outputText = outputText.replace(/^(\s*)main_arp\d*:/gm, `$1//main_arp:`);

if (!drumsOn)
  outputText = outputText.replace(/^(\s*)drums\d*:/gm, `$1//drums:`);

if (!chordsOn)
  outputText = outputText.replace(/^(\s*)chords\d*:/gm, `$1//chords:`);

if (!bassOn)
  outputText = outputText.replace(/^(\s*)bassline\d*:/gm, `$1//bassline:`);

if (!extraOn)
  outputText = outputText.replace(/^(\s*)drums2\d*:/gm, `$1//drums2:`);

  // --- Multiply existing setcps(...) by speed ---
  outputText = outputText.replace(/setcps\(([^)]+)\)/g, (_, val) => {
    return `setcps(${val} * ${speed})`;
  });

  // --- Replace other globals ---
  outputText = outputText.replace(/\$\{SPACE\}/g, String(space));
  outputText = outputText.replace(/\$\{BRIGHT\}/g, String(bright));
  outputText = outputText.replace(/\$\{WIDTH\}/g, String(width));
  outputText = outputText.replace(/\$\{CHORD_LEN\}/g, String(chordLen));
  outputText = outputText.replace(/\$\{DRUM_KIT\}/g, String(drumKit));
  outputText = outputText.replace(/\$\{MELODY_STYLE\}/g, String(melodyStyle));
  outputText = outputText.replace(/\$\{SECTION\}/g, String(section));

  return outputText;
}
