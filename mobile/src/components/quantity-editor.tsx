import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function QuantityEditor({
  value,
  pending = false,
  onSave,
}: {
  value: number
  pending?: boolean
  onSave: (next: string) => Promise<void> | void
}) {
  const [draft, setDraft] = useState(String(value))
  const dirty = draft !== String(value)

  return (
    <div className="flex gap-2">
      <Input inputMode="decimal" value={draft} onChange={(event) => setDraft(event.target.value)} />
      <Button
        disabled={!dirty || pending}
        type="button"
        variant={dirty ? 'default' : 'secondary'}
        onClick={() => void onSave(draft)}
      >
        {pending ? '…' : 'Guardar'}
      </Button>
    </div>
  )
}
