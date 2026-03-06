function cleanText(text) {
  // Remove page numbers
  text = text.replace(/\n\s*Page\s+\d+\s*\n/gi, "\n");
  text = text.replace(/\n\s*\d+\s*\n/g, "\n");

  // Remove repeated separators
  text = text.replace(/_{3,}|-{3,}|\*{3,}/g, "");

  // Fix hyphenated line breaks
  text = text.replace(/-\n/g, "");

  // Normalize newlines
  text = text.replace(/\r\n/g, "\n");

  const lines = text.split("\n");
  const cleaned = [];

  for (let line of lines) {
    line = line.trim();

    if (!line) {
      cleaned.push("");
      continue;
    }

    if (
      cleaned.length &&
      cleaned[cleaned.length - 1] &&
      !/[.!?:]$/.test(cleaned[cleaned.length - 1]) &&
      !/^[-•*–]/.test(line)
    ) {
      cleaned[cleaned.length - 1] += " " + line;
    } else {
      cleaned.push(line);
    }
  }

  text = cleaned.join("\n");

  // Normalize spaces
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

module.exports = { cleanText };
