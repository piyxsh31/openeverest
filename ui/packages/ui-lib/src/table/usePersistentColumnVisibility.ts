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

import { MRT_Updater, MRT_VisibilityState } from 'material-react-table';
import { useEffect, useState } from 'react';
import {
  filterHiddenColumns,
  isObjectEmpty,
} from './usePersistentColumnVisibility.utils';

const usePersistentColumnVisibility = (
  key: string
): [
  MRT_VisibilityState,
  (updater: MRT_Updater<MRT_VisibilityState>) => void,
] => {
  const [localStorageValue, setLocalStorageValue] =
    useState<MRT_VisibilityState>(() => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          return JSON.parse(value);
        }
        return {};
      } catch {
        return {};
      }
    });

  const setLocalStorageStateValue = (
    updater: MRT_Updater<MRT_VisibilityState>
  ) => {
    setLocalStorageValue((prevValues: MRT_VisibilityState) =>
      updater instanceof Function ? updater(prevValues) : updater
    );
  };

  useEffect(() => {
    if (!isObjectEmpty(localStorageValue)) {
      const hiddenColumns = filterHiddenColumns(localStorageValue);

      if (!isObjectEmpty(hiddenColumns)) {
        localStorage.setItem(key, JSON.stringify(hiddenColumns));
      } else {
        localStorage.removeItem(key);
      }
    }
  }, [localStorageValue]);

  return [localStorageValue, setLocalStorageStateValue];
};

export default usePersistentColumnVisibility;
