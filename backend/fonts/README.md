# PDF Unicode Font (Cyrillic Support)

To render Russian (Cyrillic) text in generated PDF reports, FPDF needs a
Unicode TrueType font. This project is configured to use DejaVu Sans if
available.

Steps:

1) Download the font (DejaVu Sans):
   - https://dejavu-fonts.github.io/ (DejaVuSans.ttf)

2) Place the TTF file here:
   - backend/fonts/DejaVuSans.ttf

3) Restart the Flask backend.

Behavior:
- If the font is present, PDFs include Cyrillic text correctly.
- If the font is missing, the server logs a warning and still generates a
  PDF, but non‑Latin characters may be stripped in the PDF output.

This setup avoids crashes during PDF generation and ensures readable
Russian text when the font is installed.
