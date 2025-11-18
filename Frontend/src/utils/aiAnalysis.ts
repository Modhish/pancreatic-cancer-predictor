// Helpers for AI explanation parsing and guideline links

export interface GuidelineLink {
  label: string;
  href: string;
}

export const GUIDELINE_LINKS: GuidelineLink[] = [
  {
    label: "NCCN v2.2024",
    href: "https://www.nccn.org/professionals/physician_gls/pdf/pancreatic.pdf",
  },
  {
    label: "ASCO 2023",
    href: "https://ascopubs.org/doi/full/10.1200/JCO.23.00000",
  },
  {
    label: "ESMO 2023",
    href: "https://www.esmo.org/guidelines/gastrointestinal-cancers/pancreatic-cancer",
  },
  {
    label: "CAPS 2020",
    href: "https://gut.bmj.com/content/69/1/7",
  },
  {
    label: "AGA 2020",
    href: "https://www.gastrojournal.org/article/S0016-5085(20)30094-6/fulltext",
  },
];

// Heuristic fix for mojibake (UTF-8 read as Latin-1 and re-encoded)
export const fixMojibake = (s: string): string => {
  try {
    if (!/[A��'A,A?A��'A��,�Eo][\u0080-\u00BF]/.test(s)) return s;
    const bytes = new Uint8Array([...s].map((ch) => ch.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder("utf-8").decode(bytes);
    return decoded;
  } catch {
    return s;
  }
};

export interface ParsedAiSection {
  title: string;
  bullets: string[];
  paragraphs: string[];
}

export interface ParsedAiAnalysis {
  header: string;
  subtitle: string | null;
  sections: ParsedAiSection[];
  footer: { title: string; text: string } | null;
}

export const parseAiAnalysis = (text: unknown): ParsedAiAnalysis | null => {
  if (!text || typeof text !== "string") {
    return null;
  }

  const safeText = (function repairTextEncoding(s) {
    try {
      if (!s || typeof s !== "string") return s;
      const suspicious = /[\u00C3\u00C2\u00D0\u00D1]/.test(s);
      const toBytes = (str) =>
        new Uint8Array([...str].map((ch) => ch.charCodeAt(0) & 0xff));
      const countCyr = (str) =>
        (str.match(/[\u0400-\u04FF]/g) || []).length;
      const countGib = (str) =>
        (str.match(/[\u00C3\u00C2\u00D0\u00D1]/g) || []).length;
      let out = s;
      for (let i = 0; i < 3 && suspicious.test(out); i++) {
        const decoded = new TextDecoder("utf-8").decode(toBytes(out));
        if (countCyr(decoded) > countCyr(out) || countGib(out) > 0) {
          out = decoded;
        } else {
          break;
        }
      }
      return out;
    } catch {
      return s;
    }
  })(text);

  const lines = safeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!lines.length) {
    return null;
  }

  const headingPattern =
    /^[A-Za-z\u0400-\u04FF0-9][A-Za-z\u0400-\u04FF0-9\s&|\u00B7\-\.,:\/]+$/;
  const bulletPattern = /^[-\u2022\u25CF]\s+/;
  const RU_NAPOMINANIE = String.fromCharCode(
    0x041d,
    0x0410,
    0x041f,
    0x041e,
    0x041c,
    0x0418,
    0x041d,
    0x0410,
    0x041d,
    0x0418,
    0x0415,
  );
  const RU_PAMYATKA = String.fromCharCode(
    0x041f,
    0x0410,
    0x041c,
    0x042f,
    0x0422,
    0x041a,
    0x0410,
  );
  const footerMarkers = ["REMINDER", RU_NAPOMINANIE, RU_PAMYATKA];

  const header = lines.shift();
  if (!header) {
    return null;
  }

  let subtitle = null;
  if (lines.length && lines[0].includes(":")) {
    subtitle = lines.shift();
  }

  const sections = [];
  let current = null;

  const pushCurrent = () => {
    if (current && current.lines.length > 0) {
      sections.push(current);
    }
  };

  lines.forEach((line) => {
    if (headingPattern.test(line)) {
      pushCurrent();
      current = { title: line, lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  });
  pushCurrent();

  if (!sections.length) {
    return null;
  }

  const parsedSections = [];
  let footer = null;

  sections.forEach((section) => {
    const bullets = [];
    const paragraphs = [];

    section.lines.forEach((contentLine) => {
      if (bulletPattern.test(contentLine)) {
        bullets.push(contentLine.replace(bulletPattern, "").trim());
      } else {
        paragraphs.push(contentLine);
      }
    });

    const normalizedTitle = section.title.trim();
    if (footerMarkers.some((marker) => normalizedTitle.includes(marker))) {
      const footerText = [...paragraphs, ...bullets].join(" ");
      footer = {
        title: normalizedTitle,
        text: footerText,
      };
    } else {
      parsedSections.push({
        title: normalizedTitle,
        bullets,
        paragraphs,
      });
    }
  });

  return {
    header,
    subtitle,
    sections: parsedSections,
    footer,
  };
};
