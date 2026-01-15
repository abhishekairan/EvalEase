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
  FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { juryDBSchema } from "@/zod/userSchema";
import { addJuryAction } from "@/actions/juryForm";

// Extend the jury schema for the form, omitting id and timestamps
const addJurySchema = juryDBSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    session: true, // Remove session field, use sessionIds instead
  })
  .extend({
    password: z.string().min(8, "Password must be at least 8 characters long"),
    role: z.enum(["jury", "mentor"]),
    sessionIds: z.array(z.number()), // Support multiple sessions
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
      sessionIds: [],
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
              name="sessionIds"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Sessions</FormLabel>
                    <FormDescription>
                      Select the sessions this jury member will participate in
                    </FormDescription>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-4">
                    {memoizedSessions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No sessions available</p>
                    ) : (
                      memoizedSessions.map((session) => (
                        <FormField
                          key={session.id}
                          control={form.control}
                          name="sessionIds"
                          render={({ field }) => (
                            <FormItem
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(session.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, session.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== session.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {session.name}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))
                    )}
                  </div>
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
