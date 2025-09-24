const GS = '\x1D'; // FNC1

function stripSymbologyId(s: string) {
  return s.replace(/^\](C1|d2|Q3)/i, '');
}

export type GS1Parsed = {
  gtin?: string;
  expiry?: string; // YYYY-MM-DD
  lot?: string;
  serial?: string;
  anvisa?: string;
  raw: string;
};

export function parseGS1(input: string): GS1Parsed {
  let s = stripSymbologyId((input || '').trim());
  const out: GS1Parsed = { raw: input };

  if (s.includes('(')) {
    const rx = /\((\d{2,4})\)([^()]+)/g;
    let m;
    while ((m = rx.exec(s))) assignAI(out, m[1], m[2]);
    return out;
  }
  for (const chunk of s.split(GS)) consumeChunk(out, chunk);
  return out;
}

function consumeChunk(out: GS1Parsed, chunk: string) {
  if (chunk.startsWith('01') && chunk.length >= 16) {
    out.gtin = chunk.slice(2, 16);
    const rest = chunk.slice(16);
    if (rest) consumeChunk(out, rest);
    return;
  }
  if (chunk.startsWith('17') && chunk.length >= 8) {
    const yymmdd = chunk.slice(2, 8);
    const yy = yymmdd.slice(0, 2), mm = yymmdd.slice(2, 4), dd = yymmdd.slice(4, 6);
    const yyyy = Number(yy) >= 50 ? `19${yy}` : `20${yy}`;
    out.expiry = `${yyyy}-${mm}-${dd}`;
    const rest = chunk.slice(8);
    if (rest) consumeChunk(out, rest);
    return;
  }
  if (chunk.startsWith('10')) { out.lot = chunk.slice(2); return; }
  if (chunk.startsWith('21')) { out.serial = chunk.slice(2); return; }
  if (chunk.startsWith('713')) { out.anvisa = chunk.slice(3); return; }
}

function assignAI(out: GS1Parsed, ai: string, value: string) {
  switch (ai) {
    case '01': out.gtin = value.slice(0, 14); break;
    case '17': {
      const yy = value.slice(0, 2), mm = value.slice(2, 4), dd = value.slice(4, 6);
      const yyyy = Number(yy) >= 50 ? `19${yy}` : `20${yy}`;
      out.expiry = `${yyyy}-${mm}-${dd}`; break;
    }
    case '10': out.lot = value.trim(); break;
    case '21': out.serial = value.trim(); break;
    case '713': out.anvisa = value.trim(); break;
  }
}