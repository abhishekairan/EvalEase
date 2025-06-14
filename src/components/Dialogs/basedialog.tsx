// components/add-participant-dialog.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { participantsDBSchema } from "@/zod/ParticipantsSchema";
import { addParticipantAction } from "@/actions/participantForm";

// Extend the user schema for the form, omitting id and timestamps, setting role as student
const addParticipantSchema = participantsDBSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  role: true,
}).extend({
  teamId: z.number().optional().nullable(),
});

type AddParticipantFormData = z.infer<typeof addParticipantSchema>;

interface Team {
  id: number;
  teamName: string;
}

interface AddParticipantDialogProps {
  children: React.ReactNode;
  teams: Team[];
}

export function AddParticipantDialog({ children, teams }: AddParticipantDialogProps) {
  const [open, setOpen] = useState(false);

  
  interface Student {
    id: number;
    name: string;
  }
  
  interface AddTeamDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    students: Student[];
  }
  
  export function AddTeamDialog({ 
    open, 
    onOpenChange, 
    students 
  }: AddTeamDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
  
    const form = useForm<AddTeamType>({
      resolver: zodResolver(addTeamSchema),
      defaultValues: {
        teamName: "",
        leaderId: 0,
        members: [null, null, null],
      },
    });
  
    const resetForm = () => {
      form.reset({
        teamName: "",
        leaderId: 0,
        members: [null, null, null],
      });
    };
  
    const handleCancel = () => {
      resetForm();
      onOpenChange(false);
    };
  
    const onSubmit = async (data: AddTeamType) => {
      setIsSubmitting(true);
      try {
        // Filter out null members
        const filteredMembers = data.members?.filter(member => member !== null) || [];
        
        const result = await createTeamAction({
          ...data,
          members: filteredMembers,
        });
  
        if (result.success) {
          toast({
            title: "Success",
            description: result.message,
          });
          resetForm();
          onOpenChange(false);
        } else {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    };
  
    // Reset form when dialog closes
    useEffect(() => {
      if (!open) {
        resetForm();
      }
    }, [open]);
  

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Participant</DialogTitle>
        </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="teamName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter team name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
    
              <FormField
                control={form.control}
                name="leaderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Leader</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team leader" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
    
              {/* Team Members */}
              {[0, 1, 2].map((index) => (
                <FormField
                  key={index}
                  control={form.control}
                  name={`members.${index}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Member {index + 1} (Optional)</FormLabel>
                      <Select 
                        onValueChange={(value) => 
                          field.onChange(value === "null" ? null : parseInt(value))
                        }
                        value={field.value?.toString() || "null"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="null">No member selected</SelectItem>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id.toString()}>
                              {student.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
    
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Team"}
                </Button>
              </div>
            </form>
          </Form>
      </DialogContent>
    </Dialog>
  );
}
