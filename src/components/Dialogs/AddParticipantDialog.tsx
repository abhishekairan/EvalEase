// components/add-participant-dialog.tsx
"use client";

import { memo, useCallback, useMemo, useState } from "react";
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
import { participantsDBSchema } from "@/zod";
import { addParticipantAction } from "@/actions/participantForm";

// Extend the user schema for the form, omitting id and timestamps, setting role as student
const addParticipantSchema = participantsDBSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export const AddParticipantDialog = memo<AddParticipantDialogProps>(({ children, teams }: AddParticipantDialogProps) => {
  const [open, setOpen] = useState(false);

  const memorizedTeams = useMemo(()=> teams, [teams])

  const form = useForm<AddParticipantFormData>({
    resolver: zodResolver(addParticipantSchema),
    defaultValues: useMemo(() => ({
      name: "",
      email: "",
      phoneNumber: "",
      teamId: null,
    }),[])
  });

  const onSubmit = useCallback(async (data: AddParticipantFormData) => {
    try {
      await addParticipantAction(data);
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error adding participant:", error);
    }
  },[form]);

  const handleCancel = useCallback(() => {
    form.reset();
    setOpen(false);
  },[form]);

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
                      {memorizedTeams.map((team) => (
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
})
