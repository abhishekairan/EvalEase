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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function MarksDialog() {
  const [open, setOpen] = useState(false);

  const closeDialog = () => setOpen(false);
  const openDialog = () => setOpen(true);
  return (
    <Dialog open={open}>
      <form>
        <DialogTrigger asChild>
          <Button variant="outline" onClick={openDialog}>
            Enter Marks
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{"<Team Name>"}</DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-sm leading-none font-semibold">Enter Marks out of 10</DialogDescription>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="mark-1">Marks 1</Label>
              <Input type="number" max={10} id="mark-1" name="mark-1" defaultValue={0} />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="mark-2">Marks 2</Label>
              <Input type="number" max={10} id="mark-2" name="mark-2" defaultValue={0} />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="mark-3">Marks 3</Label>
              <Input type="number" max={10} id="mark-3" name="mark-3" defaultValue={0} />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="mark-4">Marks 4</Label>
              <Input type="number" max={10} id="mark-4" name="mark-4" defaultValue={0} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" onClick={closeDialog}>
              Save Marks
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
