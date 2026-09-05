import { NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";

export class ValidationError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, string[]>;

  constructor(
    message: string,
    options?: {
      code?: string;
      status?: number;
      details?: Record<string, string[]>;
    }
  ) {
    super(message);
    this.name = "ValidationError";
    this.code = options?.code ?? "VALIDATION_ERROR";
    this.status = options?.status ?? 400;
    this.details = options?.details;
  }
}

const formatZodError = (error: ZodError): Record<string, string[]> => {
  return Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter((entry): entry is [
      string,
      string[],
    ] => Array.isArray(entry[1]))
  );
};

const toValidationError = (error: ZodError): ValidationError => {
  return new ValidationError("Invalid request data", {
    code: "VALIDATION_ERROR",
    status: 400,
    details: formatZodError(error),
  });
};

export const parseJsonBody = async <T>(
  req: NextRequest,
  schema: ZodType<T>
): Promise<T> => {
  let rawBody: unknown;

  try {
    rawBody = await req.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON", {
      code: "INVALID_JSON",
      status: 400,
    });
  }

  try {
    return schema.parse(rawBody);
  } catch (error) {
    if (error instanceof ZodError) {
      throw toValidationError(error);
    }
    throw error;
  }
};

export const parseSearchParams = <T>(
  searchParams: URLSearchParams,
  schema: ZodType<T>
): T => {
  const input = Object.fromEntries(searchParams.entries());

  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw toValidationError(error);
    }
    throw error;
  }
};

export const parsePositiveIntParam = (
  value: string | number | null | undefined,
  name: string
): number => {
  const parsedValue =
    typeof value === "number" ? value : Number(String(value ?? "").trim());

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new ValidationError(`${name} must be a positive integer`, {
      code: "INVALID_PARAM",
      status: 400,
      details: { [name]: [`${name} must be a positive integer`] },
    });
  }

  return parsedValue;
};
