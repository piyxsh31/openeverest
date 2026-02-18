import { Box, Paper } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { JsonEditorPanel } from './json-editor-panel/json-editor-panel';
import schemaData from './ui-generator-schema.json';
import { TopologyUISchemas } from '../../components/ui-generator/ui-generator.types';
import { ErrorBoundary } from 'utils/ErrorBoundary';
import { GenericError } from 'pages/generic-error/GenericError';
import { ErrorContextProvider } from 'utils/ErrorBoundaryProvider';
import { DynamicForm } from './dynamic-form-preview/dynamic-form-preview';

export const UIGeneratorBuilder = () => {
  const defaultJsonText = JSON.stringify(schemaData, null, 2);
  const [jsonText, setJsonText] = useState(defaultJsonText);
  const [parsedJson, setParsedJson] = useState<TopologyUISchemas | null>(null);
  const [error, setError] = useState<string>('');
  const [leftWidth, setLeftWidth] = useState(25); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // const topologies = Object.keys(topologyUiSchemas);

  // Initialize parsed JSON on mount
  useEffect(() => {
    validateJson(defaultJsonText);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;

      if (newLeftWidth >= 20 && newLeftWidth <= 80) {
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

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
      ref={containerRef}
      sx={{
        height: 'calc(100vh - 150px)',
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          width: `${leftWidth}%`,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: isDragging ? 'none' : 'width 0.2s ease',
        }}
      >
        <JsonEditorPanel
          jsonText={jsonText}
          error={error}
          onChange={handleJsonChange}
          onFormat={formatJson}
        />
      </Box>
      <Box
        onMouseDown={() => setIsDragging(true)}
        sx={{
          width: '8px',
          height: '100%',
          backgroundColor: 'divider',
          cursor: 'col-resize',
          userSelect: 'none',
          '&:hover': {
            backgroundColor: 'primary.main',
            opacity: 0.6,
          },
          transition: isDragging ? 'none' : 'backgroundColor 0.2s ease',
        }}
      />

      <Box
        sx={{
          flex: 1,
          width: `${100 - leftWidth}%`,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: isDragging ? 'none' : 'width 0.2s ease',
          overflow: 'hidden',
        }}
      >
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
          {/*TODO add custom error boundary for FormBuilder*/}
          {parsedJson && (
            <ErrorContextProvider>
              <ErrorBoundary fallback={<GenericError />}>
                <DynamicForm schema={parsedJson as TopologyUISchemas} />
              </ErrorBoundary>
            </ErrorContextProvider>
          )}
        </Paper>
      </Box>
    </Box>
  );
};
