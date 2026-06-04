import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("[Error]", err);

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[])?.join(", ") || "field";
      return res.status(409).json({ 
        error: `Resource already exists: A record with this ${target} already exists.` 
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Resource not found" });
    }
    if (err.code === "P2003") {
      return res.status(400).json({ error: "Invalid related resource ID provided (Foreign Key violation)" });
    }
  }

  // Custom app errors
  if ((err as any).statusCode) {
    return res.status((err as any).statusCode).json({ error: err.message });
  }

  // Default
  return res.status(500).json({
    error: err.message || "An unexpected error occurred",
    stack: err.stack
  });
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}
