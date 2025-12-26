# PDF Unicode Font (Cyrillic Support)

To render Russian (Cyrillic) text in generated PDF reports, FPDF needs a
Unicode TrueType font. The project now expects Times New Roman if available.

Steps:

1) Obtain the Times New Roman TrueType font (TimesNewRoman.ttf / Times New Roman.ttf).
   It is included with Microsoft Office/Windows but is not redistributed in this repository.

2) Place the TTF file here (either filename is fine):
   - backend/fonts/TimesNewRoman.ttf
   - backend/fonts/Times New Roman.ttf

3) Restart the Flask backend.

Behavior:
- If Times New Roman is present, PDFs include Cyrillic text correctly.
- If Times New Roman is missing but legacy DejaVuSans.ttf exists, it is used as a fallback.
- If neither font is present, the server logs a warning and still generates
  a PDF, but non-Latin characters may be stripped in the PDF output.

This setup avoids crashes during PDF generation and ensures readable
Russian text when the font is installed.
