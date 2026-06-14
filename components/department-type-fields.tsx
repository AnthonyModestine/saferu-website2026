"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FieldError } from "@/components/form-messages"
import { DEPARTMENT_TYPES } from "@/lib/department-types"
import { cn } from "@/lib/utils"
import { invalidFieldClass } from "@/lib/signup-validation"

interface DepartmentTypeFieldsProps {
  idPrefix?: string
  departmentType: string
  departmentOther: string
  onDepartmentTypeChange: (value: string) => void
  onDepartmentOtherChange: (value: string) => void
  departmentTypeError?: string
  departmentOtherError?: string
  onClearDepartmentTypeError?: () => void
  onClearDepartmentOtherError?: () => void
}

export function DepartmentTypeFields({
  idPrefix = "",
  departmentType,
  departmentOther,
  onDepartmentTypeChange,
  onDepartmentOtherChange,
  departmentTypeError,
  departmentOtherError,
  onClearDepartmentTypeError,
  onClearDepartmentOtherError,
}: DepartmentTypeFieldsProps) {
  const typeId = `${idPrefix}departmentType`
  const otherId = `${idPrefix}departmentOther`

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={typeId}>
          Department Type <span className="text-red-600">*</span>
        </Label>
        <Select
          value={departmentType}
          onValueChange={(v) => {
            onDepartmentTypeChange(v)
            onClearDepartmentTypeError?.()
            if (v !== "other") onClearDepartmentOtherError?.()
          }}
        >
          <SelectTrigger
            id={typeId}
            aria-invalid={Boolean(departmentTypeError)}
            className={cn(departmentTypeError && invalidFieldClass)}
          >
            <SelectValue placeholder="Select department type" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENT_TYPES.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={departmentTypeError} />
      </div>

      {departmentType === "other" && (
        <div className="space-y-2">
          <Label htmlFor={otherId}>
            Describe your department <span className="text-red-600">*</span>
          </Label>
          <Input
            id={otherId}
            placeholder="e.g. Campus Security, Tribal Police, Public Works"
            value={departmentOther}
            onChange={(e) => {
              onDepartmentOtherChange(e.target.value)
              onClearDepartmentOtherError?.()
            }}
            aria-invalid={Boolean(departmentOtherError)}
            className={cn(
              "placeholder:text-muted-foreground/60",
              departmentOtherError && invalidFieldClass
            )}
          />
          <FieldError message={departmentOtherError} />
        </div>
      )}
    </>
  )
}
