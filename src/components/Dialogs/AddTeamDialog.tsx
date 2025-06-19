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
import { teamDBSchema } from "@/zod/teamSchema";
import { addTeamAction } from "@/actions/teamForm";

// Extend the team schema for the form
const addTeamSchema = teamDBSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  member1Id: z.number({message:"Atleast 1 Team member is requred"}),
  member2Id: z.number().optional().nullable(),
  member3Id: z.number().optional().nullable(),
});

type AddTeamFormData = z.infer<typeof addTeamSchema>;

interface Student {
  id: number;
  name: string;
}

interface AddTeamDialogProps {
  children: React.ReactNode;
  students: Student[];
}

export function AddTeamDialog({ children, students }: AddTeamDialogProps) {
  const [open, setOpen] = useState(false);
  
  const form = useForm<AddTeamFormData>({
    resolver: zodResolver(addTeamSchema),
    defaultValues: {
      teamName: "",
      leaderId: 0,
      member1Id: 0,
      member2Id: null,
      member3Id: null,
    },
  });

  const onSubmit = async (data: AddTeamFormData) => {
    try {
      await addTeamAction(data);
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error adding team:", error);
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
          <DialogTitle>Add Team</DialogTitle>
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
                    onValueChange={(value) => 
                      field.onChange(value === "null" ? 0 : parseInt(value))
                    }
                    value={field.value?.toString() || "null"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team leader" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">No Leader</SelectItem>
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

            <FormField
              control={form.control}
              name="member1Id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Member 1</FormLabel>
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
                      <SelectItem value="null">No Member</SelectItem>
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

            <FormField
              control={form.control}
              name="member2Id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Member 2</FormLabel>
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
                      <SelectItem value="null">No Member</SelectItem>
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

            <FormField
              control={form.control}
              name="member3Id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Member 3</FormLabel>
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
                      <SelectItem value="null">No Member</SelectItem>
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

            <div className="flex justify-end space-x-2">
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