import { Button } from "@/components/ui/button"
import { signOutAction } from "@/lib/actions/auth"
import { LogOut } from "lucide-react"

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" size="sm" className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white border-black">
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:block">Sign Out</span>
      </Button>
    </form>
  )
}