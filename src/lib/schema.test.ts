import { describe, expect, it } from 'vitest';
import { ENTITIES, entityDef, toBody } from './schema';

describe('form schema', () => {
  it('covers every content type the API accepts', () => {
    expect(ENTITIES.map((e) => e.type).sort()).toEqual(['category', 'channel', 'collection', 'daily_reading', 'liturgical_day', 'library_item', 'media_item', 'reflection'].sort());
  });
  it('converts numbers and clears emptied optional fields when editing', () => {
    const d = entityDef('library_item')!;
    const b = toBody(d, { tab: 'prayers', title: ' Rosary ', chapter_count: '12', author: '' }, true);
    expect(b).toMatchObject({ tab: 'prayers', title: 'Rosary', chapter_count: 12, author: null });
  });
  it('omits empty optional fields on create and never sends a locked date when editing', () => {
    const d = entityDef('liturgical_day')!;
    expect('season' in toBody(d, { day: '2026-10-30', color: 'green' }, false) && toBody(d, { day: '2026-10-30', color: 'green' }, false).season !== undefined).toBe(false);
    expect('day' in toBody(d, { day: '2026-10-30', color: 'white' }, true)).toBe(false);
  });
  it('sends booleans explicitly', () => {
    expect(toBody(entityDef('media_item')!, { kind: 'audio', title: 't', is_recommended: true }, false).is_recommended).toBe(true);
  });
});
