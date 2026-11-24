// Ready-made looks. Each one is a set of offsets on top of the user's own adjustments.
export const LOOKS = [
  { id: 'none', name: 'Original', group: 'Basic', look: {} },
  { id: 'vivid', name: 'Vivid', group: 'Basic', look: { contrast: .12, vibrance: .35, saturation: .08, clarity: .15 } },
  { id: 'bright', name: 'Bright', group: 'Basic', look: { exposure: .25, shadows: .3, highlights: -.15, vibrance: .1 } },
  { id: 'crisp', name: 'Crisp', group: 'Basic', look: { clarity: .35, sharpen: .4, contrast: .1 } },
  { id: 'rouge', name: 'Darlia', group: 'Signature', look: { contrast: .1, temp: .12, tint: .1, saturation: .05, splitS: [.25, -.05, .1], splitH: [.2, .05, .05], fade: .08 } },
  { id: 'rosy', name: 'Rosy', group: 'Signature', look: { exposure: .1, tint: .18, temp: .05, fade: .12, splitH: [.3, .05, .15], vibrance: .1 } },
  { id: 'cherry', name: 'Cherry', group: 'Signature', look: { contrast: .2, saturation: .12, splitS: [.35, -.1, -.05], vignette: .3, temp: .05 } },
  { id: 'velvet', name: 'Velvet', group: 'Signature', look: { contrast: .18, blacks: -.2, saturation: -.08, splitS: [.2, -.05, .15], splitH: [.1, .02, -.08], vignette: .35 } },
  { id: 'warm', name: 'Golden', group: 'Film', look: { temp: .3, contrast: .08, splitH: [.2, .1, -.1], fade: .05 } },
  { id: 'portra', name: 'Portrait', group: 'Film', look: { temp: .12, saturation: -.1, contrast: -.05, fade: .1, splitS: [.02, .05, .1], splitH: [.1, .06, 0], grain: .15 } },
  { id: 'kodak', name: '90s Film', group: 'Film', look: { temp: .18, contrast: .15, saturation: .1, fade: .12, splitS: [0, .05, .15], grain: .35, vignette: .2 } },
  { id: 'faded', name: 'Faded', group: 'Film', look: { fade: .3, contrast: -.12, saturation: -.15, grain: .2 } },
  { id: 'cool', name: 'Cool', group: 'Mood', look: { temp: -.28, tint: -.05, contrast: .08, splitS: [-.05, .02, .15] } },
  { id: 'teal', name: 'Teal & Orange', group: 'Mood', look: { contrast: .15, splitS: [-.15, .05, .25], splitH: [.25, .08, -.15], saturation: .05 } },
  { id: 'moody', name: 'Moody', group: 'Mood', look: { exposure: -.15, contrast: .2, saturation: -.25, blacks: -.2, vignette: .45, splitS: [0, .04, .1] } },
  { id: 'dream', name: 'Dreamy', group: 'Mood', look: { exposure: .15, contrast: -.15, fade: .2, tint: .08, splitH: [.15, .05, .2], clarity: -.3 } },
  { id: 'noir', name: 'Noir', group: 'Black & white', look: { mono: true, contrast: .35, blacks: -.25, vignette: .4, grain: .2 } },
  { id: 'silver', name: 'Silver', group: 'Black & white', look: { mono: true, contrast: .1, fade: .12, highlights: -.1 } },
  { id: 'sepia', name: 'Sepia', group: 'Black & white', look: { mono: true, splitS: [.18, .08, -.05], splitH: [.22, .12, 0], fade: .1 } },
  // look packs
  { id: 'beach', name: 'Beach', group: 'Travel', look: { exposure: .12, vibrance: .4, temp: .08, splitS: [-.05, .05, .15], highlights: -.15 } },
  { id: 'island', name: 'Island', group: 'Travel', look: { contrast: .12, saturation: .15, splitS: [-.12, .08, .12], splitH: [.15, .1, -.05] } },
  { id: 'city', name: 'City', group: 'Travel', look: { contrast: .2, clarity: .25, saturation: -.12, splitS: [-.05, 0, .12], vignette: .15 } },
  { id: 'kampung', name: 'Kampung', group: 'Travel', look: { temp: .15, vibrance: .2, splitS: [0, .08, 0], splitH: [.15, .1, -.08], fade: .06 } },
  { id: 'latte', name: 'Latte', group: 'Café', look: { temp: .2, saturation: -.15, fade: .15, splitH: [.15, .08, 0], contrast: -.05 } },
  { id: 'mocha', name: 'Mocha', group: 'Café', look: { temp: .15, tint: .04, contrast: .12, saturation: -.2, splitS: [.15, .05, -.05], vignette: .25 } },
  { id: 'matcha', name: 'Matcha', group: 'Café', look: { tint: -.12, temp: .05, fade: .12, saturation: -.05, splitS: [0, .1, .02] } },
  { id: 'brunch', name: 'Brunch', group: 'Café', look: { exposure: .2, shadows: .25, vibrance: .25, temp: .1, clarity: .1 } },
  { id: 'neon', name: 'Neon', group: 'Night', look: { contrast: .2, saturation: .25, tint: .12, splitS: [.05, -.05, .3], splitH: [.3, 0, .2] } },
  { id: 'midnight', name: 'Midnight', group: 'Night', look: { exposure: -.1, temp: -.3, contrast: .18, blacks: -.15, splitS: [-.05, 0, .2], vignette: .35 } },
  { id: 'glow', name: 'Glow', group: 'Night', look: { highlights: .25, clarity: -.2, temp: .12, splitH: [.3, .12, 0], fade: .08 } },
  { id: 'cinema', name: 'Cinema', group: 'Night', look: { contrast: .25, saturation: -.1, splitS: [-.15, .05, .25], splitH: [.25, .1, -.15], vignette: .3, grain: .15 } },
];
export const HSL_BANDS = [['Red', '#ff3b3b'], ['Orange', '#ff9a2e'], ['Yellow', '#ffe14a'], ['Green', '#3fd46a'], ['Aqua', '#2ed6d6'], ['Blue', '#3b7bff'], ['Purple', '#9b5bff'], ['Pink', '#ff4fb4']];
export const ADJUST = [
  ['Light', [['exposure', 'Exposure', -2, 2], ['contrast', 'Contrast', -1, 1], ['highlights', 'Highlights', -1, 1], ['shadows', 'Shadows', -1, 1], ['whites', 'Whites', -1, 1], ['blacks', 'Blacks', -1, 1]]],
  ['Colour', [['temp', 'Warmth', -1, 1], ['tint', 'Tint', -1, 1], ['vibrance', 'Vibrance', -1, 1], ['saturation', 'Saturation', -1, 1]]],
  ['Detail', [['clarity', 'Clarity', -1, 1], ['sharpen', 'Sharpen', 0, 1], ['denoise', 'Noise reduction', 0, 1]]],
  ['Effects', [['fade', 'Fade', 0, 1], ['vignette', 'Vignette', -1, 1], ['grain', 'Grain', 0, 1]]],
];
export const STICKERS = {
  heart: '<path d="M32 56S6 40 6 22C6 13 13 7 21 7c5 0 9 3 11 7 2-4 6-7 11-7 8 0 15 6 15 15 0 18-26 34-26 34z" fill="#ff3d7f"/>',
  sparkle: '<path d="M32 4c2 14 8 22 26 26-18 4-24 12-26 28-2-16-8-24-26-28 18-4 24-12 26-26z" fill="#fff"/><path d="M52 6c.8 5 3 7 8 8-5 1-7.2 3-8 8-.8-5-3-7-8-8 5-1 7.2-3 8-8z" fill="#fff"/>',
  star: '<path d="M32 4l8 18 20 2-15 13 5 20-18-11-18 11 5-20L4 24l20-2z" fill="#ffd34d"/>',
  bow: '<path d="M32 30C22 16 6 14 6 26s16 12 26 4c10 8 26 8 26-4S42 16 32 30z" fill="#ff7fb0"/><circle cx="32" cy="30" r="6" fill="#e0457f"/><path d="M28 34l-8 22 8-4 4 6 2-24zM36 34l8 22-8-4-4 6-2-24z" fill="#ff7fb0"/>',
  cherry: '<path d="M34 6c-4 10-10 18-18 24M34 6c2 12 8 20 14 26" stroke="#3a7a2a" stroke-width="3" fill="none"/><circle cx="18" cy="42" r="13" fill="#d81b3c"/><circle cx="46" cy="44" r="13" fill="#e8264a"/><circle cx="14" cy="37" r="3" fill="#fff" opacity=".6"/>',
  lips: '<path d="M4 30c8-10 18-14 28-6 10-8 20-4 28 6-8 16-48 16-56 0z" fill="#d6143c"/><path d="M4 30c16 4 40 4 56 0" stroke="#8a0a24" stroke-width="2.5" fill="none"/>',
  flower: '<g fill="#ffb3cf"><circle cx="32" cy="16" r="11"/><circle cx="48" cy="28" r="11"/><circle cx="42" cy="46" r="11"/><circle cx="22" cy="46" r="11"/><circle cx="16" cy="28" r="11"/></g><circle cx="32" cy="32" r="8" fill="#ffd34d"/>',
  moon: '<path d="M40 6a24 24 0 1 0 18 34A20 20 0 0 1 40 6z" fill="#ffe7a8"/>',
  cloud: '<path d="M18 50a12 12 0 0 1-1-24 16 16 0 0 1 30-4 13 13 0 0 1 3 28z" fill="#fff"/>',
  note: '<path d="M24 10l28-6v36a8 8 0 1 1-6-7.7V14l-16 3.4V46a8 8 0 1 1-6-7.7z" fill="#fff"/>',
  crown: '<path d="M6 20l14 12 12-20 12 20 14-12-6 32H12z" fill="#ffd34d"/>',
  fire: '<path d="M32 4c4 12 18 18 18 34a18 18 0 0 1-36 0c0-8 4-12 8-16 0 6 2 10 6 12 0-12 4-20 4-30z" fill="#ff6a2b"/><path d="M32 30c2 6 9 9 9 17a9 9 0 0 1-18 0c0-5 3-8 5-10 0 3 1 5 3 6 0-6 1-9 1-13z" fill="#ffd34d"/>',
};
// sticker packs (all drawn for Darlia)
Object.assign(STICKERS, {
  // cute
  cat: '<path d="M12 22l4-14 10 9h12l10-9 4 14c3 5 4 10 4 15 0 13-11 21-24 21S8 50 8 37c0-5 1-10 4-15z" fill="#f6c27a"/><circle cx="24" cy="36" r="3.5" fill="#3a2a2e"/><circle cx="40" cy="36" r="3.5" fill="#3a2a2e"/><path d="M29 43h6l-3 3z" fill="#e0457f"/><path d="M14 42h8M14 46l8-2M50 42h-8M50 46l-8-2" stroke="#3a2a2e" stroke-width="1.5"/>',
  bear: '<circle cx="16" cy="16" r="9" fill="#a0673e"/><circle cx="48" cy="16" r="9" fill="#a0673e"/><circle cx="32" cy="36" r="24" fill="#b97a4b"/><ellipse cx="32" cy="44" rx="11" ry="8" fill="#f1d3b0"/><circle cx="23" cy="32" r="3" fill="#2b1d16"/><circle cx="41" cy="32" r="3" fill="#2b1d16"/><ellipse cx="32" cy="41" rx="4" ry="3" fill="#2b1d16"/>',
  smile: '<circle cx="32" cy="32" r="27" fill="#ffd34d"/><circle cx="23" cy="26" r="4" fill="#3a2a2e"/><circle cx="41" cy="26" r="4" fill="#3a2a2e"/><path d="M19 37c4 9 22 9 26 0" stroke="#3a2a2e" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="16" cy="36" r="4" fill="#ff8fa3" opacity=".7"/><circle cx="48" cy="36" r="4" fill="#ff8fa3" opacity=".7"/>',
  rainbow: '<path d="M6 46a26 26 0 0 1 52 0" stroke="#ff4d6d" stroke-width="6" fill="none"/><path d="M12 46a20 20 0 0 1 40 0" stroke="#ffd34d" stroke-width="6" fill="none"/><path d="M18 46a14 14 0 0 1 28 0" stroke="#4ade80" stroke-width="6" fill="none"/><path d="M24 46a8 8 0 0 1 16 0" stroke="#60a5fa" stroke-width="6" fill="none"/><circle cx="10" cy="50" r="7" fill="#fff"/><circle cx="54" cy="50" r="7" fill="#fff"/>',
  boba: '<path d="M16 22h32l-4 34a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4z" fill="#e8c4a0"/><path d="M14 18h36v6H14z" fill="#ff8fb4"/><path d="M36 4l-4 18" stroke="#3a2a2e" stroke-width="4"/><g fill="#3a2a2e"><circle cx="25" cy="52" r="3"/><circle cx="32" cy="54" r="3"/><circle cx="39" cy="51" r="3"/><circle cx="28" cy="46" r="3"/><circle cx="36" cy="45" r="3"/></g>',
  berry: '<path d="M32 58C16 50 10 38 12 28c2-7 10-10 20-10s18 3 20 10c2 10-4 22-20 30z" fill="#e8264a"/><path d="M22 18c4-8 16-8 20 0-6-2-14-2-20 0z" fill="#3a9a3a"/><path d="M32 18V8" stroke="#3a7a2a" stroke-width="3"/><g fill="#ffd34d"><circle cx="24" cy="30" r="1.5"/><circle cx="32" cy="28" r="1.5"/><circle cx="40" cy="30" r="1.5"/><circle cx="28" cy="38" r="1.5"/><circle cx="36" cy="38" r="1.5"/><circle cx="32" cy="46" r="1.5"/></g>',
  // raya
  ketupat: '<path d="M32 8l22 22-22 22L10 30z" fill="#7ab648"/><path d="M21 19l22 22M43 19L21 41M32 8l22 22M26 14l22 22M38 14L16 36" stroke="#4f8a2a" stroke-width="2.5"/><path d="M32 52c-2 4-6 6-10 6M32 52c2 4 6 6 10 6" stroke="#4f8a2a" stroke-width="2.5" fill="none"/>',
  pelita: '<path d="M14 44h36l-4 10H18z" fill="#c98a2b"/><path d="M20 34h24l-2 10H22z" fill="#e0a83a"/><path d="M32 8c6 8 8 14 8 18a8 8 0 0 1-16 0c0-4 2-10 8-18z" fill="#ffb627"/><path d="M32 18c3 4 4 7 4 9a4 4 0 0 1-8 0c0-2 1-5 4-9z" fill="#fff3c4"/>',
  crescent: '<path d="M38 6a26 26 0 1 0 20 38A22 22 0 0 1 38 6z" fill="#f4dd8a"/><path d="M48 18l2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1z" fill="#f4dd8a"/>',
  lantern: '<path d="M32 4v6" stroke="#c9a14a" stroke-width="3"/><path d="M22 10h20l4 8H18z" fill="#c9a14a"/><path d="M18 18h28l-3 32H21z" fill="#e0143c"/><path d="M24 18v32M32 18v32M40 18v32" stroke="#ffd34d" stroke-width="1.5"/><path d="M20 50h24l-4 6H24z" fill="#c9a14a"/><path d="M30 56h4v6h-4z" fill="#ffd34d"/>',
  mosque: '<path d="M32 10c10 6 16 14 16 22H16c0-8 6-16 16-22z" fill="#2e8b57"/><rect x="14" y="32" width="36" height="22" fill="#3cb371"/><path d="M28 54v-12a4 4 0 0 1 8 0v12z" fill="#1d5c3a"/><rect x="6" y="20" width="5" height="34" fill="#2e8b57"/><rect x="53" y="20" width="5" height="34" fill="#2e8b57"/><path d="M32 4v6M6 20l2.5-6 2.5 6M53 20l2.5-6 2.5 6" stroke="#d4af37" stroke-width="2" fill="#d4af37"/>',
  salam: '<rect x="2" y="18" width="60" height="28" rx="6" fill="#0f5132"/><rect x="5" y="21" width="54" height="22" rx="4" fill="none" stroke="#d4af37" stroke-width="1.5"/><text x="32" y="30" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-weight="700" font-size="8" fill="#f4dd8a">Selamat</text><text x="32" y="40" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-weight="700" font-size="8" fill="#f4dd8a">Hari Raya</text>',
  // wedding
  rings: '<circle cx="24" cy="38" r="15" fill="none" stroke="#d4af37" stroke-width="5"/><circle cx="40" cy="38" r="15" fill="none" stroke="#e8c97a" stroke-width="5"/><path d="M40 16l5 6-5 5-5-5z" fill="#bfe6ff"/>',
  bouquet: '<path d="M32 60l-8-24h16z" fill="#7ab648"/><path d="M24 36l8 24 8-24" fill="none" stroke="#4f8a2a" stroke-width="2"/><g><circle cx="22" cy="24" r="9" fill="#ffb3cf"/><circle cx="42" cy="24" r="9" fill="#fff"/><circle cx="32" cy="16" r="9" fill="#ff7fb0"/><circle cx="32" cy="30" r="8" fill="#fbe1ea"/></g><path d="M26 44h12l-6 6z" fill="#fff"/>',
  dove: '<path d="M8 36c10 0 16-6 20-14 2 8 8 12 16 12l12-6-6 10c-4 10-14 16-26 16-6 0-12-4-16-18z" fill="#fff"/><path d="M28 22c-4-8-2-14 4-16 2 8 4 14 0 20" fill="#f1f1f1"/><circle cx="48" cy="32" r="1.5" fill="#3a2a2e"/>',
  married: '<rect x="2" y="20" width="60" height="24" rx="12" fill="#fbf7ef" stroke="#c9a96e" stroke-width="2"/><text x="32" y="37" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-weight="700" font-size="11" fill="#9a7b4f">Just Married</text>',
  cheers: '<path d="M14 8h14l-2 18a5 5 0 0 1-10 0z" fill="#fff3c4" stroke="#d4af37" stroke-width="2" transform="rotate(-12 21 20)"/><path d="M36 8h14l-2 18a5 5 0 0 1-10 0z" fill="#fff3c4" stroke="#d4af37" stroke-width="2" transform="rotate(12 43 20)"/><path d="M19 32l-2 22M45 32l2 22M11 56h12M41 56h12" stroke="#d4af37" stroke-width="2.5"/><circle cx="32" cy="6" r="2" fill="#d4af37"/><circle cx="28" cy="12" r="1.5" fill="#d4af37"/><circle cx="36" cy="12" r="1.5" fill="#d4af37"/>',
  heartlock: '<path d="M32 56S8 42 8 24c0-8 6-14 13-14 5 0 9 3 11 7 2-4 6-7 11-7 7 0 13 6 13 14 0 18-24 32-24 32z" fill="#ffb3cf"/><path d="M32 56S8 42 8 24" stroke="#ff7fb0" stroke-width="2" fill="none"/><text x="32" y="36" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-weight="700" font-size="11" fill="#c2185b">love</text>',
  // birthday
  cake: '<rect x="12" y="32" width="40" height="22" rx="4" fill="#f6d5dc"/><path d="M12 38c5 4 8 4 10 0s6 4 10 0 6 4 10 0 6 4 10 0" fill="#fff" stroke="#fff" stroke-width="4"/><rect x="10" y="52" width="44" height="6" rx="3" fill="#e0457f"/><g fill="#60a5fa"><rect x="22" y="20" width="4" height="12"/><rect x="30" y="18" width="4" height="14"/><rect x="38" y="20" width="4" height="12"/></g><g fill="#ffb627"><path d="M24 12c2 3 2 5 0 7-2-2-2-4 0-7z"/><path d="M32 10c2 3 2 5 0 7-2-2-2-4 0-7z"/><path d="M40 12c2 3 2 5 0 7-2-2-2-4 0-7z"/></g>',
  balloon: '<ellipse cx="26" cy="22" rx="13" ry="16" fill="#e0143c"/><ellipse cx="42" cy="26" rx="12" ry="15" fill="#60a5fa"/><path d="M26 38l-2 4h4zM42 41l-2 4h4z" fill="#333"/><path d="M26 42c4 6-4 10 4 20M42 45c-4 6 2 10-4 17" stroke="#888" stroke-width="1.5" fill="none"/><ellipse cx="21" cy="16" rx="3" ry="5" fill="#fff" opacity=".4"/>',
  gift: '<rect x="10" y="26" width="44" height="30" rx="3" fill="#a78bfa"/><rect x="8" y="20" width="48" height="10" rx="3" fill="#8b5cf6"/><rect x="29" y="20" width="6" height="36" fill="#ffd34d"/><path d="M32 20c-8-10-18-8-14-2 2 3 8 2 14 2zM32 20c8-10 18-8 14-2-2 3-8 2-14 2z" fill="#ffd34d"/>',
  partyhat: '<path d="M32 4l18 50H14z" fill="#ff4d8d"/><path d="M24 26l16 6M20 38l22 8M28 14l9 3" stroke="#ffd34d" stroke-width="4"/><ellipse cx="32" cy="54" rx="20" ry="5" fill="#60a5fa"/><circle cx="32" cy="5" r="5" fill="#ffd34d"/>',
  hbd: '<rect x="2" y="18" width="60" height="28" rx="8" fill="#ff4d8d"/><text x="32" y="30" text-anchor="middle" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="9" fill="#fff">HAPPY</text><text x="32" y="41" text-anchor="middle" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="9" fill="#ffd34d">BIRTHDAY</text>',
  candle: '<rect x="27" y="26" width="10" height="32" rx="2" fill="#ffb3cf"/><path d="M27 32l10-4M27 40l10-4M27 48l10-4" stroke="#fff" stroke-width="2.5"/><path d="M32 6c5 7 6 11 6 14a6 6 0 0 1-12 0c0-3 1-7 6-14z" fill="#ffb627"/><path d="M32 14c2 3 3 5 3 6a3 3 0 0 1-6 0c0-1 1-3 3-6z" fill="#fff3c4"/>',
});
export const STICKER_PACKS = [['Darlia', ['heart', 'sparkle', 'star', 'bow', 'cherry', 'lips', 'flower', 'moon', 'cloud', 'note', 'crown', 'fire']], ['Cute', ['cat', 'bear', 'smile', 'rainbow', 'boba', 'berry']], ['Raya', ['ketupat', 'pelita', 'crescent', 'lantern', 'mosque', 'salam']], ['Wedding', ['rings', 'bouquet', 'dove', 'married', 'cheers', 'heartlock']], ['Birthday', ['cake', 'balloon', 'gift', 'partyhat', 'hbd', 'candle']]];
export const stickerSrc = (k) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="256" height="256">${STICKERS[k]}</svg>`);
export const FONTS = [['Inter', '700 {s}px Inter, system-ui, sans-serif'], ['Serif', 'italic 700 {s}px Fraunces, Georgia, serif'], ['Script', 'italic 700 {s}px "Segoe Script", "Brush Script MT", cursive'], ['Mono', '700 {s}px ui-monospace, Menlo, Consolas, monospace'], ['Impact', '900 {s}px Impact, "Arial Black", sans-serif']];
export const COLORS = ['#ffffff', '#111111', '#ff2d55', '#ff7fb0', '#ffd34d', '#7dd3fc', '#8b5a3c'];
