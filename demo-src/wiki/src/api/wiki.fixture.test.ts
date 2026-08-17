import { describe, expect, it } from 'vitest';
import { getMaterialContent, listMaterials, listWikiPages } from './wiki';

describe('public Wiki fixtures', () => {
  it('ships a populated material library and topic pages', async () => {
    const materials = await listMaterials(1, 20);
    const pages = await listWikiPages(1, 20);

    expect(materials.total).toBeGreaterThanOrEqual(10);
    expect(materials.items).toHaveLength(12);
    expect(pages.total).toBeGreaterThanOrEqual(4);
    expect(pages.items.every((page) => page.title.length > 0)).toBe(true);
  });

  it('returns a dedicated public mock body for every material', async () => {
    const materials = await listMaterials(1, 20);
    const contents = await Promise.all(materials.items.map((material) => getMaterialContent(material.id)));

    expect(contents.every((content) => content.raw_text.includes('公开脱敏 mock 材料'))).toBe(true);
    expect(new Set(contents.map((content) => content.raw_text)).size).toBe(materials.items.length);
  });
});
