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

  const form = useForm<MarksFormData>({
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
      
      // Reset form
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Enter Marks for {team.teamName}
          </DialogTitle>
          <DialogDescription>
            Please review team details and enter marks for each category (0-10)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Team Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Team Leader */}
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-yellow-600" />
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                    Team Leader
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">{team.leaderId.name}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {team.leaderId.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {team.leaderId.phoneNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* Team Members */}
              {team.members.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Team Members ({team.members.length})
                  </h4>
                  <div className="space-y-2">
                    {team.members.map((member) => (
                      <div key={member.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="space-y-1">
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {member.phoneNumber}
                            </span>
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
            <CardHeader>
              <CardTitle className="text-lg">Evaluation Marks</CardTitle>
              <DialogDescription>
                Enter scores from 0 to 10 for each category
              </DialogDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="innovationScore">Innovation Score (0-10)</Label>
                    <Input
                      id="innovationScore"
                      type="number"
                      min="0"
                      max="10"
                      {...register("innovationScore", { valueAsNumber: true })}
                      placeholder="Enter score"
                      className={errors.innovationScore ? "border-red-500" : ""}
                    />
                    {errors.innovationScore && (
                      <p className="text-red-500 text-sm">{errors.innovationScore.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="presentationScore">Presentation Score (0-10)</Label>
                    <Input
                      id="presentationScore"
                      type="number"
                      min="0"
                      max="10"
                      {...register("presentationScore", { valueAsNumber: true })}
                      placeholder="Enter score"
                      className={errors.presentationScore ? "border-red-500" : ""}
                    />
                    {errors.presentationScore && (
                      <p className="text-red-500 text-sm">{errors.presentationScore.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="technicalScore">Technical Score (0-10)</Label>
                    <Input
                      id="technicalScore"
                      type="number"
                      min="0"
                      max="10"
                      {...register("technicalScore", { valueAsNumber: true })}
                      placeholder="Enter score"
                      className={errors.technicalScore ? "border-red-500" : ""}
                    />
                    {errors.technicalScore && (
                      <p className="text-red-500 text-sm">{errors.technicalScore.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="impactScore">Impact Score (0-10)</Label>
                    <Input
                      id="impactScore"
                      type="number"
                      min="0"
                      max="10"
                      {...register("impactScore", { valueAsNumber: true })}
                      placeholder="Enter score"
                      className={errors.impactScore ? "border-red-500" : ""}
                    />
                    {errors.impactScore && (
                      <p className="text-red-500 text-sm">{errors.impactScore.message}</p>
                    )}
                  </div>
                </div>

                <DialogFooter className="gap-2 mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleClose} 
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
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
