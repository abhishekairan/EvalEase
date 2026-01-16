"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { updateJurySessionsAction } from "@/actions/juryForm";

interface Session {
  id: number;
  name: string;
}

interface EditJurySessionsDialogProps {
  children: React.ReactNode;
  juryId: number;
  juryName: string;
  currentSessions: Session[];
  allSessions: Session[];
}

export function EditJurySessionsDialog({
  children,
  juryId,
  juryName,
  currentSessions,
  allSessions,
}: EditJurySessionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState<number[]>(
    currentSessions.map((s) => s.id)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSessionToggle = (sessionId: number, checked: boolean) => {
    if (checked) {
      setSelectedSessionIds([...selectedSessionIds, sessionId]);
    } else {
      setSelectedSessionIds(selectedSessionIds.filter((id) => id !== sessionId));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateJurySessionsAction({
        juryId,
        sessionIds: selectedSessionIds,
      });
      
      toast.success("Sessions updated successfully", {
        description: `Updated sessions for ${juryName}`,
      });
      setOpen(false);
    } catch (error) {
      console.error("Error updating sessions:", error);
      toast.error("Failed to update sessions", {
        description: "Please try again later",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset to current sessions when closing
      setSelectedSessionIds(currentSessions.map((s) => s.id));
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Sessions for {juryName}</DialogTitle>
          <DialogDescription>
            Select the sessions this jury member should be assigned to. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {allSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No sessions available
            </p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto border rounded-md p-4">
              {allSessions.map((session) => (
                <div key={session.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`session-${session.id}`}
                    checked={selectedSessionIds.includes(session.id)}
                    onCheckedChange={(checked) =>
                      handleSessionToggle(session.id, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`session-${session.id}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {session.name}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
