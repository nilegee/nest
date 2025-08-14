/**
 * Nudge Rules - Define conditions and nudge generation logic
 * Contains rules for when to create nudges based on signals
 */

export const RULES = [
  {
    id: 'birthday_3day_plan',
    when: { type: 'birthday.approaching', withinDays: 3 },
    produce: (sig) => ({
      type: 'plan.birthday',
      payload: {
        person_id: sig.data?.person_id,
        steps: ['Pick dua', 'Write appreciation', 'Small surprise'],
        suggested_date: sig.data?.date
      }
    })
  },
  {
    id: 'event_tomorrow_prep',
    when: { type: 'event.tomorrow' },
    produce: (sig) => ({
      type: 'prep.event',
      payload: {
        event_id: sig.data?.event_id,
        checklist: ['Confirm time', 'Prep outfits', 'Set reminder']
      }
    })
  }
];