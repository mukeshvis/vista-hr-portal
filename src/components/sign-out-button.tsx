import { Button } from "@/components/ui/button"
import { signOutAction } from "@/lib/actions/auth"
import { LogOut } from "lucide-react"

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="outline" size="sm" className="flex items-center gap-2">
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:block">Sign Out</span>
      </Button>
    </form>
  )
}