import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar, ArrowRight } from "lucide-react";
import { Control } from "react-hook-form";

interface SessionDetailsStepProps {
  control: Control<any>;
  isSubmitting: boolean;
  canProceed: boolean;
  onNext: () => void;
}

export function SessionDetailsStep({
  control,
  isSubmitting,
  canProceed,
  onNext,
}: SessionDetailsStepProps) {
  return (
    <div className="space-y-6">
      <Card className="shadow-sm pt-0 hover:shadow-md transition-shadow duration-200">
        <CardHeader className="bg-gradient-to-r rounded-2xl from-blue-50 to-white">
          <CardTitle className="flex flex-col py-6">
            <div className="flex flex-row gap-2 items-center text-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              Session Information
            </div>
              <p className="text-sm text-muted-foreground mt-2">
                Enter a descriptive name for your evaluation session
              </p>
          </CardTitle>
        </CardHeader>
        <CardContent className="">
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold">
                  Session Name *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Morning Session, Round 1, Final Evaluation"
                    disabled={isSubmitting}
                    className="text-base h-11 mt-2"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground mt-2">
                  Choose a unique name to easily identify this session later
                </p>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-gray-500">Step 1 of 3</div>
        <Button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="flex items-center gap-2 px-6 h-11 shadow-sm"
        >
          Next: Select Jury
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
