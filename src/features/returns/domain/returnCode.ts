const RETURN_CODE_ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const RETURN_CODE_RANDOM_LENGTH = 6;
const RETURN_CODE_PREFIX = "RET-";

export const RETURN_CODE_PATTERN = /^RET-[A-Z0-9]{6}$/;

const getRandomAlphanumeric = (length: number): string => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(
    bytes,
    (byte) => RETURN_CODE_ALPHANUMERIC[byte % RETURN_CODE_ALPHANUMERIC.length]
  ).join("");
};

export const generateReturnCode = (): string =>
  `${RETURN_CODE_PREFIX}${getRandomAlphanumeric(RETURN_CODE_RANDOM_LENGTH)}`;
