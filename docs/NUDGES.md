# Nudges System Documentation

The proactive nudges system provides context-aware suggestions and reminders to family members. It's completely opt-in and disabled by default.

## Enabling the System

The system is controlled by a feature flag that defaults to OFF:

```javascript
// Enable in browser console:
window.NEST_PROACTIVE_ENABLED = true

// For demo mode (emits test signals):
window.NEST_PROACTIVE_DEMO = true
```

## How It Works

1. **Signal Bus**: Distributes events throughout the system
2. **Nudge Engine**: Processes signals and creates nudges based on rules
3. **Nudge Rules**: Define conditions and generate appropriate nudges

## Architecture

- App signals readiness by dispatching `nest:app-ready` with `{ familyId }`
- Bootstrap initializes the system only when enabled
- Signal bus handles event distribution and optional database logging
- Nudge engine matches signals against rules and creates nudges

## Example Usage

### Emit a test signal:
```javascript
signalBus.emit({
  type: 'event.tomorrow',
  family_id: 'FAM_ID',
  data: { event_id: 'X' }
});
```

This should create a row in the 'nudges' table and emit a 'ui.nudge.created' signal for UI subscribers.

## Current Rules

1. **Birthday Planning**: Triggers 3 days before birthdays with preparation steps
2. **Event Preparation**: Triggers for tomorrow's events with checklist

## Database Tables

- `signals`: Event log with family-based RLS
- `nudges`: Generated suggestions with status tracking

## Safety Features

- Default OFF via feature flag
- 6-hour cooldown per rule per family
- Silent failure for database operations
- No breaking changes to existing functionality

## Future Extensions

To add new nudge types:
1. Add rule to `nudge-rules.js`
2. Emit appropriate signals from relevant components
3. Handle new nudge types in UI components