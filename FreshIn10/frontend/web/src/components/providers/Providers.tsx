"use client";

import { ReactNode } from "react";

import { EditorBridge } from "./EditorBridge";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      <EditorBridge />
      {children}
    </>
  );
}
