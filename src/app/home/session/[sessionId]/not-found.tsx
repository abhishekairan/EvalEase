import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function SessionNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center animate-fade-in">
          <div className="rounded-full bg-gray-100 p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <FileQuestion className="h-10 w-10 text-gray-400" aria-hidden="true" />
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Session Not Found
          </h1>
          
          <p className="text-gray-600 mb-8">
            The session you're looking for doesn't exist or you don't have permission to access it.
            Please check the URL or return to your sessions list.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/home">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 w-full"
                aria-label="Go back to sessions list"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to Sessions
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" className="gap-2 w-full" aria-label="Go to home page">
                <Home className="h-4 w-4" aria-hidden="true" />
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
