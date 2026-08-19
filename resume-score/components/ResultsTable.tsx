"use client";

import { Download } from "lucide-react";
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

type ResultsTableProps = {
  candidates: Candidate[];
  files: FileList | null;
  threshold: number;
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

function downloadFile(file: File) {
  const href = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = href;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(href);
}

export function ResultsTable({
  candidates,
  files,
  threshold,
}: ResultsTableProps) {
  const visible = candidates.filter((candidate) => candidate.score >= threshold);
  const fileMap = new Map(
    files ? Array.from(files).map((file) => [file.name, file]) : [],
  );

  if (candidates.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Results will appear here after analysis.
      </p>
    );
  }

  if (visible.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No candidates meet the {threshold}% minimum match score.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Candidate Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Mobile</TableHead>
            <TableHead>Match Score</TableHead>
            <TableHead className="text-right">Download</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((candidate) => {
            const file = fileMap.get(candidate.fileName);

            return (
              <TableRow key={candidate.fileName}>
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-1">
                    <span>{candidate.name}</span>
                    {candidate.parseError ? (
                      <span className="text-destructive text-xs">
                        {candidate.parseError}
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{candidate.email}</TableCell>
                <TableCell>{candidate.mobile}</TableCell>
                <TableCell>
                  <Badge variant={scoreVariant(candidate.score)}>
                    {candidate.score}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
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
        </TableBody>
      </Table>
    </div>
  );
}
