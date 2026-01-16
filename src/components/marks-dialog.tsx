"use client";

import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, Phone, Lock, LockOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitMarks, lockMarks } from "@/actions/marks";
import { toast } from "@/lib/toast";
import { MarksFormData, MarksFormSchema, TeamDataType, MarksDBType } from "@/zod";

interface MarksDialogProps {
  open: boolean;
  onClose: () => void;
  team: TeamDataType;
  juryId?: number;
  sessionId?: number | null;
  onMarksSubmitted: (teamId: number) => void;
  existingMark?: MarksDBType | null;
}

export default function MarksDialog({
  open,
  onClose,
  team,
  juryId,
  sessionId,
  onMarksSubmitted,
  existingMark
}: MarksDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [isLocked, setIsLocked] = useState(existingMark?.locked || false);
  
  const form = useForm({
    resolver: zodResolver(MarksFormSchema),
    defaultValues: {
      innovationScore: existingMark?.innovationScore || 0,
      presentationScore: existingMark?.presentationScore || 0,
      technicalScore: existingMark?.technicalScore || 0,
      impactScore: existingMark?.impactScore || 0,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = form;

  // Update form when existing mark changes or dialog opens
  useEffect(() => {
    if (existingMark) {
      reset({
        innovationScore: existingMark.innovationScore,
        presentationScore: existingMark.presentationScore,
        technicalScore: existingMark.technicalScore,
        impactScore: existingMark.impactScore,
      });
      setIsLocked(existingMark.locked || false);
    } else {
      reset({
        innovationScore: 0,
        presentationScore: 0,
        technicalScore: 0,
        impactScore: 0,
      });
      setIsLocked(false);
    }
  }, [existingMark, reset, open]);

  const onSubmit = async (data: MarksFormData) => {
    if (!juryId || !sessionId) {
      toast.error("Cannot submit marks", {
        description: "Missing required information"
      });
      return;
    }

    if (isLocked) {
      toast.error("Mark is locked", {
        description: "This mark has been locked and cannot be edited"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const markData = {
        teamId: team.id!,
        juryId: juryId,
        session: sessionId,
        innovationScore: data.innovationScore,
        presentationScore: data.presentationScore,
        technicalScore: data.technicalScore,
        impactScore: data.impactScore,
        submitted: true
      };

      const result = await submitMarks(markData);
      if(result.success){
        toast.success("Marks saved", {
          description: result.message || "Your evaluation has been saved"
        });
        onMarksSubmitted(team.id!);
        onClose();
      }else{
        toast.error("Cannot submit marks", {
          description: result.message || "Please check your input and try again"
        });
      }
    } catch (error) {
      console.error("Error submitting marks:", error);
      toast.error("Failed to submit marks", {
        description: "Please try again or contact support"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLockMarks = async () => {
    if (!existingMark?.id) {
      toast.error("No marks to lock", {
        description: "Please save marks before locking"
      });
      return;
    }

    setIsLocking(true);
    try {
      const result = await lockMarks({ markId: existingMark.id });
      if (result.success) {
        toast.success("Marks locked", {
          description: result.message || "This evaluation can no longer be edited"
        });
        setIsLocked(true);
        onMarksSubmitted(team.id!);
      } else {
        toast.error("Failed to lock marks", {
          description: result.message || "Please try again"
        });
      }
    } catch (error) {
      console.error("Error locking marks:", error);
      toast.error("Failed to lock marks", {
        description: "Please try again or contact support"
      });
    } finally {
      setIsLocking(false);
    }
  };

  const handleClose = () => {
    if (!isLocked) {
      reset();
    }
    onClose();
  };

  const isEditing = !!existingMark;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-semibold">
              {isEditing ? "Edit" : "Enter"} Marks for {team.teamName}
            </DialogTitle>
            {isLocked && (
              <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                <Lock className="h-4 w-4" />
                <span>Locked</span>
              </div>
            )}
          </div>
          <DialogDescription className="text-sm sm:text-base">
            {isLocked 
              ? "These marks are locked and cannot be edited" 
              : "Please review team details and enter marks for each category"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Team Details Section */}
          <Card className="gap-2">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                Team Leader
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Team Leader */}
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{team.leaderId.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{team.leaderId.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{team.leaderId.phoneNumber}</span>
                  </div>
                </div>
              </div>

              {/* Team Members */}
              {team.members && team.members.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Team Members ({team.members.length})
                    </span>
                  </div>
                  <div className="space-y-3">
                    {team.members.map((member, index) => (
                      <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{member.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{member.phoneNumber}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Marks Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Evaluation Marks</CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter scores for each category
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Innovation Score */}
                  <div className="space-y-2">
                    <Label htmlFor="innovationScore" className="text-sm font-medium">
                      Innovation Score (0-10)
                    </Label>
                    <Input
                      id="innovationScore"
                      type="number"
                      min="0"
                      max="10"
                      step="1"
                      disabled={isLocked}
                      {...register("innovationScore", { valueAsNumber: true })}
                      className="w-full"
                    />
                    {errors.innovationScore && (
                      <p className="text-sm text-red-500">
                        {errors.innovationScore.message}
                      </p>
                    )}
                  </div>

                  {/* Presentation Score */}
                  <div className="space-y-2">
                    <Label htmlFor="presentationScore" className="text-sm font-medium">
                      Presentation Score (0-10)
                    </Label>
                    <Input
                      id="presentationScore"
                      type="number"
                      min="0"
                      max="10"
                      step="1"
                      disabled={isLocked}
                      {...register("presentationScore", { valueAsNumber: true })}
                      className="w-full"
                    />
                    {errors.presentationScore && (
                      <p className="text-sm text-red-500">
                        {errors.presentationScore.message}
                      </p>
                    )}
                  </div>

                  {/* Technical Score */}
                  <div className="space-y-2">
                    <Label htmlFor="technicalScore" className="text-sm font-medium">
                      Code Quality (0-15)
                    </Label>
                    <Input
                      id="technicalScore"
                      type="number"
                      min="0"
                      max="15"
                      step="1"
                      disabled={isLocked}
                      {...register("technicalScore", { valueAsNumber: true })}
                      className="w-full"
                    />
                    {errors.technicalScore && (
                      <p className="text-sm text-red-500">
                        {errors.technicalScore.message}
                      </p>
                    )}
                  </div>

                  {/* Impact Score */}
                  <div className="space-y-2">
                    <Label htmlFor="impactScore" className="text-sm font-medium">
                      Feasibility (0-15)
                    </Label>
                    <Input
                      id="impactScore"
                      type="number"
                      min="0"
                      max="15"
                      step="1"
                      disabled={isLocked}
                      {...register("impactScore", { valueAsNumber: true })}
                      className="w-full"
                    />
                    {errors.impactScore && (
                      <p className="text-sm text-red-500">
                        {errors.impactScore.message}
                      </p>
                    )}
                  </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="w-full sm:w-auto order-2 sm:order-1"
                  >
                    {isLocked ? "Close" : "Cancel"}
                  </Button>
                  {!isLocked && (
                    <>
                      <LoadingButton
                        type="submit"
                        loading={isSubmitting}
                        loadingText={isEditing ? "Updating..." : "Submitting..."}
                        className="w-full sm:w-auto order-1 sm:order-2"
                      >
                        {isEditing ? "Update Marks" : "Submit Marks"}
                      </LoadingButton>
                      {isEditing && existingMark && (
                        <LoadingButton
                          type="button"
                          variant="secondary"
                          onClick={handleLockMarks}
                          loading={isLocking}
                          loadingText="Locking..."
                          className="w-full sm:w-auto order-1 sm:order-3"
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          Lock Marks
                        </LoadingButton>
                      )}
                    </>
                  )}
                </DialogFooter>
              </form>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
