# Member Status Auto-Update System

## Business Rules

The system automatically updates member statuses based on missed monthly contributions:

- **Inactive**: Member automatically becomes Inactive after missing **1 month** of savings
- **Dormant**: Member automatically becomes Dormant after missing **3 months** of savings

## How It Works

### Automatic Updates (Cron Job)

The system runs a daily cron job at 2:00 AM (server time) that:

1. Checks all Active, Inactive, and Dormant members
2. Calculates how many months have passed since their last contribution date
3. Updates their status automatically based on the rules above
4. Records the reason in the `deactivation_reason` field

### Manual Trigger

You can manually trigger the status update by calling:

```bash
GET /api/cron/update-member-statuses
```

This endpoint returns:
```json
{
  "success": true,
  "message": "Successfully updated X member(s)",
  "updated": 3,
  "details": [
    {
      "memberId": "MEM001",
      "name": "John Doe",
      "oldStatus": "Active",
      "newStatus": "Inactive",
      "missedMonths": 1
    }
  ],
  "timestamp": "2025-11-06T09:23:00.000Z"
}
```

## Files

- `src/lib/member-status-updater.ts` - Core logic for status updates
- `src/app/api/cron/update-member-statuses/route.ts` - API endpoint
- `vercel.json` - Cron job configuration (runs daily at 2 AM)

## Testing

### Test the cron job locally:

1. Start your development server
2. Visit: `http://localhost:3000/api/cron/update-member-statuses`
3. Check the response to see which members were updated

### Check a specific member:

```typescript
import { checkMemberStatus } from '@/lib/member-status-updater';

const result = await checkMemberStatus('member-id-here');
console.log(result);
// {
//   shouldUpdate: true,
//   currentStatus: 'Active',
//   suggestedStatus: 'Inactive',
//   missedMonths: 2
// }
```

## Deployment

When deployed to Vercel, the cron job will run automatically every day at 2:00 AM.

The cron schedule is defined in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/update-member-statuses",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## Status Flow

```
Active → (miss 1 month) → Inactive → (miss 3 months total) → Dormant
```

## Notes

- Only members with a `contribution_date` are checked
- Members with status "Closed" or "Temporary Inactive" are not affected by auto-updates
- The system uses the `contribution_date` field to calculate missed months
- Each update records the reason: "Automatically updated: Missed X month(s) of contributions"
