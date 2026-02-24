// everest
// Copyright (C) 2023 Percona LLC
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

import React from 'react';
import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';

type TopologyFieldProps = {
  topologies: string[];
  selectedTopology?: string;
  onTopologySelect?: (topology: string) => void;
};

export const TopologyField = ({
  topologies,
  selectedTopology,
  onTopologySelect,
}: TopologyFieldProps) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onTopologySelect?.(event.target.value);
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Choose Database Topology</Typography>
      <Typography variant="body2" color="text.secondary">
        Select the topology configuration for your database cluster
      </Typography>
      <FormControl component="fieldset">
        <RadioGroup
          aria-label="topology"
          name="topology"
          value={selectedTopology || ''}
          onChange={handleChange}
        >
          {topologies.map((topology) => (
            <FormControlLabel
              key={topology}
              value={topology}
              control={<Radio />}
              label={topology}
            />
          ))}
        </RadioGroup>
      </FormControl>
    </Stack>
  );
};

export default TopologyField;
