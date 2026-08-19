"use client";

import { useRef, useState } from "react";

type SplitPaneProps = {
  left: React.ReactNode;
  right: React.ReactNode;
};

const MIN_LEFT = 280;
const MAX_LEFT = 640;
const DEFAULT_LEFT = 384;

export function SplitPane({ left, right }: SplitPaneProps) {
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT);
  const dragging = useRef(false);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) {
      return;
    }
    const pane = event.currentTarget.parentElement;
    if (!pane) {
      return;
    }
    const next = event.clientX - pane.getBoundingClientRect().left;
    setLeftWidth(Math.min(MAX_LEFT, Math.max(MIN_LEFT, next)));
  }

  function onPointerUp() {
    dragging.current = false;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-2">
      <div
        className="w-full min-w-0 lg:w-[var(--pane-width)] lg:shrink-0 lg:grow-0"
        style={{ ["--pane-width" as string]: `${leftWidth}px` }}
      >
        {left}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize input and results panels"
        className="hover:bg-primary/15 hidden w-2 shrink-0 cursor-col-resize items-stretch rounded-full lg:flex"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span className="bg-border m-auto h-12 w-1 rounded-full" />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">{right}</div>
    </div>
  );
}
