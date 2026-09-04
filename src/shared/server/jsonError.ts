import { NextResponse } from "next/server";
import { StoreError } from "@/features/stores/domain";
import { OrderError, OrderItemError } from "@/features/orders/domain";
import { ReturnsError } from "@/features/returns/domain";
import { PaymentsError } from "@/features/payments/domain";
import { InventoryError } from "@/features/inventory/domain";
import {
  ProductError,
  ProductItemError,
  ProductPageError,
} from "@/features/products/domain";
import { LeadError, LeadHopError, LeadItemError } from "@/features/leads/domain";
import { UnauthorizedError } from "./requireCurrentStore";
import { ForbiddenError } from "./storeAccess";

type CodedError = Error & { code: string };

const isCodedDomainError = (error: unknown): error is CodedError =>
  error instanceof StoreError ||
  error instanceof OrderError ||
  error instanceof OrderItemError ||
  error instanceof ReturnsError ||
  error instanceof PaymentsError ||
  error instanceof InventoryError ||
  error instanceof ProductError ||
  error instanceof ProductItemError ||
  error instanceof ProductPageError ||
  error instanceof LeadError ||
  error instanceof LeadItemError ||
  error instanceof LeadHopError;

export const jsonError = (error: unknown, fallbackStatus = 500) => {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  if (isCodedDomainError(error)) {
    const status =
      error.code.includes("REQUIRED") || error.code.includes("INVALID")
        ? 400
        : error.code.includes("EXCEEDS")
          ? 400
          : error.code.includes("NOT_FOUND")
            ? 404
            : error.code.includes("ALREADY_EXISTS")
              ? 409
              : error.code.includes("FORBIDDEN")
                ? 403
                : 500;

    return NextResponse.json(
      { error: error.message, code: error.code },
      { status }
    );
  }

  return NextResponse.json(
    { error: "Internal server error" },
    { status: fallbackStatus }
  );
};
