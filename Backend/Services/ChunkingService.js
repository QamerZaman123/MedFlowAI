/**
 * Regular expressions to detect section titles/numbers in clinical documents
 */
const SECTION_PATTERNS = [
  /^(?:Section\s+)?(\d+(?:\.\d+)*\s*[:.-]?\s+[^\n\r]+)/im,
  /^(?:Chapter\s+)?(\d+\s*[:.-]?\s+[^\n\r]+)/im,
  /^(#{1,4}\s+[^\n\r]+)/im,
  /^([A-Z][A-Z0-9\s,-]{3,50}:)/m,
];

/**
 * Detects section title from text lines
 */
const detectSection = (text, currentSection = "General") => {
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    for (const pattern of SECTION_PATTERNS) {
      const match = trimmed.match(pattern);
      if (match && match[1]) {
        return match[1].replace(/^#+\s*/, "").trim();
      }
    }
  }
  return currentSection;
};

/**
 * Splits text into sentence/paragraph aware chunks with overlap
 * @param {Array<{ pageNumber: number, text: string }>} pages
 * @param {Object} options
 * @param {number} [options.chunkSize=800] - Target character size per chunk
 * @param {number} [options.overlap=150] - Character overlap between consecutive chunks
 * @returns {Array<{ chunkText: string, page: number, section: string, chunkIndex: number }>}
 */
export const chunkText = (pages, { chunkSize = 800, overlap = 150 } = {}) => {
  const chunks = [];
  let globalChunkIndex = 0;
  let currentSection = "General";

  for (const pageObj of pages) {
    const pageNumber = pageObj.pageNumber || 1;
    const pageText = (pageObj.text || "").trim();

    if (!pageText) continue;

    // Check if the page starts with a new section
    currentSection = detectSection(pageText, currentSection);

    // Split page text into paragraphs first
    const paragraphs = pageText
      .split(/\r?\n\s*\r?\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    let currentChunkBuffer = "";

    for (const para of paragraphs) {
      // Update section if this paragraph defines a new section
      currentSection = detectSection(para, currentSection);

      if ((currentChunkBuffer + "\n\n" + para).length <= chunkSize) {
        currentChunkBuffer = currentChunkBuffer ? `${currentChunkBuffer}\n\n${para}` : para;
      } else {
        // If the paragraph itself is huge, split it by sentences
        if (para.length > chunkSize) {
          const sentences = para.split(/(?<=[.?!])\s+/);
          for (const sentence of sentences) {
            if ((currentChunkBuffer + " " + sentence).length <= chunkSize) {
              currentChunkBuffer = currentChunkBuffer ? `${currentChunkBuffer} ${sentence}` : sentence;
            } else {
              if (currentChunkBuffer.trim().length > 0) {
                chunks.push({
                  chunkText: currentChunkBuffer.trim(),
                  page: pageNumber,
                  section: currentSection,
                  chunkIndex: globalChunkIndex++,
                });

                // Overlap calculation
                const overlapText = currentChunkBuffer.slice(Math.max(0, currentChunkBuffer.length - overlap));
                currentChunkBuffer = `${overlapText} ${sentence}`.trim();
              } else {
                currentChunkBuffer = sentence;
              }
            }
          }
        } else {
          // Push existing buffer as a chunk
          if (currentChunkBuffer.trim().length > 0) {
            chunks.push({
              chunkText: currentChunkBuffer.trim(),
              page: pageNumber,
              section: currentSection,
              chunkIndex: globalChunkIndex++,
            });

            // Carry over overlap
            const overlapText = currentChunkBuffer.slice(Math.max(0, currentChunkBuffer.length - overlap));
            currentChunkBuffer = `${overlapText}\n\n${para}`.trim();
          } else {
            currentChunkBuffer = para;
          }
        }
      }
    }

    // Flush any remaining text for the page
    if (currentChunkBuffer.trim().length > 0) {
      chunks.push({
        chunkText: currentChunkBuffer.trim(),
        page: pageNumber,
        section: currentSection,
        chunkIndex: globalChunkIndex++,
      });
    }
  }

  return chunks;
};

export default {
  chunkText,
};
