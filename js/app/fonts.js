// js/app/fonts.js
export async function loadFonts() {
  if (!document.fonts || !document.fonts.load) return; // older browsers
  // Warm up the faces at representative sizes/styles used in app
  const promises = [
    document.fonts.load('400 16px "Velvelyne"'),
    document.fonts.load('300 16px "Velvelyne"'),
    document.fonts.load('700 16px "Velvelyne"'),
    document.fonts.load('400 180px "FT88"'),        // asterisk canvas
    document.fonts.load('italic 24px "FT88"'),      // titles/headlines
  ];
  try { await Promise.all(promises); } catch {}
}
