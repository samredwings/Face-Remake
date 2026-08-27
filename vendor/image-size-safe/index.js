"use strict";

const fs = require("node:fs");

const TYPES = [
  "bmp",
  "gif",
  "jpeg",
  "png",
  "svg",
  "webp",
];

function result(width, height, type) {
  return { width, height, type };
}

function readUInt24LE(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function parseJpeg(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return undefined;
  }

  let offset = 2;
  while (offset + 3 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset++];

    if (marker === 0xd8 || marker === 0xd9) continue;
    if (marker === 0xda || marker === 0x00) break;
    if (offset + 1 >= buffer.length) break;

    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) break;

    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isStartOfFrame && segmentLength >= 7) {
      return result(
        buffer.readUInt16BE(offset + 5),
        buffer.readUInt16BE(offset + 3),
        "jpeg",
      );
    }

    offset += segmentLength;
  }

  return undefined;
}

function parseSvg(buffer) {
  const text = buffer.toString("utf8", 0, Math.min(buffer.length, 64 * 1024));
  if (!/<svg(?:\s|>)/i.test(text)) return undefined;

  const widthMatch = text.match(/\bwidth\s*=\s*["']\s*([0-9]+(?:\.[0-9]+)?)/i);
  const heightMatch = text.match(/\bheight\s*=\s*["']\s*([0-9]+(?:\.[0-9]+)?)/i);
  const viewBoxMatch = text.match(
    /\bviewBox\s*=\s*["']\s*[-+]?[0-9.]+\s+[-+]?[0-9.]+\s+([0-9.]+)\s+([0-9.]+)/i,
  );
  const width = widthMatch ? Number(widthMatch[1]) : viewBoxMatch ? Number(viewBoxMatch[1]) : 0;
  const height = heightMatch ? Number(heightMatch[1]) : viewBoxMatch ? Number(viewBoxMatch[2]) : 0;

  if (width > 0 && height > 0) return result(width, height, "svg");
  return undefined;
}

function parseImage(input) {
  const buffer = Buffer.from(input);

  if (
    buffer.length >= 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return result(buffer.readUInt32BE(16), buffer.readUInt32BE(20), "png");
  }

  if (
    buffer.length >= 10 &&
    (buffer.subarray(0, 6).toString("ascii") === "GIF87a" ||
      buffer.subarray(0, 6).toString("ascii") === "GIF89a")
  ) {
    return result(buffer.readUInt16LE(6), buffer.readUInt16LE(8), "gif");
  }

  if (buffer.length >= 26 && buffer.subarray(0, 2).toString("ascii") === "BM") {
    return result(Math.abs(buffer.readInt32LE(18)), Math.abs(buffer.readInt32LE(22)), "bmp");
  }

  if (
    buffer.length >= 30 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    const chunk = buffer.subarray(12, 16).toString("ascii");
    if (chunk === "VP8X" && buffer.length >= 30) {
      return result(readUInt24LE(buffer, 24) + 1, readUInt24LE(buffer, 27) + 1, "webp");
    }
    if (chunk === "VP8 " && buffer.length >= 30) {
      return result(buffer.readUInt16LE(26) & 0x3fff, buffer.readUInt16LE(28) & 0x3fff, "webp");
    }
    if (chunk === "VP8L" && buffer.length >= 25 && buffer[20] === 0x2f) {
      const width = 1 + (((buffer[21] | (buffer[22] << 8)) & 0x3fff));
      const height = 1 + ((((buffer[22] >> 6) | (buffer[23] << 2) | (buffer[24] << 10)) & 0x3fff));
      return result(width, height, "webp");
    }
  }

  return parseJpeg(buffer) || parseSvg(buffer);
}

function imageSize(input, callback) {
  if (typeof input === "string") {
    if (typeof callback === "function") {
      fs.readFile(input, (error, data) => {
        if (error) return callback(error);
        try {
          callback(null, parseImage(data));
        } catch (parseError) {
          callback(parseError);
        }
      });
      return;
    }
    return parseImage(fs.readFileSync(input));
  }

  if (!Buffer.isBuffer(input) && !(input instanceof Uint8Array)) {
    throw new TypeError("invalid invocation. input should be a Uint8Array");
  }

  const dimensions = parseImage(input);
  if (!dimensions) throw new TypeError("unsupported image format");
  return dimensions;
}

module.exports = imageSize;
module.exports.default = imageSize;
module.exports.imageSize = imageSize;
module.exports.types = TYPES;