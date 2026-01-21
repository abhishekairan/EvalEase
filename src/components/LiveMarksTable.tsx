"use client";

import { useState, useCallback } from "react";
import { DataTable } from "@/components/data-table";
import { marksColumns } from "@/components/TableColumns";
import { useLiveData } from "@/hooks/use-live-data";
import { fetchMarksData, MarksWithDataType } from "@/actions/marksData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Pause, 
  Play, 
  Wifi, 
  WifiOff,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LiveMarksTableProps {
  initialData?: MarksWithDataType;
  /** Polling interval in milliseconds (default: 5000ms = 5 seconds) */
  pollingInterval?: number;
}

export function LiveMarksTable({ 
  initialData = [], 
  pollingInterval = 5000 
}: LiveMarksTableProps) {
  const [pollInterval, setPollInterval] = useState(pollingInterval);

  const fetcher = useCallback(() => fetchMarksData(), []);

  const {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh,
    pause,
    resume,
    isPolling,
    lastUpdated,
  } = useLiveData<MarksWithDataType>({
    fetcher,
    interval: pollInterval,
    enabled: true,
  });

  const marks = data ?? initialData;

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return "Never";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 5) return "Just now";
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  const handleIntervalChange = (newInterval: number) => {
    setPollInterval(newInterval);
  };

  if (error) {
    return (
      <div className="text-center py-10">
        <WifiOff className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-600">Connection Error</h2>
        <p className="text-muted-foreground mt-2 mb-4">
          Failed to fetch live data. Please check your connection.
        </p>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Live Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-4">
          {/* Live Status Indicator */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    isPolling ? "bg-green-500 animate-pulse" : "bg-yellow-500"
                  )} />
                  <span className="text-sm font-medium">
                    {isPolling ? "Live" : "Paused"}
                  </span>
                  {isRefreshing && (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {isPolling 
                  ? `Auto-refreshing every ${pollInterval / 1000}s` 
                  : "Live updates paused"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Last Updated */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Updated: {formatLastUpdated(lastUpdated)}</span>
          </div>

          {/* Record Count */}
          <Badge variant="secondary" className="font-normal">
            {marks.length} records
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Interval Selector */}
          <div className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground hidden sm:inline">Refresh:</span>
            <select
              value={pollInterval}
              onChange={(e) => handleIntervalChange(Number(e.target.value))}
              className="h-8 px-2 text-sm border rounded-md bg-background"
            >
              <option value={2000}>2s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
              <option value={60000}>1m</option>
            </select>
          </div>

          {/* Pause/Resume Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isPolling ? pause : resume}
                  className="h-8 w-8 p-0"
                >
                  {isPolling ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isPolling ? "Pause live updates" : "Resume live updates"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Manual Refresh Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refresh}
                  disabled={isRefreshing}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className={cn(
                    "h-4 w-4",
                    isRefreshing && "animate-spin"
                  )} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh now</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Connection Status */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  {isPolling ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {isPolling ? "Connected" : "Updates paused"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={marksColumns}
        data={marks}
        isLoading={isLoading}
        pageSize={15}
        enableExport={true}
        exportFilename="Marks_Data"
      />
    </div>
  );
}
