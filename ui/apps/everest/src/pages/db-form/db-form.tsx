import React, { useMemo, useState } from "react";
import { Component, ComponentGroup, Section, TopologyUISchemas } from "./types";
import { topologyUiSchemas } from "./mock";
import { Box, MenuItem, Stack, Step, StepLabel, Typography } from "@mui/material";
import { SelectInput, Stepper } from '@percona/ui-lib';
import DatabaseFormStepControllers from "pages/database-form/database-form-body/DatabaseFormStepControllers";
import { FormProvider, useForm } from "react-hook-form";
import { StepHeader } from "pages/database-form/database-form-body/steps/step-header/step-header";
import UIGroup from "./ui-generator/ui-group/ui-group";
import UIComponent from "./ui-generator/ui-component/ui-component";

const getSteps = (selectedTopology: string, topologyUiSchemas: TopologyUISchemas) => {
    return topologyUiSchemas[selectedTopology]?.sections || [];
};

const orderComponents = (
    components: { [key: string]: Component } | ComponentGroup,
    componentsOrder?: string[]
): [string, Component | ComponentGroup][] => {
    const entries = Object.entries(components);

    if (!componentsOrder || componentsOrder.length === 0) {
        return entries;
    }

    const componentMap = new Map(entries);
    const orderedEntries: [string, Component | ComponentGroup][] = [];
    const unorderedKeys = new Set(entries.map(([key]) => key));

    componentsOrder.forEach((key) => {
        if (componentMap.has(key)) {
            orderedEntries.push([key, componentMap.get(key)!]);
            unorderedKeys.delete(key);
        }
    });

    unorderedKeys.forEach((key) => {
        orderedEntries.push([key, componentMap.get(key)!]);
    });

    return orderedEntries;
};

const renderComponent = ({
    key,
    item,
    name,
    siblings = [],
}: {
    key: string;
    item: Component | ComponentGroup;
    name: string;
    siblings?: (Component | ComponentGroup)[]
}
): React.ReactNode => {
    debugger;
    const fieldName = name;
    const isGroup = item?.uiType === 'group' && 'components' in item;

    const hasGroupSibling = siblings.some(
        (sib) => sib.uiType === 'group' && 'components' in sib
    );

    const nestingLevel = fieldName.split('.').length;
    debugger;
    const children = isGroup ? (
        orderComponents(
            (item as ComponentGroup).components,
            (item as ComponentGroup).componentsOrder
        ).map(([childKey, childItem]) => {
            debugger;
            const subSiblings = Object.values((item as ComponentGroup).components);
            console.log('subSiblings', subSiblings);
            return renderComponent({
                key: childKey,
                item: childItem,
                name: `${fieldName}.${childKey}`,
                siblings: subSiblings
            })
        })
    ) : (
        <UIComponent
            item={item as Component}
            name={fieldName}
        />
    );


    if (isGroup) {
        return (
            <UIGroup
                key={key}
                item={item}
                groupType={(item as ComponentGroup).groupType}
                groupParams={(item as ComponentGroup).groupParams}
            >
                {children}
            </UIGroup>
        )
    }

    return <>{children}</>
    //TODO in this place we can prepare a different type of wrapper, like accordion a

};


const getActiveStepContent = (activeStep: number, sections: { [key: string]: Section }, stepLabels: string[]) => {
    const section = sections[stepLabels[activeStep]];
    const components = section?.components;
    debugger;
    //TODO we can handle differenc scenarious for section with emoty ui components
    //TODO we should add a checking that uiType exists
    if (!components || Object.keys(components).length === 0) {
        return <Typography>No components available for this step</Typography>;
    }

    const orderedComponents = orderComponents(components, section?.componentsOrder);

    return (
        <Stack spacing={2}>
            {orderedComponents.map(([key, item]) => {
                debugger
                console.log(key, item, Object.values(components));
                return renderComponent({ key, item, name: key, siblings: Object.values(components) })
            }
            )}
        </Stack>
    )
}

export const DatabasePageGenerated = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [selectedTopology, setSelectedTopology] = useState<string>('');

    // const selectedTopology = 'replica';
    const topologies = Object.keys(topologyUiSchemas);
    const steps = getSteps(selectedTopology, topologyUiSchemas);
    debugger;
    const stepLabels = useMemo(() => ['topology', ...Object.keys(steps)], [steps]);

    const methods = useForm({
        mode: 'onChange',
        // resolver: async (data, context, options) => {
        // //   const customResolver = zodResolver(schema);
        //   const result = await customResolver(data, context, options);
        //   return result;
        // },
        // defaultValues,
    });

    //TODO: set defaults for topology after selection
    //TODO: check StepHeader empty fields

    return (
        <FormProvider {...methods}>
            <Stepper noConnector activeStep={activeStep} sx={{ marginBottom: 4 }}>
                {stepLabels.map((_, idx) => (
                    <Step key={`step-${idx + 1}`}>
                        <StepLabel />
                    </Step>
                ))}
            </Stepper>
            <Stack spacing={2} sx={{ marginTop: 2 }}>
                <StepHeader
                    pageTitle={steps[stepLabels[activeStep]]?.name ?? (stepLabels[activeStep] || '')}
                    pageDescription={steps[stepLabels[activeStep]]?.description ?? ''}
                />
                {activeStep === 0 ? (
                    <SelectInput
                        name="topology.type"
                        label="topology type"
                    >
                        {topologies.map((topKey) => (
                            <MenuItem
                                value={topKey}
                                key={topKey}
                                onClick={() => setSelectedTopology(topKey)}                            >
                                {topKey}
                            </MenuItem>
                        ))}
                    </SelectInput>
                ) : (
                    <>
                        {getActiveStepContent(activeStep, steps, stepLabels)}
                        {/* {Object.entries(groupedComponents).map(
                            ([groupName, groupProperties]) => {
                                if (
                                    typeof groupProperties === 'object' &&
                                    groupProperties !== null &&
                                    'uiType' in groupProperties
                                ) {
                                    const siblings = Object.values(
                                        groupedComponents
                                    ) as ComponentProperties[];
                                    return renderComponentGroup({
                                        name: `${parent}.${groupName}`,
                                        properties: groupProperties,
                                        isTopLevel: true,
                                        siblings,
                                    });
                                }
                                return null;
                            }
                        )} */}
                    </>
                )}
            </Stack>
            <DatabaseFormStepControllers
                disableBack={activeStep === 0}
                disableSubmit={
                    activeStep !== stepLabels.length - 1 ||
                    Object.keys(methods.formState.errors).length > 0
                }
                showSubmit={activeStep === stepLabels.length - 1}
                onPreviousClick={() => setActiveStep((prev) => prev - 1)}
                onNextClick={() => setActiveStep((prev) => prev + 1)}
                onSubmit={() => { }}
                onCancel={() => { }}
            />
        </FormProvider>
    )
}