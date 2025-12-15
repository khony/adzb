import { Badge } from '@/components/ui/badge'

interface RecipientBadgesProps {
  recipients: string
  maxDisplay?: number
}

export function RecipientBadges({ recipients, maxDisplay = 3 }: RecipientBadgesProps) {
  const recipientList = recipients.split(',').map((r) => r.trim()).filter(Boolean)
  const displayedRecipients = recipientList.slice(0, maxDisplay)
  const remaining = recipientList.length - maxDisplay

  return (
    <div className="flex flex-wrap gap-1">
      {displayedRecipients.map((recipient, index) => (
        <Badge key={index} variant="outline" className="text-xs">
          {recipient}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="secondary" className="text-xs">
          +{remaining}
        </Badge>
      )}
    </div>
  )
}
