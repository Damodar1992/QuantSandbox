import { describe, it, expect } from 'vitest';
import {
  getAvailableVersions,
  createDefaultVersionSelection,
  applyVersionChange,
  getVersionById,
  EMPTY_VERSION_SELECTION,
} from './versionSelection';
import { MOCK_STAGE_VERSIONS_BY_STRATEGY } from '../../../constants/mockStageVersionTree';

const versions = MOCK_STAGE_VERSIONS_BY_STRATEGY[1];

describe('getVersionById', () => {
  it('returns null for missing id', () => {
    expect(getVersionById(versions, 'nonexistent')).toBeNull();
  });

  it('finds an existing version', () => {
    const first = versions[0];
    expect(getVersionById(versions, first.id)).toBe(first);
  });
});

describe('getAvailableVersions', () => {
  it('returns signal versions when no parent required', () => {
    const available = getAvailableVersions(versions, 'signal', EMPTY_VERSION_SELECTION);
    expect(available.length).toBeGreaterThan(0);
    expect(available.every((v) => v.stageType === 'signal')).toBe(true);
  });

  it('returns empty array for entry when no signal selected', () => {
    const available = getAvailableVersions(versions, 'entry', EMPTY_VERSION_SELECTION);
    expect(available).toEqual([]);
  });
});

describe('createDefaultVersionSelection', () => {
  it('selects a signal version by default', () => {
    const sel = createDefaultVersionSelection(versions);
    expect(sel.signal).not.toBeNull();
  });

  it('selects entry version when signal is available', () => {
    const sel = createDefaultVersionSelection(versions);
    if (sel.signal) {
      expect(sel.entry).not.toBeNull();
    }
  });
});

describe('applyVersionChange', () => {
  it('cascades null when signal is cleared', () => {
    const base = createDefaultVersionSelection(versions);
    const next = applyVersionChange(base, 'signal', null, versions);
    expect(next.signal).toBeNull();
    expect(next.entry).toBeNull();
  });

  it('preserves other stages when only entry changes', () => {
    const base = createDefaultVersionSelection(versions);
    const entryVersions = getAvailableVersions(versions, 'entry', base);
    if (entryVersions.length < 2) return;
    const next = applyVersionChange(base, 'entry', entryVersions[0].id, versions);
    expect(next.signal).toBe(base.signal);
  });
});
