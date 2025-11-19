export function Preprocess({
  inputText = "",
  volume = 1,
  speed = 1,
  instruments = [], // array of {id, label, enabled}
}) {
  // --- Multiply gain() by global volume ---
  let code = inputText.replace(/([a-zA-Z]*)gain\(([0-9.]+)\)/g, (full, prefix, val) => {
    if (prefix === "post") return full;
    return `${prefix}gain(${parseFloat(val) * volume})`;
  });

  // --- Multiply setcps by speed ---
  code = code.replace(/setcps\(([^)]+)\)/g, (_, val) => `setcps(${val} * ${speed})`);

  // --- Append .hush() at the end of disabled instrument blocks ---
  const lines = code.split("\n");
  const out = [];

  let inside = null;         // instrument id we are inside, or null
  let parens = 0;            // parentheses depth
  let seenParen = false;     // whether we encountered any parentheses inside block
  let blockStartIndex = -1;  // index in out where block started

  // helper to finish a block: append hush to last non-empty line of the block
  function finishBlock() {
    if (inside === null || blockStartIndex < 0) return;
    // find last non-empty line index in out starting from blockStartIndex
    for (let i = out.length - 1; i >= blockStartIndex; i--) {
      if (/\S/.test(out[i])) {
        const lastLine = out[i];
        // don't add if already has .hush
        if (/\.hush\s*\(?\s*\)?\s*$/.test(lastLine)) {
          break;
        }
        // insert .hush() before trailing punctuation (comma/semicolon/whitespace)
        const m = lastLine.match(/^(.*?)([\s,;]*)$/s);
        const base = m ? m[1] : lastLine;
        const trail = m ? m[2] : "";
        out[i] = base + ".hush()" + trail;
        break;
      }
    }
    inside = null;
    parens = 0;
    seenParen = false;
    blockStartIndex = -1;
  }

  // helper to detect top-level definition line and return the name if present
  function detectDefinition(line) {
    // label:   (e.g. drums:)
    const mLabel = line.match(/^\s*([A-Za-z_]\w*)\s*:\s*$/);
    if (mLabel) return mLabel[1];
    // label followed by expression on same line: drums: stack(...
    const mLabelExpr = line.match(/^\s*([A-Za-z_]\w*)\s*:\s*(.*)/);
    if (mLabelExpr) return mLabelExpr[1];
    // let/const name =
    const mVar = line.match(/^\s*(?:let|const)\s+([A-Za-z_]\w*)\s*=\s*(.*)/);
    if (mVar) return mVar[1];
    return null;
  }

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    let line = rawLine;

    if (!inside) {
      // Look for a definition
      const name = detectDefinition(line);
      if (name && instruments.some(ins => !ins.enabled && ins.id === name)) {
        // Start block for disabled instrument
        inside = name;
        blockStartIndex = out.length; // where block starts in output
        // initialize parens based on this line
        const open = (line.match(/\(/g) || []).length;
        const close = (line.match(/\)/g) || []).length;
        parens = open - close;
        seenParen = open > 0;
        out.push(line);
        // If there are no parentheses at all (single-instrument chain),
        // we will treat the block as continuing until a blank line, next def, or EOF.
        // So do not finish now.
        // If parens is 0 and seenParen==true, that means the block opened and closed on same line:
        if (seenParen && parens <= 0) {
          // finish immediately (parentheses balanced on same line)
          finishBlock();
        }
        continue;
      }
      // not a disabled definition start -> just push line
      out.push(line);
      continue;
    } else {
      // We are inside a disabled instrument block
      // update parens
      const open = (line.match(/\(/g) || []).length;
      const close = (line.match(/\)/g) || []).length;
      parens += open - close;
      if (open > 0) seenParen = true;

      out.push(line);

      // If we have seen parentheses, wait for parens to return to 0
      if (seenParen) {
        if (parens <= 0) {
          finishBlock();
        }
        // otherwise keep accumulating
      } else {
        // No parens encountered in block (single-instrument chain).
        // End block when next line is blank, or next line is a top-level definition, or EOF.
        const nextLine = (idx + 1 < lines.length) ? lines[idx + 1] : null;
        const isNextBlank = nextLine === null || /^\s*$/.test(nextLine);
        const isNextDef = nextLine !== null && detectDefinition(nextLine) !== null;
        if (isNextBlank || isNextDef || nextLine === null) {
          finishBlock();
        }
      }
      continue;
    }
  }

  // if file ended while still inside a block, finish it
  if (inside) finishBlock();

  return out.join("\n");
}
