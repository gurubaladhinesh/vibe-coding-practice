"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { HoverCard } from "radix-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Candidate } from "@/lib/types";
import { createZipBlob } from "@/lib/zip";

type ResultsTableProps = {
  candidates: Candidate[];
  files: File[];
  threshold: number;
  pendingCount: number;
};

function scoreVariant(score: number): "default" | "secondary" | "destructive" {
  if (score >= 75) {
    return "default";
  }
  if (score >= 50) {
    return "secondary";
  }
  return "destructive";
}

function downloadBlob(blob: Blob, fileName: string) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(href);
}

function downloadFile(file: File) {
  downloadBlob(file, file.name);
}

function SkillChips({
  skills,
  tone,
}: {
  skills: string[];
  tone: "match" | "gap";
}) {
  if (skills.length === 0) {
    return <span className="text-muted-foreground text-xs">None listed</span>;
  }

  return (
    <ul className="flex flex-wrap gap-1">
      {skills.map((skill) => (
        <li key={skill}>
          <span
            className={
              tone === "match"
                ? "inline-flex max-w-full rounded-full bg-emerald-100 px-2 py-0.5 text-xs break-all text-emerald-800"
                : "inline-flex max-w-full rounded-full bg-amber-100 px-2 py-0.5 text-xs break-all text-amber-800"
            }
          >
            {skill}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ScoreHover({ candidate }: { candidate: Candidate }) {
  return (
    <HoverCard.Root openDelay={80} closeDelay={120}>
      <HoverCard.Trigger asChild>
        <button
          type="button"
          className="inline-flex cursor-pointer rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label={`${candidate.score}% match. Hover for skill details.`}
        >
          <Badge
            variant={scoreVariant(candidate.score)}
            className="w-fit transition-colors"
          >
            {candidate.score}%
          </Badge>
        </button>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="left"
          align="start"
          sideOffset={8}
          collisionPadding={12}
          className="bg-card text-card-foreground z-50 max-h-[min(24rem,70vh)] w-96 overflow-y-auto rounded-lg border p-3 shadow-lg outline-none"
        >
          <div className="flex flex-col gap-3">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Matching skills
              </p>
              <SkillChips skills={candidate.matchingSkills} tone="match" />
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Missing skills
              </p>
              <SkillChips skills={candidate.missingSkills} tone="gap" />
            </div>
            {candidate.comments ? (
              <p className="text-muted-foreground text-xs leading-relaxed break-words">
                {candidate.comments}
              </p>
            ) : null}
          </div>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}

export function ResultsTable({
  candidates,
  files,
  threshold,
  pendingCount,
}: ResultsTableProps) {
  const [isZipping, setIsZipping] = useState(false);
  const visible = candidates.filter((candidate) => candidate.score >= threshold);
  const fileMap = new Map(files.map((file) => [file.name, file]));

  async function downloadMatchingZip() {
    const entries: { name: string; data: ArrayBuffer }[] = [];

    for (const candidate of visible) {
      const file = fileMap.get(candidate.fileName);
      if (!file) {
        continue;
      }
      entries.push({ name: file.name, data: await file.arrayBuffer() });
    }

    if (entries.length === 0) {
      return;
    }

    setIsZipping(true);
    try {
      const blob = await createZipBlob(entries);
      downloadBlob(blob, "skillmatch-matches.zip");
    } finally {
      setIsZipping(false);
    }
  }

  if (candidates.length === 0 && pendingCount === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Upload PDFs and analyze to see matches.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          {visible.length} matching
          {pendingCount > 0 ? ` · ${pendingCount} still scoring` : ""}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={visible.length === 0 || isZipping}
          onClick={() => {
            void downloadMatchingZip();
          }}
        >
          {isZipping ? <Loader2 className="animate-spin" /> : <Download />}
          Download All
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Match</TableHead>
              <TableHead className="text-right">Resume</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((candidate) => {
              const file = fileMap.get(candidate.fileName);

              return (
                <TableRow
                  key={candidate.fileName}
                  className="align-middle transition-colors"
                >
                  <TableCell className="w-[34%] font-medium">
                    <div className="flex flex-col gap-1">
                      <span>{candidate.name}</span>
                      {candidate.parseError ? (
                        <span className="text-destructive text-xs">
                          {candidate.parseError}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="w-[34%] text-sm">
                    <div className="flex flex-col gap-0.5 break-all">
                      <span>{candidate.email}</span>
                      <span className="text-muted-foreground">
                        {candidate.mobile}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="w-[16%]">
                    <ScoreHover candidate={candidate} />
                  </TableCell>
                  <TableCell className="w-[16%] text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      className="cursor-pointer whitespace-normal"
                      disabled={!file}
                      onClick={() => {
                        if (file) {
                          downloadFile(file);
                        }
                      }}
                    >
                      <Download />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {Array.from({ length: pendingCount }).map((_, index) => (
              <TableRow key={`pending-${index}`}>
                <TableCell colSpan={4}>
                  <div className="space-y-2 py-1">
                    <div className="bg-muted h-4 w-1/3 animate-pulse rounded" />
                    <div className="bg-muted h-3 w-2/3 animate-pulse rounded" />
                    <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {candidates.length > 0 && visible.length === 0 && pendingCount === 0 ? (
        <p className="text-muted-foreground text-sm">
          No candidates meet the {threshold}% minimum match score.
        </p>
      ) : null}
    </div>
  );
}
