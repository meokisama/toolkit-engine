import React, { useState, useEffect, useCallback } from "react";
import Markdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Loader2, XCircle, RefreshCw } from "lucide-react";

const GITHUB_REPO = "meokisama/toolkit-engine";
const RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO}/releases`;

export function OldReleaseDialog({ open, onOpenChange }) {
  const [releases, setReleases] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReleases = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(RELEASES_API);
      if (!response.ok) {
        throw new Error(`Failed to fetch releases: ${response.statusText}`);
      }
      const data = await response.json();
      setReleases(data);
      if (data.length > 0) {
        setSelectedVersion(data[0].tag_name);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch releases");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && releases.length === 0) {
      fetchReleases();
    }
  }, [open, releases.length, fetchReleases]);

  useEffect(() => {
    if (!open) {
      setError(null);
    }
  }, [open]);

  const selectedRelease = releases.find((r) => r.tag_name === selectedVersion);

  const getDownloadUrl = (version) => {
    const versionNumber = version.replace(/^v/, "");
    return `https://github.com/${GITHUB_REPO}/releases/download/v${versionNumber}/GNT.Toolkit.Engine-${versionNumber}.Setup.exe`;
  };

  const handleDownload = () => {
    if (selectedVersion) {
      const url = getDownloadUrl(selectedVersion);
      window.electronAPI.openExternal(url);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="space-y-4">
          <div className="rounded-md bg-destructive/10 p-3">
            <p className="text-sm text-destructive flex items-center gap-2">
              <XCircle className="size-4" />
              {error}
            </p>
          </div>
          <Button onClick={fetchReleases} variant="outline" className="w-full">
            <RefreshCw className="size-4" />
            Try Again
          </Button>
        </div>
      );
    }

    if (releases.length === 0) {
      return <p className="text-sm text-muted-foreground text-center py-8">No releases found.</p>;
    }

    return (
      <div className="space-y-4">
        <Select value={selectedVersion} onValueChange={setSelectedVersion}>
          <SelectTrigger>
            <SelectValue placeholder="Select version" />
          </SelectTrigger>
          <SelectContent>
            {releases.map((release) => (
              <SelectItem key={release.id} value={release.tag_name}>
                <span className="font-semibold">{release.tag_name}</span> - {formatDate(release.published_at)}
                {release.prerelease && " (Pre-release)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedRelease && (
          <ScrollArea className="h-[250px] rounded-md border bg-muted p-3">
            <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
              <Markdown>{selectedRelease.body || "No changelog available."}</Markdown>
            </div>
          </ScrollArea>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Previous Releases</DialogTitle>
          <DialogDescription>Select a version to view changelog and download.</DialogDescription>
        </DialogHeader>
        {renderContent()}
        {!loading && !error && releases.length > 0 && (
          <DialogFooter>
            <Button onClick={handleDownload} disabled={!selectedVersion}>
              <Download className="size-4" />
              Download {selectedVersion}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
