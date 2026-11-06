/** Form definitions. They mirror WRITE_SCHEMAS in the API; the API remains the source of truth and re-validates everything. */
export type FieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'date' | 'datetime' | 'asset' | 'uuid';
export interface Field { name: string; label: string; type: FieldType; required?: boolean; options?: string[]; help?: string; lockedOnEdit?: boolean }
export interface EntityDef { type: string; label: string; plural: string; titleField: string; fields: Field[]; hasSections?: boolean }

const sortOrder: Field = { name: 'sort_order', label: 'Sort order', type: 'number' };

export const ENTITIES: EntityDef[] = [
  { type: 'liturgical_day', label: 'Liturgical day', plural: 'Calendar', titleField: 'day', fields: [
    { name: 'day', label: 'Date', type: 'date', required: true, lockedOnEdit: true },
    { name: 'season', label: 'Season', type: 'text' }, { name: 'celebration', label: 'Celebration', type: 'text' }, { name: 'rank', label: 'Rank', type: 'text' },
    { name: 'color', label: 'Liturgical colour', type: 'select', required: true, options: ['green', 'purple', 'white', 'red', 'rose', 'gold'] }] },
  { type: 'daily_reading', label: 'Daily reading', plural: 'Daily readings', titleField: 'day', hasSections: true, fields: [
    { name: 'day', label: 'Date', type: 'date', required: true }, { name: 'locale', label: 'Language', type: 'select', options: ['en', 'sw'] },
    { name: 'memorial', label: 'Memorial / feast', type: 'text' }, { name: 'summary', label: 'Summary', type: 'textarea' }] },
  { type: 'reflection', label: 'Reflection', plural: 'Reflections', titleField: 'title', fields: [
    { name: 'day', label: 'Date', type: 'date', required: true }, { name: 'locale', label: 'Language', type: 'select', options: ['en', 'sw'] },
    { name: 'title', label: 'Title', type: 'text', required: true }, { name: 'body', label: 'Body', type: 'textarea', required: true },
    { name: 'reading_id', label: 'Linked reading id', type: 'uuid' }] },
  { type: 'library_item', label: 'Library item', plural: 'Library', titleField: 'title', fields: [
    { name: 'tab', label: 'Tab', type: 'select', required: true, options: ['explorer', 'prayers'] },
    { name: 'category_id', label: 'Category id', type: 'uuid' }, { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'author', label: 'Author', type: 'text' }, { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'cover_asset_id', label: 'Cover image (asset id)', type: 'asset', help: 'Required to publish' },
    { name: 'file_asset_id', label: 'File (asset id)', type: 'asset' }, { name: 'chapter_count', label: 'Chapters', type: 'number' }, sortOrder] },
  { type: 'media_item', label: 'Sermon / media', plural: 'Sermons & media', titleField: 'title', fields: [
    { name: 'kind', label: 'Kind', type: 'select', required: true, options: ['video', 'short', 'audio'] },
    { name: 'title', label: 'Title', type: 'text', required: true }, { name: 'speaker', label: 'Speaker', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' }, { name: 'channel_id', label: 'Channel id', type: 'uuid' },
    { name: 'category_id', label: 'Category id', type: 'uuid' }, { name: 'duration_s', label: 'Duration (seconds)', type: 'number' },
    { name: 'media_asset_id', label: 'Media (asset id)', type: 'asset', help: 'Required to publish' },
    { name: 'thumbnail_asset_id', label: 'Thumbnail (asset id)', type: 'asset' },
    { name: 'published_on', label: 'Published on', type: 'datetime' }, { name: 'is_recommended', label: 'Recommended', type: 'boolean' }] },
  { type: 'channel', label: 'Channel', plural: 'Channels', titleField: 'name', fields: [
    { name: 'name', label: 'Name', type: 'text', required: true }, { name: 'avatar_asset_id', label: 'Avatar (asset id)', type: 'asset' }] },
  { type: 'collection', label: 'Collection', plural: 'Collections', titleField: 'title', fields: [
    { name: 'title', label: 'Title', type: 'text', required: true }, { name: 'subtitle', label: 'Subtitle', type: 'text' },
    { name: 'cover_asset_id', label: 'Cover (asset id)', type: 'asset' }, sortOrder] },
  { type: 'category', label: 'Category', plural: 'Categories', titleField: 'title_en', fields: [
    { name: 'scope', label: 'Scope', type: 'select', required: true, options: ['library_explorer', 'library_prayers', 'audio', 'video', 'home'] },
    { name: 'slug', label: 'Slug (a-z, 0-9, -)', type: 'text', required: true }, { name: 'title_en', label: 'Title (English)', type: 'text', required: true },
    { name: 'title_sw', label: 'Title (Swahili)', type: 'text' }, sortOrder] },
];
export const entityDef = (t: string) => ENTITIES.find((e) => e.type === t);

export const SECTION_KINDS = ['first_reading', 'second_reading', 'responsorial_psalm', 'gospel_acclamation', 'gospel'] as const;

/** Converts form strings into the typed body the API expects. Empty optional fields become null so they can be cleared. */
export function toBody(def: EntityDef, values: Record<string, string | boolean>, editing: boolean): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of def.fields) {
    if (editing && f.lockedOnEdit) continue;
    const v = values[f.name];
    if (f.type === 'boolean') { out[f.name] = v === true; continue; }
    const s = typeof v === 'string' ? v.trim() : '';
    if (s === '') { if (!f.required && f.type !== 'select') out[f.name] = editing ? null : undefined; continue; }
    if (f.type === 'number') out[f.name] = Number(s);
    else if (f.type === 'datetime') out[f.name] = new Date(s).toISOString();
    else out[f.name] = s;
  }
  return out;
}
