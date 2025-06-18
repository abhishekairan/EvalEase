"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
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
import { Crown, Users, Mail, Phone, Newspaper } from "lucide-react";
import { useState } from "react";
import { submitMarks } from "@/actions/marks";
import { toast } from "sonner";

interface TeamMember {
  id: number;
  name: string;
  email: string;
  institude: string;
  phoneNumber: string;
}

interface TeamData {
  id: number;
  teamName: string;
  leaderId: TeamMember;
  members: TeamMember[];
}

interface MarksDialogProps {
  open: boolean;
  onClose: () => void;
  team: TeamData;
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
  const [marks, setMarks] = useState({
    innovationScore: "",
    presentationScore: "",
    technicalScore: "",
    impactScore: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    const numValue = parseInt(value);
    if (value === "" || (numValue >= 0 && numValue <= 10)) {
      setMarks(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async () => {
    // Validate all fields are filled
    const scores = Object.values(marks);
    if (scores.some(score => score === "" || parseInt(score) < 0 || parseInt(score) > 10)) {
      toast.error("Please enter valid scores (0-10) for all categories");
      return;
    }

    if (!juryId || !sessionId) {
      toast.error("Missing jury or session information");
      return;
    }

    setIsSubmitting(true);

    try {
      const markData = {
        teamId: team.id,
        juryId: juryId,
        session: sessionId,
        innovationScore: parseInt(marks.innovationScore),
        presentationScore: parseInt(marks.presentationScore),
        technicalScore: parseInt(marks.technicalScore),
        impactScore: parseInt(marks.impactScore),
        submitted: true
      };

      await submitMarks(markData);
      toast.success("Marks submitted successfully!");
      onMarksSubmitted(team.id);
      
      // Reset form
      setMarks({
        innovationScore: "",
        presentationScore: "",
        technicalScore: "",
        impactScore: ""
      });
    } catch (error) {
      console.error("Error submitting marks:", error);
      toast.error("Failed to submit marks. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
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
                    {team.members.map((member, index) => (
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
              <CardTitle className="text-lg flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                Evaluation Marks
              </CardTitle>
              <DialogDescription className="text-start">
                Enter scores from 0 to 10 for each category
              </DialogDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="innovation">Innovation Score (0-10)</Label>
                  <Input
                    id="innovation"
                    type="number"
                    min="0"
                    max="10"
                    value={marks.innovationScore}
                    onChange={(e) => handleInputChange("innovationScore", e.target.value)}
                    placeholder="Enter score"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="presentation">Presentation Score (0-10)</Label>
                  <Input
                    id="presentation"
                    type="number"
                    min="0"
                    max="10"
                    value={marks.presentationScore}
                    onChange={(e) => handleInputChange("presentationScore", e.target.value)}
                    placeholder="Enter score"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="technical">Technical Score (0-10)</Label>
                  <Input
                    id="technical"
                    type="number"
                    min="0"
                    max="10"
                    value={marks.technicalScore}
                    onChange={(e) => handleInputChange("technicalScore", e.target.value)}
                    placeholder="Enter score"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="impact">Impact Score (0-10)</Label>
                  <Input
                    id="impact"
                    type="number"
                    min="0"
                    max="10"
                    value={marks.impactScore}
                    onChange={(e) => handleInputChange("impactScore", e.target.value)}
                    placeholder="Enter score"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? "Submitting..." : "Submit Marks"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
