// components/AddSessionForm.tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useState } from "react"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Mail, Phone, ArrowLeft } from "lucide-react"
import { addSessionAction } from "@/actions/sessionActions"
import { juryDBType } from "@/zod"

// Zod schema for session validation
const addSessionSchema = z.object({
  name: z
    .string()
    .min(1, "Session name is required")
    .max(255, "Session name must be less than 255 characters"),
  selectedJury: z
    .array(z.number())
    .min(1, "At least one jury member must be selected"),
})

type AddSessionFormValues = z.infer<typeof addSessionSchema>

interface JuryMember {
  id: number
  name: string
  email: string
  phoneNumber: string
  session: number | null
  createdAt: Date
  updatedAt: Date
}

interface AddSessionFormProps {
  juryMembers: juryDBType[]
}

export function AddSessionForm({ juryMembers }: AddSessionFormProps) {
  const router = useRouter()
  const [selectedJury, setSelectedJury] = useState<number[]>([])

  const form = useForm<AddSessionFormValues>({
    resolver: zodResolver(addSessionSchema),
    defaultValues: {
      name: "",
      selectedJury: [],
    },
  })

  const {
    handleSubmit,
    formState: { isSubmitting, errors },
    setError,
    clearErrors,
  } = form

  const handleJurySelection = (juryId: number, checked: boolean) => {
    let newSelection: number[]
    
    if (checked) {
      newSelection = [...selectedJury, juryId]
    } else {
      newSelection = selectedJury.filter(id => id !== juryId)
    }
    
    setSelectedJury(newSelection)
    form.setValue("selectedJury", newSelection)
    
    if (newSelection.length > 0 && errors.selectedJury) {
      clearErrors("selectedJury")
    }
  }

  const selectAllJury = () => {
    const availableJury = juryMembers
      .filter(jury => jury.session === null)
      .map(jury => jury.id!)
    
    setSelectedJury(availableJury)
    form.setValue("selectedJury", availableJury)
    clearErrors("selectedJury")
  }

  const clearAllJury = () => {
    setSelectedJury([])
    form.setValue("selectedJury", [])
  }

  const onSubmit = async (data: AddSessionFormValues) => {
    try {
      clearErrors("root")

      const result = await addSessionAction({
        name: data.name,
        juryIds: data.selectedJury,
      })

      if (result.success) {
        router.push("/dashboard/session")
        router.refresh()
      }
    } catch (error) {
      console.error("Error creating session:", error)
      setError("root", {
        type: "manual",
        message: "Failed to create session. Please try again.",
      })
    }
  }

  // Filter jury members - available vs assigned
  const availableJury = juryMembers.filter(jury => jury.session === null)
  const assignedJury = juryMembers.filter(jury => jury.session !== null)

  return (
    <div className=" bg-gray-50/50">
      {/* Mobile-first responsive container */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        
        {/* Header Section - Responsive */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
                  Add New Session
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a new session and assign jury members
                </p>
              </div>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Responsive Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Session Information - Takes full width on mobile, 1 column on desktop */}
              <div className="lg:col-span-1">
                <Card className="h-fit">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="h-5 w-5" />
                      Session Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Morning Session, Round 1"
                              disabled={isSubmitting}
                              className="w-full"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Stats Summary - Mobile Responsive */}
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg sm:text-xl font-bold text-blue-600">
                          {availableJury.length}
                        </div>
                        <div className="text-xs sm:text-sm text-blue-600">Available</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg sm:text-xl font-bold text-green-600">
                          {selectedJury.length}
                        </div>
                        <div className="text-xs sm:text-sm text-green-600">Selected</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Jury Selection - Takes full width on mobile, 2 columns on desktop */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5" />
                        Select Jury Members
                      </CardTitle>
                      
                      {/* Action Buttons - Responsive Stack */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={selectAllJury}
                          disabled={isSubmitting || availableJury.length === 0}
                          className="w-full sm:w-auto text-xs sm:text-sm"
                        >
                          Select All
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearAllJury}
                          disabled={isSubmitting || selectedJury.length === 0}
                          className="w-full sm:w-auto text-xs sm:text-sm"
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                    
                    {/* Stats Bar - Mobile Responsive */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Available: {availableJury.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Selected: {selectedJury.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        Assigned: {assignedJury.length}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0 sm:p-6">
                    {errors.selectedJury && (
                      <div className="mx-4 sm:mx-0 mb-4 text-sm text-red-500 p-3 bg-red-50 rounded-lg">
                        {errors.selectedJury.message}
                      </div>
                    )}

                    {/* Responsive Table Container */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="w-12 text-center">
                                <span className="sr-only">Select</span>
                              </TableHead>
                              <TableHead className="min-w-[120px]">Name</TableHead>
                              <TableHead className="hidden sm:table-cell min-w-[200px]">Email</TableHead>
                              <TableHead className="hidden md:table-cell min-w-[120px]">Phone</TableHead>
                              <TableHead className="w-20 text-center">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {juryMembers.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                  <div className="flex flex-col items-center gap-2">
                                    <Users className="h-8 w-8 text-gray-300" />
                                    <p>No jury members found</p>
                                    <p className="text-xs">Please add jury members first</p>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : (
                              juryMembers.map((jury) => {
                                const isAvailable = jury.session === null
                                const isSelected = selectedJury.includes(jury.id!)
                                
                                return (
                                  <TableRow 
                                    key={jury.id}
                                    className={`${isSelected ? "bg-blue-50 border-blue-200" : ""} hover:bg-gray-50`}
                                  >
                                    <TableCell className="text-center">
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => 
                                          handleJurySelection(jury.id!, checked as boolean)
                                        }
                                        disabled={!isAvailable || isSubmitting}
                                      />
                                    </TableCell>
                                    
                                    <TableCell className="font-medium">
                                      <div className="flex flex-col">
                                        <span className="truncate">{jury.name}</span>
                                        {/* Show email on mobile when email column is hidden */}
                                        <span className="sm:hidden text-xs text-muted-foreground truncate">
                                          {jury.email}
                                        </span>
                                      </div>
                                    </TableCell>
                                    
                                    <TableCell className="hidden sm:table-cell">
                                      <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        <span className="truncate">{jury.email}</span>
                                      </div>
                                    </TableCell>
                                    
                                    <TableCell className="hidden md:table-cell">
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        <span className="truncate">{jury.phoneNumber}</span>
                                      </div>
                                    </TableCell>
                                    
                                    <TableCell className="text-center">
                                      <Badge 
                                        variant={isAvailable ? "default" : "secondary"}
                                        className={`text-xs ${
                                          isAvailable 
                                            ? "bg-green-500 hover:bg-green-600" 
                                            : "bg-gray-500 hover:bg-gray-600"
                                        }`}
                                      >
                                        {isAvailable ? "Free" : `S${jury.session}`}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                )
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Error Display */}
            {errors.root && (
              <div className="text-sm text-red-500 text-center bg-red-50 p-4 rounded-lg border border-red-200">
                {errors.root.message}
              </div>
            )}

            {/* Action Buttons - Responsive */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || selectedJury.length === 0}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating Session...
                  </div>
                ) : (
                  "Create Session"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
