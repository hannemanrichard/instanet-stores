/**
 * QR Code version 1, error correction L, byte mode.
 * Sized for short tracking codes such as RET-A1B2C3.
 */

const QR_SIZE = 21;
const DATA_CODEWORDS = 19;
const EC_CODEWORDS = 7;
const PRIMITIVE = 0x11d;

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(() => {
  let value = 1;
  for (let i = 0; i < 255; i += 1) {
    GF_EXP[i] = value;
    GF_LOG[value] = i;
    value <<= 1;
    if (value & 0x100) value ^= PRIMITIVE;
  }
  for (let i = 255; i < 512; i += 1) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

const gfMul = (a: number, b: number) => {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
};

const reedSolomon = (data: number[], ecCount: number) => {
  const generator = [1];
  for (let i = 0; i < ecCount; i += 1) {
    const next = new Array(generator.length + 1).fill(0);
    for (let j = 0; j < generator.length; j += 1) {
      next[j] ^= gfMul(generator[j], GF_EXP[i]);
      next[j + 1] ^= generator[j];
    }
    generator.splice(0, generator.length, ...next);
  }

  const remainder = new Array(ecCount).fill(0);
  for (const byte of data) {
    const factor = byte ^ remainder[0];
    remainder.shift();
    remainder.push(0);
    for (let i = 0; i < ecCount; i += 1) {
      remainder[i] ^= gfMul(generator[i + 1] ?? 0, factor);
    }
  }
  return remainder;
};

const markReserved = (
  reserved: boolean[][],
  row: number,
  col: number
) => {
  if (row >= 0 && row < QR_SIZE && col >= 0 && col < QR_SIZE) {
    reserved[row][col] = true;
  }
};

const setFinder = (
  modules: boolean[][],
  reserved: boolean[][],
  row: number,
  col: number
) => {
  for (let r = -1; r <= 7; r += 1) {
    for (let c = -1; c <= 7; c += 1) {
      const rr = row + r;
      const cc = col + c;
      if (rr < 0 || rr >= QR_SIZE || cc < 0 || cc >= QR_SIZE) continue;
      const inFinder = r >= 0 && r <= 6 && c >= 0 && c <= 6;
      const dark =
        r === 0 ||
        r === 6 ||
        c === 0 ||
        c === 6 ||
        (r >= 2 && r <= 4 && c >= 2 && c <= 4);
      modules[rr][cc] = inFinder && dark;
      reserved[rr][cc] = true;
    }
  }
};

const applyFormatInfo = (modules: boolean[][]) => {
  // ECC L + mask 0
  const bits = 0b111011111000100;
  const positions: Array<[number, number]> = [
    [0, 8],
    [1, 8],
    [2, 8],
    [3, 8],
    [4, 8],
    [5, 8],
    [7, 8],
    [8, 8],
    [8, 7],
    [8, 5],
    [8, 4],
    [8, 3],
    [8, 2],
    [8, 1],
    [8, 0],
  ];
  const mirrors: Array<[number, number]> = [
    [8, 20],
    [8, 19],
    [8, 18],
    [8, 17],
    [8, 16],
    [8, 15],
    [8, 14],
    [8, 13],
    [20, 8],
    [19, 8],
    [18, 8],
    [17, 8],
    [16, 8],
    [15, 8],
    [14, 8],
  ];
  for (let i = 0; i < 15; i += 1) {
    const dark = ((bits >> i) & 1) === 1;
    modules[positions[i][0]][positions[i][1]] = dark;
    modules[mirrors[i][0]][mirrors[i][1]] = dark;
  }
  modules[QR_SIZE - 8][8] = true;
};

export const buildQrModules = (value: string): boolean[][] => {
  const bytes = Array.from(value).map((char) => char.charCodeAt(0) & 0xff);
  const bits: number[] = [];
  const pushBits = (num: number, length: number) => {
    for (let i = length - 1; i >= 0; i -= 1) {
      bits.push((num >> i) & 1);
    }
  };

  pushBits(0b0100, 4);
  pushBits(bytes.length, 8);
  bytes.forEach((byte) => pushBits(byte, 8));
  pushBits(0, Math.min(4, Math.max(0, DATA_CODEWORDS * 8 - bits.length)));
  while (bits.length % 8 !== 0) bits.push(0);

  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    data.push(
      bits
        .slice(i, i + 8)
        .reduce((acc, bit, index) => acc | (bit << (7 - index)), 0)
    );
  }
  const pads = [0xec, 0x11];
  let padIndex = 0;
  while (data.length < DATA_CODEWORDS) {
    data.push(pads[padIndex % 2]);
    padIndex += 1;
  }

  const codewords = [...data, ...reedSolomon(data, EC_CODEWORDS)];
  const stream: number[] = [];
  codewords.forEach((byte) => {
    for (let i = 7; i >= 0; i -= 1) stream.push((byte >> i) & 1);
  });

  const modules = Array.from({ length: QR_SIZE }, () =>
    Array.from({ length: QR_SIZE }, () => false)
  );
  const reserved = Array.from({ length: QR_SIZE }, () =>
    Array.from({ length: QR_SIZE }, () => false)
  );

  setFinder(modules, reserved, 0, 0);
  setFinder(modules, reserved, 0, QR_SIZE - 7);
  setFinder(modules, reserved, QR_SIZE - 7, 0);

  for (let i = 8; i < QR_SIZE - 8; i += 1) {
    modules[6][i] = i % 2 === 0;
    modules[i][6] = i % 2 === 0;
    reserved[6][i] = true;
    reserved[i][6] = true;
  }

  for (let i = 0; i < 9; i += 1) {
    markReserved(reserved, 8, i);
    markReserved(reserved, i, 8);
  }
  for (let i = 0; i < 8; i += 1) {
    markReserved(reserved, 8, QR_SIZE - 1 - i);
    markReserved(reserved, QR_SIZE - 1 - i, 8);
  }
  markReserved(reserved, QR_SIZE - 8, 8);

  let bitIndex = 0;
  let direction = -1;
  for (let col = QR_SIZE - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1;
    for (let i = 0; i < QR_SIZE; i += 1) {
      const row = direction < 0 ? QR_SIZE - 1 - i : i;
      for (let offset = 0; offset < 2; offset += 1) {
        const cc = col - offset;
        if (reserved[row][cc]) continue;
        const bit = bitIndex < stream.length ? stream[bitIndex] === 1 : false;
        bitIndex += 1;
        modules[row][cc] = (row + cc) % 2 === 0 ? !bit : bit;
      }
    }
    direction *= -1;
  }

  applyFormatInfo(modules);
  return modules;
};

export const QR_MODULE_COUNT = QR_SIZE;
