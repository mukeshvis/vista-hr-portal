import { Button } from "@/components/ui/button"
import { signOutAction } from "@/lib/actions/auth"
import { LogOut } from "lucide-react"

interface SignOutButtonProps {
  mobile?: boolean
}

export function SignOutButton({ mobile = false }: SignOutButtonProps) {
  return (
    <form action={signOutAction} className={mobile ? "w-full" : ""}>
      <Button
        type="submit"
        size={mobile ? "default" : "sm"}
        className={`flex items-center gap-2 bg-black hover:bg-gray-800 text-white border-black ${
          mobile ? "w-full justify-center py-3" : ""
        }`}
      >
        <LogOut className={mobile ? "h-5 w-5" : "h-4 w-4"} />
        <span className={mobile ? "block" : "hidden sm:block"}>Sign Out</span>
      </Button>
    </form>
  )
}