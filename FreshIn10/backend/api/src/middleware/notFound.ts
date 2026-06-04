import { Request, Response } from "express";

export function notFound(req: Request, res: Response) {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`,
  });
}
