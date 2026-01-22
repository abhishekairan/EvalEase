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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, Phone, Lock, LockOpen, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitMarks, lockMarks } from "@/actions/marks";
import { toast } from "@/lib/toast";
import {
  MarksFormData,
  MarksFormSchema,
  TeamDataType,
  MarksDBType,
} from "@/zod";

interface MarksDialogProps {
  open: boolean;
  onClose: () => void;
  team: TeamDataType;
  juryId?: number;
  sessionId?: number | null;
  onMarksSubmitted: (teamId: number) => void;
  existingMark?: MarksDBType | null;
  isLoadingMark?: boolean;
}

export default function MarksDialog({
  open,
  onClose,
  team,
  juryId,
  sessionId,
  onMarksSubmitted,
  existingMark,
  isLoadingMark,
}: MarksDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [isLocked, setIsLocked] = useState(existingMark?.locked || false);

  const form = useForm({
    resolver: zodResolver(MarksFormSchema),
    defaultValues: {
      feasibilityScore: existingMark?.feasibilityScore || 0,
      techImplementationScore: existingMark?.techImplementationScore || 0,
      innovationCreativityScore: existingMark?.innovationCreativityScore || 0,
      problemRelevanceScore: existingMark?.problemRelevanceScore || 0,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = form;

  // Update form when existing mark changes or dialog opens
  useEffect(() => {
    if (existingMark) {
      reset({
        feasibilityScore: existingMark.feasibilityScore,
        techImplementationScore: existingMark.techImplementationScore,
        innovationCreativityScore: existingMark.innovationCreativityScore,
        problemRelevanceScore: existingMark.problemRelevanceScore,
      });
      setIsLocked(existingMark.locked || false);
    } else {
      reset({
        feasibilityScore: 0,
        techImplementationScore: 0,
        innovationCreativityScore: 0,
        problemRelevanceScore: 0,
      });
      setIsLocked(false);
    }
  }, [existingMark, reset, open]);

  const onSubmit = async (data: MarksFormData) => {
    if (!juryId || !sessionId) {
      toast.error("Cannot submit marks", {
        description: "Missing required information",
      });
      return;
    }

    if (isLocked) {
      toast.error("Mark is locked", {
        description: "This mark has been locked and cannot be edited",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const markData = {
        teamId: team.id!,
        juryId: juryId,
        session: sessionId,
        feasibilityScore: data.feasibilityScore,
        techImplementationScore: data.techImplementationScore,
        innovationCreativityScore: data.innovationCreativityScore,
        problemRelevanceScore: data.problemRelevanceScore,
        submitted: true,
      };

      const result = await submitMarks(markData);
      if (result.success) {
        toast.success("Marks saved", {
          description: result.message || "Your evaluation has been saved",
        });
        onMarksSubmitted(team.id!);
        onClose();
      } else {
        toast.error("Cannot submit marks", {
          description:
            result.message || "Please check your input and try again",
        });
      }
    } catch (error) {
      console.error("Error submitting marks:", error);
      toast.error("Failed to submit marks", {
        description: "Please try again or contact support",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLockMarks = async () => {
    if (!existingMark?.id) {
      toast.error("No marks to lock", {
        description: "Please save marks before locking",
      });
      return;
    }

    setIsLocking(true);
    try {
      const result = await lockMarks({ markId: existingMark.id });
      if (result.success) {
        toast.success("Marks locked", {
          description:
            result.message || "This evaluation can no longer be edited",
        });
        setIsLocked(true);
        onMarksSubmitted(team.id!);
      } else {
        toast.error("Failed to lock marks", {
          description: result.message || "Please try again",
        });
      }
    } catch (error) {
      console.error("Error locking marks:", error);
      toast.error("Failed to lock marks", {
        description: "Please try again or contact support",
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

  // Determine border color based on mark status
  const getBorderColor = () => {
    if (isLocked) return "border-orange-500";
    if (existingMark) return "border-green-500";
    return "border-blue-500";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={`w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 border-l-4 ${getBorderColor()}`}
        aria-describedby="marks-dialog-description"
      >
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-semibold">
              {isEditing ? "Edit" : "Enter"} Marks for {team.teamName}
            </DialogTitle>
          </div>
          <DialogDescription
            id="marks-dialog-description"
            className="text-sm sm:text-base"
          >
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
                <Users className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                Team Leader
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Team Leader */}
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{team.leaderId.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" aria-hidden="true" />
                    <span className="sr-only">Email:</span>
                    <span className="truncate">{team.leaderId.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" aria-hidden="true" />
                    <span className="sr-only">Phone:</span>
                    <span>{team.leaderId.phoneNumber}</span>
                  </div>
                </div>
              </div>

              {/* Team Members */}
              {team.members && team.members.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    <span className="text-sm font-medium">
                      Team Members ({team.members.length})
                    </span>
                  </div>
                  <div className="space-y-3">
                    {team.members.map((member, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">
                              {member.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" aria-hidden="true" />
                            <span className="sr-only">Email:</span>
                            <span className="truncate">
                              {member.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" aria-hidden="true" />
                            <span className="sr-only">Phone:</span>
                            <span>{member.phoneNumber}</span>
                          </div>
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
              <CardTitle className="text-base sm:text-lg">
                Evaluation Marks
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter scores for each category (25 marks each, total 100)
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Feasibility Score */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="feasibilityScore"
                      className="text-sm font-medium"
                    >
                      Feasibility (0-25)
                    </Label>
                    <Input
                      id="feasibilityScore"
                      type="number"
                      min="0"
                      max="25"
                      step="1"
                      disabled={isLocked}
                      aria-required="true"
                      aria-describedby="feasibilityScore-error"
                      {...register("feasibilityScore", { valueAsNumber: true })}
                      className="w-full"
                    />
                    {errors.feasibilityScore && (
                      <p
                        id="feasibilityScore-error"
                        className="text-sm text-red-500"
                        role="alert"
                      >
                        {errors.feasibilityScore.message}
                      </p>
                    )}
                  </div>

                  {/* Tech Implementation Score */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="techImplementationScore"
                      className="text-sm font-medium"
                    >
                      Tech Implementation (0-25)
                    </Label>
                    <Input
                      id="techImplementationScore"
                      type="number"
                      min="0"
                      max="25"
                      step="1"
                      disabled={isLocked}
                      aria-required="true"
                      aria-describedby="techImplementationScore-error"
                      {...register("techImplementationScore", {
                        valueAsNumber: true,
                      })}
                      className="w-full"
                    />
                    {errors.techImplementationScore && (
                      <p
                        id="techImplementationScore-error"
                        className="text-sm text-red-500"
                        role="alert"
                      >
                        {errors.techImplementationScore.message}
                      </p>
                    )}
                  </div>

                  {/* Innovation & Creativity Score */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="innovationCreativityScore"
                      className="text-sm font-medium"
                    >
                      Innovation & Creativity (0-25)
                    </Label>
                    <Input
                      id="innovationCreativityScore"
                      type="number"
                      min="0"
                      max="25"
                      step="1"
                      disabled={isLocked}
                      aria-required="true"
                      aria-describedby="innovationCreativityScore-error"
                      {...register("innovationCreativityScore", { valueAsNumber: true })}
                      className="w-full"
                    />
                    {errors.innovationCreativityScore && (
                      <p
                        id="innovationCreativityScore-error"
                        className="text-sm text-red-500"
                        role="alert"
                      >
                        {errors.innovationCreativityScore.message}
                      </p>
                    )}
                  </div>

                  {/* Problem Statement Relevance Score */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="problemRelevanceScore"
                      className="text-sm font-medium"
                    >
                      Problem Statement Relevance (0-25)
                    </Label>
                    <Input
                      id="problemRelevanceScore"
                      type="number"
                      min="0"
                      max="25"
                      step="1"
                      disabled={isLocked}
                      aria-required="true"
                      aria-describedby="problemRelevanceScore-error"
                      {...register("problemRelevanceScore", { valueAsNumber: true })}
                      className="w-full"
                    />
                    {errors.problemRelevanceScore && (
                      <p
                        id="problemRelevanceScore-error"
                        className="text-sm text-red-500"
                        role="alert"
                      >
                        {errors.problemRelevanceScore.message}
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
                        loadingText={
                          isEditing ? "Updating..." : "Submitting..."
                        }
                        className="w-full sm:w-auto order-1 sm:order-2"
                      >
                        {isEditing ? "Update Marks" : "Submit Marks"}
                      </LoadingButton>
                      {isEditing && existingMark && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <LoadingButton
                              type="button"
                              variant="secondary"
                              loading={isLocking}
                              loadingText="Locking..."
                              className="w-full sm:w-auto order-1 sm:order-3"
                              aria-label="Lock marks permanently"
                            >
                              <Lock className="h-4 w-4 mr-2" aria-hidden="true" />
                              Lock Marks
                            </LoadingButton>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="h-5 w-5" />
                                Confirm Lock Marks
                              </AlertDialogTitle>
                              <AlertDialogDescription className="space-y-2">
                                <span className="block">
                                  Are you sure you want to lock the marks for <span className="font-semibold">{team.teamName}</span>?
                                </span>
                                <span className="block text-red-600 font-medium">
                                  ⚠️ Warning: Once locked, these marks cannot be edited or changed. This action is permanent.
                                </span>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleLockMarks}
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                              >
                                Yes, Lock Marks
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
