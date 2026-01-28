import { Box, Stack } from "@mui/material";
import { ComponentGroup, componentGroupMap, GroupType } from "pages/db-form/types";
import React from "react";

export type UIGroupProps = {
    children: React.ReactNode;
    groupType?: GroupType;
    groupParams?: Record<string, any>;
    item?: ComponentGroup;
};

const UIGroup = ({ groupType, children, groupParams, item }: UIGroupProps) => {
    const Component = groupType ? componentGroupMap[groupType] : undefined;
    debugger;

    return (
        <>
            {Component ? React.createElement(
                Component,
                {
                    children,
                    label: item?.name
                },
            ) : <Stack spacing={2}>{children}</Stack>}
        </>
    )

}

export default UIGroup