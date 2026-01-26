import React from 'react';
import { useForm } from 'react-hook-form';
import { evaluate } from '@marcbachmann/cel-js';

/**
 * Extracts field references from a CEL expression
 * Returns array of field names that are referenced
 */
function extractFieldDependencies(expression: string): string[] {
    const dependencies: string[] = [];

    // Match form["field-name"]
    const bracketMatches = expression.matchAll(/form\["([^"]+)"\]/g);
    for (const match of bracketMatches) {
        dependencies.push(match[1]);
    }

    // Match form.field.name patterns
    const dotMatches = expression.matchAll(/form\.([a-zA-Z0-9_.]+)/g);
    for (const match of dotMatches) {
        dependencies.push(match[1]);
    }

    return [...new Set(dependencies)]; // Remove duplicates
}

/**
 * Pre-processes components to build a dependency map
 * Returns: { fieldName: [components that depend on this field] }
 */
function buildDependencyMap(components: any[]) {
    const dependencyMap: Record<string, any[]> = {};

    components.forEach(component => {
        if (!component.advancedConfiguration?.expression) {
            return;
        }

        const expression = component.advancedConfiguration.expression;
        const dependencies = extractFieldDependencies(expression);

        // For each field this component depends on, add the component to the map
        dependencies.forEach(fieldName => {
            if (!dependencyMap[fieldName]) {
                dependencyMap[fieldName] = [];
            }
            dependencyMap[fieldName].push(component);
        });
    });

    return dependencyMap;
}

// Component configuration from README
const components = [
    {
        uiType: 'select',
        path: 'specEngineVersion',
        fieldParams: {
            label: 'Database Version',
            options: [
                { label: '6.0.19-16', value: '6.0.19-16-old' },
                { label: '6.0.21-18', value: '6.0.21-18' },
                { label: '7.0.18-11', value: '7.0.18-11' },
            ],
        },
        advancedConfiguration: {
            expression: 'form["set-old-db-version-checkbox"] == true ? "6.0.19-16-old" : form["specEngineVersion"]',
            // Optional: hide field when checkbox is checked
            visible: 'form["set-old-db-version-checkbox"] == false'
        }
    },
    {
        uiType: 'Checkbox',
        id: 'set-old-db-version-checkbox',
        fieldParams: {
            label: 'Use oldest database version',
            defaultValue: false,
        }
    }
];

// Pre-process ONCE: Build dependency map
const dependencyMap = buildDependencyMap(components);
console.log('Dependency map:', dependencyMap);
// Output: { 'set-old-db-version-checkbox': [versionComponent], 'spec.engine.version': [versionComponent] }

// Get list of fields that are triggers (have dependents)
const triggerFields = Object.keys(dependencyMap);
console.log('Trigger fields:', triggerFields);
// Output: ['set-old-db-version-checkbox', 'specEngineVersion']

export function DatabaseFormExample() {
    const { register, watch, setValue, getValues } = useForm({
        defaultValues: {
            'set-old-db-version-checkbox': false,
            'specEngineVersion': '6.0.21-18',
        }
    });

    // Generic callback to handle field changes
    const handleFieldDependencies = React.useCallback((triggerField: string) => {
        const formState = getValues();
        const dependentComponents = dependencyMap[triggerField];

        if (!dependentComponents) return;

        dependentComponents.forEach(component => {
            const expression = component.advancedConfiguration.expression;

            // Build context: use flat form state directly
            const context = {
                form: formState
            };

            const newValue = evaluate(expression, context);

            if (newValue !== undefined) {
                const fieldName = component.path || component.id;
                if (fieldName) {
                    setValue(fieldName, newValue);
                }
            }
        });
    }, [getValues, setValue]);

    // Create individual watchers for each trigger field
    triggerFields.forEach(triggerField => {
        const fieldValue = watch(triggerField);
        
        React.useEffect(() => {
            handleFieldDependencies(triggerField);
        }, [fieldValue, handleFieldDependencies]);
    });

    // Helper to check if a component should be visible
    const isComponentVisible = (component: any) => {
        if (!component.advancedConfiguration?.visible) {
            return true; // No visibility condition = always visible
        }

        const formState = getValues();
        const context = { form: formState };
        
        try {
            return evaluate(component.advancedConfiguration.visible, context);
        } catch {
            return true; // On error, show the field
        }
    };

    return (
        <form>
            <div>
                <label>
                    <input
                        type="checkbox"
                        {...register('set-old-db-version-checkbox')}
                    />
                    Use oldest database version
                </label>
            </div>

            {isComponentVisible(components[0]) && (
                <div>
                    <label>Database Version</label>
                    <select {...register('specEngineVersion')}>
                        <option value="6.0.19-16-old">6.0.19-16</option>
                        <option value="6.0.21-18">6.0.21-18</option>
                        <option value="7.0.18-11">7.0.18-11</option>
                    </select>
                </div>
            )}
        </form>
    );
}
