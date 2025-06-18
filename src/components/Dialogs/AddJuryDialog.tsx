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
import { juryDBSchema } from "@/zod/userSchema";
import { addJuryAction } from "@/actions/juryForm";

// Extend the jury schema for the form, omitting id and timestamps
const addJurySchema = juryDBSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

type AddJuryFormData = z.infer<typeof addJurySchema>;


interface AddJuryDialogProps {
  children: React.ReactNode;
  sessions: {
    id: number,
    name: string
  }[];
}

export const AddJuryDialog = memo<AddJuryDialogProps>(({ children, sessions }) => {
  const [open, setOpen] = useState(false);
  
  // Memoize sessions to prevent unnecessary re-renders
  const memoizedSessions = useMemo(() => sessions, [sessions]);
  
  const form = useForm<AddJuryFormData>({
    resolver: zodResolver(addJurySchema),
    defaultValues: useMemo(() => ({
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
      session: null,
    }), []),
  });

  const onSubmit = useCallback(async (data: AddJuryFormData) => {
    try {
      await addJuryAction(data);
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error adding jury:", error);
    }
  }, [form]);

  const handleCancel = useCallback(() => {
    form.reset();
    setOpen(false);
  }, [form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Jury</DialogTitle>
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
                    <Input placeholder="Enter jury name" {...field} />
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
                    <Input placeholder="Enter email address" type="email" {...field} />
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
                    <Input placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter password" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="session"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session</FormLabel>
                  <Select
                    onValueChange={(value) => 
                      field.onChange(value === "null" ? null : parseInt(value))
                    }
                    value={field.value?.toString() || "null"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a session" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">No Session</SelectItem>
                      {memoizedSessions.map((session) => (
                        <SelectItem key={session.id} value={session.id.toString()}>
                          {session.name}
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
});

AddJuryDialog.displayName = 'AddJuryDialog';
