"use server";

import { Prisma, DriverStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "../../lib/prisma";

const DRIVER_PATH = "/drivers";

type DriverFormResult = {
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: Date;
  contactNumber: string;
  safetyScore: number;
  status: DriverStatus;
};

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

function parseDriverForm(formData: FormData): { data?: DriverFormResult; error?: string } {
  const name = readString(formData, "name");
  const licenseNumber = readString(formData, "licenseNumber");
  const licenseCategory = readString(formData, "licenseCategory");
  const licenseExpiryDateValue = readString(formData, "licenseExpiryDate");
  const contactNumber = readString(formData, "contactNumber");
  const safetyScoreValue = readString(formData, "safetyScore");
  const statusValue = readString(formData, "status");

  if (!name || !licenseNumber || !licenseCategory || !licenseExpiryDateValue || !contactNumber || !safetyScoreValue) {
    return { error: "All driver fields are required." };
  }

  const safetyScore = Number(safetyScoreValue);
  if (Number.isNaN(safetyScore) || safetyScore < 0 || safetyScore > 100) {
    return { error: "Safety score must be a number between 0 and 100." };
  }

  const licenseExpiryDate = new Date(licenseExpiryDateValue);
  if (Number.isNaN(licenseExpiryDate.getTime())) {
    return { error: "License expiry date is invalid." };
  }

  if (!Object.values(DriverStatus).includes(statusValue as DriverStatus)) {
    return { error: "Driver status is invalid." };
  }

  return {
    data: {
      name,
      licenseNumber,
      licenseCategory,
      licenseExpiryDate,
      contactNumber,
      safetyScore,
      status: statusValue as DriverStatus
    }
  };
}

async function findDuplicateLicense(licenseNumber: string, ignoreId?: string) {
  return prisma.driver.findFirst({
    where: {
      licenseNumber,
      ...(ignoreId ? { NOT: { id: ignoreId } } : {})
    },
    select: { id: true }
  });
}

export async function createDriver(formData: FormData) {
  const parsed = parseDriverForm(formData);
  const returnTo = readString(formData, "returnTo") || DRIVER_PATH;

  if (parsed.error) {
    redirectTo(buildRedirectPath(returnTo, "error", parsed.error));
  }

  const existingDriver = await findDuplicateLicense(parsed.data!.licenseNumber);
  if (existingDriver) {
    redirectTo(buildRedirectPath(returnTo, "error", "That license number already exists."));
  }

  try {
    await prisma.driver.create({
      data: parsed.data!
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirectTo(buildRedirectPath(returnTo, "error", "That license number already exists."));
    }

    redirectTo(buildRedirectPath(returnTo, "error", "Unable to create the driver right now."));
  }

  revalidatePath("/", "layout");
  redirectTo(buildRedirectPath(returnTo, "message", "Driver created."));
}

export async function updateDriver(formData: FormData) {
  const id = readString(formData, "id");
  const parsed = parseDriverForm(formData);

  if (!id) {
    redirectTo(buildRedirectPath(DRIVER_PATH, "error", "Missing driver id."));
  }

  if (parsed.error) {
    redirectTo(buildRedirectPath(DRIVER_PATH, "error", parsed.error));
  }

  const existingDriver = await findDuplicateLicense(parsed.data!.licenseNumber, id);
  if (existingDriver) {
    redirectTo(buildRedirectPath(DRIVER_PATH, "error", "That license number already exists."));
  }

  try {
    await prisma.driver.update({
      where: { id },
      data: parsed.data!
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      redirectTo(buildRedirectPath(DRIVER_PATH, "error", "Driver not found."));
    }

    redirectTo(buildRedirectPath(DRIVER_PATH, "error", "Unable to update the driver right now."));
  }

  revalidatePath("/", "layout");
  redirectTo(buildRedirectPath(DRIVER_PATH, "message", "Driver updated."));
}

export async function deleteDriver(formData: FormData) {
  const id = readString(formData, "id");
  const returnTo = readString(formData, "returnTo") || DRIVER_PATH;

  if (!id) {
    redirectTo(buildRedirectPath(returnTo, "error", "Missing driver id."));
  }

  try {
    await prisma.driver.delete({
      where: { id }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      redirectTo(buildRedirectPath(returnTo, "error", "Driver not found."));
    }

    redirectTo(buildRedirectPath(returnTo, "error", "Unable to delete the driver right now."));
  }

  revalidatePath("/", "layout");
  redirectTo(buildRedirectPath(returnTo, "message", "Driver deleted."));
}