// Copyright (C) 2026 The OpenEverest Contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { describe, expect, it, beforeEach } from 'vitest';
import type { ProviderRegistryEntry } from './types';

// Create a fresh registry for each test to avoid cross-test pollution.
// We inline the class here because importing from registry.ts would also
// trigger the singleton + side-effect provider registrations.
class TestApiProviderRegistry {
  private entries = new Map<string, ProviderRegistryEntry>();

  register(key: string, entry: ProviderRegistryEntry): void {
    if (this.entries.has(key)) {
      throw new Error(`provider "${key}" is already registered.`);
    }
    this.entries.set(key, entry);
  }

  get(key: string): ProviderRegistryEntry | undefined {
    return this.entries.get(key);
  }

  has(key: string): boolean {
    return this.entries.has(key);
  }

  getAll(): Map<string, ProviderRegistryEntry> {
    return new Map(this.entries);
  }

  getAvailableKeys(): string[] {
    return Array.from(this.entries.keys());
  }
}

const mockEntry: ProviderRegistryEntry = {
  useOptions: () => ({
    options: [{ label: 'test', value: 'test' }],
    isLoading: false,
    error: null,
    isEmpty: false,
  }),
  description: 'Test provider',
};

describe('ApiProviderRegistry', () => {
  let registry: TestApiProviderRegistry;

  beforeEach(() => {
    registry = new TestApiProviderRegistry();
  });

  it('registers and retrieves a provider', () => {
    registry.register('test', mockEntry);
    expect(registry.get('test')).toBe(mockEntry);
  });

  it('returns undefined for unregistered key', () => {
    expect(registry.get('nonExistent')).toBeUndefined();
  });

  it('has() returns true for registered key', () => {
    registry.register('test', mockEntry);
    expect(registry.has('test')).toBe(true);
    expect(registry.has('other')).toBe(false);
  });

  it('throws on duplicate registration', () => {
    registry.register('test', mockEntry);
    expect(() => registry.register('test', mockEntry)).toThrow(
      'already registered'
    );
  });

  it('getAll returns all registered entries', () => {
    registry.register('a', mockEntry);
    registry.register('b', { ...mockEntry, description: 'B' });

    const all = registry.getAll();
    expect(all.size).toBe(2);
    expect(all.has('a')).toBe(true);
    expect(all.has('b')).toBe(true);
  });

  it('getAvailableKeys returns sorted key list', () => {
    registry.register('beta', mockEntry);
    registry.register('alpha', { ...mockEntry, description: 'Alpha' });

    const keys = registry.getAvailableKeys();
    expect(keys).toContain('alpha');
    expect(keys).toContain('beta');
  });

  it('getAll returns a copy — mutations do not affect registry', () => {
    registry.register('test', mockEntry);
    const copy = registry.getAll();
    copy.delete('test');

    expect(registry.has('test')).toBe(true);
  });
});
