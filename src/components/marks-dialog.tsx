"use client";

import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Crown, Users, Mail, Phone } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitMarks } from "@/actions/marks";
import { toast } from "sonner";
import { MarksFormData, MarksFormSchema, TeamDataType } from "@/zod";

interface MarksDialogProps {
  open: boolean;
  onClose: () => void;
  team: TeamDataType;
  juryId?: number;
  sessionId?: number | null;
  onMarksSubmitted: (teamId: number) => void;
}

export default function MarksDialog({
  open,
  onClose,
  team,
  juryId,
  sessionId,
  onMarksSubmitted
}: MarksDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(MarksFormSchema),
    defaultValues: {
      innovationScore: 0,
      presentationScore: 0,
      technicalScore: 0,
      impactScore: 0,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = form;

  const onSubmit = async (data: MarksFormData) => {
    if (!juryId || !sessionId) {
      toast.error("Missing jury or session information");
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

      const {success} = await submitMarks(markData);
      if(success){
        toast.success("Marks submitted successfully!");
      }else{
        toast.error("Marks cannot be submitted!");
      }

      onMarksSubmitted(team.id!);
      reset();
      onClose();
    } catch (error) {
      console.error("Error submitting marks:", error);
      toast.error("Failed to submit marks. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-semibold">
            Enter Marks for {team.teamName}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Please review team details and enter marks for each category (0-10)
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
              {team.members.length > 0 && (
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
                Enter scores from 0 to 10 for each category
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
                      step="0.1"
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
                      step="0.1"
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
                      Code Quality (0-10)
                    </Label>
                    <Input
                      id="technicalScore"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
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
                      Feasibility (0-10)
                    </Label>
                    <Input
                      id="impactScore"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
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
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto order-1 sm:order-2"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Marks"}
                  </Button>
                </DialogFooter>
              </form>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
