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
import { userDBSchema } from "@/zod/userSchema";
import { addParticipantAction } from "@/actions/participantForm";

// Extend the user schema for the form, omitting id and timestamps, setting role as student
const addParticipantSchema = userDBSchema.omit({
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

  const form = useForm<AddParticipantFormData>({
    resolver: zodResolver(addParticipantSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      teamId: null,
    },
  });

  const onSubmit = async (data: AddParticipantFormData) => {
    try {
      await addParticipantAction(data);
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error adding participant:", error);
    }
  };

  const handleCancel = () => {
    form.reset();
    setOpen(false);
  };

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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter participant name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="Enter email address" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter phone number (international format)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="teamId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team</FormLabel>
                  <Select 
                    onValueChange={(value) => 
                      field.onChange(value === "null" ? null : parseInt(value))
                    }
                    value={field.value?.toString() || "null"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">No Team</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.teamName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit">Add</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
