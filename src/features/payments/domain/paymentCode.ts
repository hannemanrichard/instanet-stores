const PAYMENT_CODE_ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const PAYMENT_CODE_RANDOM_LENGTH = 6;
const PAYMENT_CODE_PREFIX = "PMT-";

export const PAYMENT_CODE_PATTERN = /^PMT-[A-Z0-9]{6}$/;

const getRandomAlphanumeric = (length: number): string => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(
    bytes,
    (byte) => PAYMENT_CODE_ALPHANUMERIC[byte % PAYMENT_CODE_ALPHANUMERIC.length]
  ).join("");
};

export const generatePaymentCode = (): string =>
  `${PAYMENT_CODE_PREFIX}${getRandomAlphanumeric(PAYMENT_CODE_RANDOM_LENGTH)}`;
