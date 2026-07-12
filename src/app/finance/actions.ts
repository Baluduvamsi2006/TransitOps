"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";

const FINANCE_PATH = "/finance";

function buildRedirectPath(targetPath: string, messageKey: string, message: string) {
  const url = new URL(targetPath, "http://local.test");
  url.searchParams.set(messageKey, message);
  return `${url.pathname}${url.search}${url.hash}`;
}

function redirectTo(path: string): never {
  redirect(path as never);
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(formData: FormData, key: string) {
  const value = formData.get(key);
  return value ? Number(value) : 0;
}

export async function createFuelLog(formData: FormData) {
  const vehicleId = readString(formData, "vehicleId");
  const liters = readNumber(formData, "liters");
  const cost = readNumber(formData, "cost");
  const dateStr = readString(formData, "date");

  if (!vehicleId || liters <= 0 || cost <= 0) {
    redirectTo(buildRedirectPath(FINANCE_PATH, "error", "All fuel fields are required and must be greater than zero."));
  }

  const date = dateStr ? new Date(dateStr) : new Date();

  try {
    await prisma.fuelLog.create({
      data: {
        liters,
        cost,
        date,
        vehicleId
      }
    });
  } catch (error) {
    redirectTo(buildRedirectPath(FINANCE_PATH, "error", "Failed to log fuel entry."));
  }

  revalidatePath(FINANCE_PATH);
  revalidatePath("/reports");
  redirectTo(buildRedirectPath(FINANCE_PATH, "message", "Fuel log saved successfully."));
}

export async function deleteFuelLog(formData: FormData) {
  const id = readString(formData, "id");

  if (!id) {
    redirectTo(buildRedirectPath(FINANCE_PATH, "error", "Missing log ID."));
  }

  try {
    await prisma.fuelLog.delete({
      where: { id }
    });
  } catch (error) {
    redirectTo(buildRedirectPath(FINANCE_PATH, "error", "Failed to delete fuel log."));
  }

  revalidatePath(FINANCE_PATH);
  revalidatePath("/reports");
  redirectTo(buildRedirectPath(FINANCE_PATH, "message", "Fuel log deleted successfully."));
}

export async function createExpense(formData: FormData) {
  const vehicleId = readString(formData, "vehicleId");
  const description = readString(formData, "description");
  const amount = readNumber(formData, "amount");
  const dateStr = readString(formData, "date");

  if (!vehicleId || !description || amount <= 0) {
    redirectTo(buildRedirectPath(FINANCE_PATH, "error", "All expense fields are required and must be greater than zero."));
  }

  const date = dateStr ? new Date(dateStr) : new Date();

  try {
    await prisma.expense.create({
      data: {
        description,
        amount,
        date,
        vehicleId
      }
    });
  } catch (error) {
    redirectTo(buildRedirectPath(FINANCE_PATH, "error", "Failed to log expense."));
  }

  revalidatePath(FINANCE_PATH);
  revalidatePath("/reports");
  redirectTo(buildRedirectPath(FINANCE_PATH, "message", "Expense logged successfully."));
}

export async function deleteExpense(formData: FormData) {
  const id = readString(formData, "id");

  if (!id) {
    redirectTo(buildRedirectPath(FINANCE_PATH, "error", "Missing expense ID."));
  }

  try {
    await prisma.expense.delete({
      where: { id }
    });
  } catch (error) {
    redirectTo(buildRedirectPath(FINANCE_PATH, "error", "Failed to delete expense."));
  }

  revalidatePath(FINANCE_PATH);
  revalidatePath("/reports");
  redirectTo(buildRedirectPath(FINANCE_PATH, "message", "Expense deleted successfully."));
}
