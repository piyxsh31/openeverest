import { useState } from "react";
import { TopologyUISchemas } from "./types";
import { topologyUiSchemas } from "./mock";
import { Step, StepLabel, Stepper } from "@mui/material";

const getSteps = (selectedTopology: string, topologyUiSchemas: TopologyUISchemas) => {
    return topologyUiSchemas[selectedTopology]?.sections || [];
};

export const DatabasePage = () => {
    const [activeStep, setActiveStep] = useState(0);
    // const [selectedTopology, setSelectedTopology] = useState<string>('');

    const selectedTopology = 'replica';
    const steps = getSteps(selectedTopology, topologyUiSchemas);

    return (
        <>
            <Stepper noConnector activeStep={activeStep} sx={{ marginBottom: 4 }}>
                {steps.map((_, idx) => (
                    <Step key={`step-${idx + 1}`}>
                        <StepLabel />
                    </Step>
                ))}
            </Stepper>
        </>)
}