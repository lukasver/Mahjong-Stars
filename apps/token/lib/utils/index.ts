import { TransactionStatus } from "@prisma/client";
import { isAddress } from "thirdweb/utils";
import { z } from "zod";
import { ROLES } from "@/common/config/constants";
import { FOPSchema } from "@/common/schemas/generated";
import { GetTransactionStatusRes } from "../repositories/transactions/dtos";
import { GetTransactionByIdRes } from "../types/fetchers";

export const GET_UNHANDLED_ERROR = "Oops something went wrong";

export const convertCapitalizedCase = (value: string) => {
  return value
    .split(" ")
    .map((s) => s.slice(0, 1).toUpperCase() + s.slice(1).toLowerCase())
    .join(" ");
};

export function convertToSlug(inputString: string) {
  return inputString?.toLowerCase().replace(/\s+/g, "-");
}

export const generateRandomKey = () => {
  return Date.now() + Math.random().toFixed(0);
};

export const getShortAddress = (str: string) => {
  if (!str) return "";
  return str.substring(0, 5) + "..." + str.slice(-4);
};

export const hasRole = (roles: Record<string, string>, role: string) => {
  return roles[role] !== undefined;
};
/**
 * Checks if the provided roles include admin privileges
 * @param roles - Object containing role key-value pairs
 * @returns {boolean} True if roles include ADMIN or SUPER_ADMIN, false otherwise
 */
export const isAdmin = (roles?: Record<string, string>) => {
  if (!roles) return false;
  return [ROLES.ADMIN, ROLES.SUPER_ADMIN].some((role) => hasRole(roles, role));
};

export const isAbsoluteUrl = (url: string) => {
  try {
    return !!new URL(url);
  } catch {
    return false;
  }
};

export const ethAddressSchema = z.string().refine((value) => isAddress(value), {
  message:
    "Provided address is invalid. Please insure you have typed correctly.",
});

/**
 * @param currentPath Current path
 * @returns Redirect path
 */
export const handleRedirectForTransactionStatus = (
  tx: GetTransactionStatusRes | GetTransactionByIdRes["transaction"],
) => {
  console.log("🚀 ~ handleRedirectForTransactionStatus ~ tx:", tx);
  if (tx && "providerStatus" in tx && tx.providerStatus === "completed") {
    return `/dashboard/buy/${tx.id}/success?code=COMPLETED`;
  }
  if (tx && "providerStatus" in tx && tx.providerStatus === "failed") {
    return `/dashboard/buy/${tx.id}/failure?code=FAILED`;
  }
  if (tx.status === TransactionStatus.CANCELLED) {
    return `/dashboard/buy/${tx.id}/failure?code=CANCELLED`;
  }
  if (tx.status === TransactionStatus.REJECTED) {
    return `/dashboard/buy/${tx.id}/failure?code=REJECTED`;
  }
  if (tx.status === TransactionStatus.REFUNDED) {
    return `/dashboard/buy/${tx.id}/failure?code=REFUNDED`;
  }
  if (tx.status === TransactionStatus.COMPLETED) {
    return `/dashboard/buy/${tx.id}/success?code=COMPLETED`;
  }
  if (tx.status === TransactionStatus.PAYMENT_VERIFIED) {
    return `/dashboard/buy/${tx.id}/success?code=PAYMENT_VERIFIED`;
  }
  if (tx.status === TransactionStatus.PAYMENT_SUBMITTED) {
    return `/dashboard/buy/${tx.id}/success?code=PAYMENT_SUBMITTED`;
  }
  if (tx.status === TransactionStatus.TOKENS_DISTRIBUTED) {
    return `/dashboard/buy/${tx.id}/success?code=TOKENS_DISTRIBUTED`;
  }
  if (tx.status === TransactionStatus.AWAITING_PAYMENT) {
    if (tx.formOfPayment !== FOPSchema.enum.CRYPTO) {
      return `/dashboard/buy/${tx.id}/processing`;
    } else {
      return `/dashboard/buy/${tx.id}`;
    }
  }
  return `/dashboard/buy/${tx.id}/pending`;
};
