"use client"

import * as React from "react"
import { Check } from "lucide-react"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    const [checked, setChecked] = React.useState(props.checked || false)

    React.useEffect(() => {
      if (props.checked !== undefined) {
        setChecked(props.checked)
      }
    }, [props.checked])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked
      setChecked(newChecked)
      if (onCheckedChange) {
        onCheckedChange(newChecked)
      }
      if (props.onChange) {
        props.onChange(e)
      }
    }

    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          {...props}
        />
        <div
          className={`
            h-5 w-5 rounded border-2 border-gray-300
            peer-checked:bg-emerald-600 peer-checked:border-emerald-600
            peer-focus:ring-2 peer-focus:ring-emerald-500 peer-focus:ring-offset-2
            flex items-center justify-center
            transition-all
            ${className || ""}
          `}
        >
          {checked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
        </div>
      </label>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
