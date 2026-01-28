// components/DraftsSection.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"
import { Edit, Trash2, FileText, Clock, Loader2 } from "lucide-react"
import Link from "next/link"
import { deleteDraftAction } from "@/actions/sessionActions"
import { toast } from "@/lib/toast"
import { sessionDBType } from "@/zod"

interface DraftsSectionProps {
  drafts: sessionDBType[]
}

export function DraftsSection({ drafts }: DraftsSectionProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleDeleteDraft = async (draftId: number) => {
    setDeletingId(draftId)
    try {
      await deleteDraftAction(draftId)
      toast.success("Draft deleted", {
        description: "The draft has been removed"
      })
    } catch (error) {
      console.error("Error deleting draft:", error)
      toast.error("Failed to delete draft", {
        description: "Please try again"
      })
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Not saved"
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  if (drafts.length === 0) {
    return null // Don't show section if no drafts
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-amber-600" />
        <h2 className="text-lg font-semibold text-gray-900">Draft Sessions</h2>
        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
          {drafts.length}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drafts.map((draft) => (
          <Card 
            key={draft.id} 
            className="border-amber-200 bg-amber-50/50 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base font-semibold text-gray-900 truncate">
                    {draft.name}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last edited: {formatDate(draft.updatedAt)}
                  </CardDescription>
                </div>
                <Badge 
                  variant="outline" 
                  className="bg-amber-100 text-amber-800 border-amber-300 text-xs whitespace-nowrap shrink-0"
                >
                  Draft
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pb-3">
              <p className="text-sm text-gray-500">
                Continue editing this session draft to assign jury members and teams.
              </p>
            </CardContent>

            <CardFooter className="flex gap-2 pt-2">
              <Button asChild variant="default" size="sm" className="flex-1">
                <Link href={`/dashboard/session/add?draftId=${draft.id}`}>
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Resume
                </Link>
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    disabled={deletingId === draft.id}
                  >
                    {deletingId === draft.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Discard Draft</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to discard the draft "{draft.name}"? 
                      This action cannot be undone and all unsaved progress will be lost.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteDraft(draft.id!)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Discard Draft
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
