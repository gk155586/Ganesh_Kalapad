"use client";

import { useEffect } from "react";

export function EditorBridge() {
  useEffect(() => {
    if (window === window.parent) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data;
      if (type === "EDITOR_HIGHLIGHT") {
        const el = document.querySelector(`[data-editor-id="${payload.id}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("editor-highlight-pulse");
          setTimeout(() => el.classList.remove("editor-highlight-pulse"), 2000);
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const editable = target.closest("[data-editor-id]");
      if (editable) {
        e.preventDefault();
        e.stopPropagation();
        const id = editable.getAttribute("data-editor-id");
        const type = editable.getAttribute("data-editor-type");
        window.parent.postMessage({ type: "EDITOR_ELEMENT_CLICKED", payload: { id, type } }, "*");
      }
    };

    window.addEventListener("message", handleMessage);
    document.addEventListener("click", handleClick, true);

    const style = document.createElement("style");
    style.innerHTML = `
      [data-editor-id] { cursor: pointer !important; position: relative; }
      [data-editor-id]:hover::after { content: ""; position: absolute; inset: -2px; border: 2px solid #3b82f6; border-radius: inherit; pointer-events: none; z-index: 50; }
      .editor-highlight-pulse { outline: 4px solid #3b82f6 !important; outline-offset: 2px; transition: outline 0.3s ease; }
    `;
    document.head.appendChild(style);

    return () => {
      window.removeEventListener("message", handleMessage);
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return null;
}
