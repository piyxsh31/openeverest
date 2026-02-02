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

import { Box, Grid, Paper } from '@mui/material';
import { useState, useEffect } from 'react';
import { JsonEditorPanel } from './json-editor-panel/json-editor-panel';
import { DynamicForm } from './dynamic-form-preview/dynamic-form-preview';
import schemaData from './ui-generator-schema.json';
import { topologyUiSchemas } from '../../components/ui-generator/ui-generator.mock';
import { TopologyUISchemas } from '../../components/ui-generator/ui-generator.types';

export const UIGeneratorBuilder = () => {
  const defaultJsonText = JSON.stringify(schemaData, null, 2);
  const [jsonText, setJsonText] = useState(defaultJsonText);
  const [parsedJson, setParsedJson] = useState<TopologyUISchemas | null>(null);
  const [error, setError] = useState<string>('');
  // const topologies = Object.keys(topologyUiSchemas);

  // Initialize parsed JSON on mount
  useEffect(() => {
    validateJson(defaultJsonText);
  }, []);

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    validateJson(text);
  };

  const validateJson = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      setParsedJson(parsed as TopologyUISchemas);
      setError('');
    } catch (err) {
      setError(
        err instanceof SyntaxError
          ? `JSON Error: ${err.message}`
          : 'Invalid JSON'
      );
      setParsedJson(null);
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonText(formatted);
      setParsedJson(parsed);
      setError('');
    } catch (err) {
      setError('Invalid JSON format');
    }
  };

  return (
    <Box
      sx={{
        height: 'calc(100vh - 150px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Grid
        container
        spacing={3}
        sx={{ flex: 1, height: 'calc(100vh - 280px)' }}
      >
        <Grid item xs={12} sm={3} sx={{ display: 'flex', height: '100%' }}>
          <JsonEditorPanel
            jsonText={jsonText}
            error={error}
            onChange={handleJsonChange}
            onFormat={formatJson}
          />
        </Grid>
        <Grid item xs={12} sm={9} sx={{ display: 'flex', height: '100%' }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              width: '100%',
              height: '100%',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {parsedJson && (
              <DynamicForm schema={parsedJson as TopologyUISchemas} />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
