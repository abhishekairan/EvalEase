"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

interface ExportButtonProps {
  onExport: () => Promise<boolean>;
  disabled?: boolean;
  className?: string;
}

export function ExportButton({ onExport, disabled = false, className }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const success = await onExport();
      
      if (success) {
        // You can add toast notification here if you have it set up
        console.log("Data exported successfully!");
      } else {
        console.error("Failed to export data. Please try again.");
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={disabled || isExporting}
      variant="outline"
      size="sm"
      className={className}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {isExporting ? "Exporting..." : "Export to Excel"}
    </Button>
  );
}
