import { Label } from '@/components/ui/label'
import { cn } from '@/utils'

interface FormFieldProps {
  label?: React.ReactNode
  htmlFor?: string
  error?: React.ReactNode
  hint?: React.ReactNode
  required?: boolean
  className?: string
  children: React.ReactNode
}

/**
 * Form layout wrapper — shadcn Label + control + error/hint text.
 * The control (input, select, textarea, ...) is passed as children so the
 * wrapper works with any field type. Callers own i18n for label/error/hint.
 */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label htmlFor={htmlFor}>
          {label}
          {required && (
            <span className="ml-0.5 text-destructive" aria-hidden="true">
              *
            </span>
          )}
        </Label>
      )}
      {children}
      {error ? (
        <p
          id={htmlFor ? `${htmlFor}-error` : undefined}
          className="text-xs font-medium text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

