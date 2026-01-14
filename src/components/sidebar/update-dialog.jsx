import React, { useState, useEffect, useCallback } from "react";
import Markdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Download, CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import noko from "@/assets/noko-tan.gif";

const STATUS = {
  IDLE: "idle",
  CHECKING: "checking",
  UP_TO_DATE: "up-to-date",
  UPDATE_AVAILABLE: "update-available",
  DOWNLOADING: "downloading",
  DOWNLOADED: "downloaded",
  ERROR: "error",
};

export function UpdateDialog({ open, onOpenChange }) {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [error, setError] = useState(null);

  // Cleanup listeners when dialog closes
  useEffect(() => {
    if (!open) {
      window.electronAPI.updater.removeAllListeners();
    }
  }, [open]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStatus(STATUS.IDLE);
      setUpdateInfo(null);
      setError(null);
    }
  }, [open]);

  const checkForUpdate = useCallback(async () => {
    setStatus(STATUS.CHECKING);
    setError(null);

    try {
      const result = await window.electronAPI.updater.check();
      setUpdateInfo(result);

      if (result.hasUpdate) {
        setStatus(STATUS.UPDATE_AVAILABLE);
      } else {
        setStatus(STATUS.UP_TO_DATE);
      }
    } catch (err) {
      setError(err.message || "Failed to check for updates");
      setStatus(STATUS.ERROR);
    }
  }, []);

  const downloadUpdate = useCallback(async () => {
    setStatus(STATUS.DOWNLOADING);
    setError(null);

    try {
      await window.electronAPI.updater.download({
        onError: (data) => {
          setError(data.message);
          setStatus(STATUS.ERROR);
        },
        onDownloaded: () => {
          setStatus(STATUS.DOWNLOADED);
        },
      });
    } catch (err) {
      setError(err.message || "Failed to download update");
      setStatus(STATUS.ERROR);
    }
  }, []);

  const installUpdate = useCallback(async () => {
    try {
      await window.electronAPI.updater.install();
    } catch (err) {
      setError(err.message || "Failed to install update");
      setStatus(STATUS.ERROR);
    }
  }, []);

  const renderContent = () => {
    switch (status) {
      case STATUS.IDLE:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Check for Updates</DialogTitle>
              <DialogDescription>Click the button below to check if a new version is available.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={checkForUpdate}>
                <RefreshCw className="size-4" />
                Check for Update
              </Button>
            </DialogFooter>
          </>
        );

      case STATUS.CHECKING:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Checking for Updates</DialogTitle>
              <DialogDescription>Please wait while we check for the latest version...</DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          </>
        );

      case STATUS.UP_TO_DATE:
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-green-500" />
                You're up to date!
              </DialogTitle>
              <DialogDescription>You are running the latest version of the application.</DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-4">
              <Badge variant="outline" className="text-base px-4 py-2">
                v{updateInfo?.currentVersion}
              </Badge>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        );

      case STATUS.UPDATE_AVAILABLE:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Update Available</DialogTitle>
              <DialogDescription>A new version is available for download.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-center gap-3">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  v{updateInfo?.currentVersion}
                </Badge>
                <ArrowRight className="size-4 text-muted-foreground" />
                <Badge className="text-sm px-3 py-1">v{updateInfo?.latestVersion}</Badge>
              </div>
              {updateInfo?.releaseNotes && (
                <div className="rounded-md bg-muted p-3 max-h-48 overflow-y-auto prose prose-sm prose-neutral dark:prose-invert max-w-none">
                  <Markdown>{updateInfo.releaseNotes}</Markdown>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Later
              </Button>
              <Button onClick={downloadUpdate}>
                <Download className="size-4" />
                Download & Install
              </Button>
            </DialogFooter>
          </>
        );

      case STATUS.DOWNLOADING:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Downloading Update</DialogTitle>
              <DialogDescription>Please wait while we download the update...</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center gap-4 pb-8">
              <img src={noko} className="w-30" />
              <p className="text-sm text-muted-foreground">Downloading v{updateInfo?.latestVersion}...</p>
            </div>
          </>
        );

      case STATUS.DOWNLOADED:
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-green-500" />
                Update Ready
              </DialogTitle>
              <DialogDescription>
                Version <span className="font-bold">{updateInfo?.latestVersion}</span> has been downloaded. Restart the app to apply the update.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={installUpdate}>Restart</Button>
            </DialogFooter>
          </>
        );

      case STATUS.ERROR:
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="size-5 text-destructive" />
                Update Error
              </DialogTitle>
              <DialogDescription>An error occurred while checking for updates.</DialogDescription>
            </DialogHeader>
            <div className="rounded-md bg-destructive/10 p-3 my-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={checkForUpdate}>
                <RefreshCw className="size-4" />
                Try Again
              </Button>
            </DialogFooter>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">{renderContent()}</DialogContent>
    </Dialog>
  );
}
