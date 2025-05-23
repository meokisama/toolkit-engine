import React from "react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

export function App() {
  return (
    <div>
      <Button>Click me to show toast</Button>
      <Toaster />
    </div>
  );
}
