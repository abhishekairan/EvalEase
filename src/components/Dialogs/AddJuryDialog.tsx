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
const addJurySchema = juryDBSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    password: z.string().min(8, "Password must be at least 8 characters long"),
    // Add role field to schema
    role: z.enum(["jury", "mentor"]),
  });

type AddJuryFormData = z.infer<typeof addJurySchema>;

interface AddJuryDialogProps {
  children: React.ReactNode;
  sessions: {
    id: number;
    name: string;
  }[];
}

export const AddJuryDialog = memo(({ children, sessions }: AddJuryDialogProps) => {
  const [open, setOpen] = useState(false);
  const memoizedSessions = useMemo(() => sessions, [sessions]);

  const form = useForm<AddJuryFormData>({
    resolver: zodResolver(addJurySchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
      session: null,
      role: "jury", // Set default to "jury"
    },
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
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md sm:max-w-lg md:max-w-xl">
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
                    <Input {...field} />
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
                    <Input {...field} />
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
                    <Input {...field} />
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
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Add the role field as a dropdown */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="jury">Jury</SelectItem>
                      <SelectItem value="mentor">Mentor</SelectItem>
                    </SelectContent>
                  </Select>
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
                    onValueChange={(value) => field.onChange(value === "null" ? null : parseInt(value))}
                    value={field.value?.toString() || "null"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="No Session" />
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
            <div className="flex justify-end gap-2">
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
