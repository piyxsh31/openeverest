import { SelectInput, TextInput } from "@percona/ui-lib";

export type OpenAPIObjectProperties = {
    label?: string;

};

export enum FieldType {
    Number = "number",
    Select = "select",
}

export enum GroupType {
    Accordion = "accordion",
}

export const muiComponentMap: Record<string, React.ElementType> = {
    [FieldType.Number]: TextInput,
    [FieldType.Select]: SelectInput,
};

// export type muiComponentMap: Record<string, React.ElementType> = {
//     Number: TextInput,
//     Switch: TextInput,
//     Checkbox: Checkbox,
//     TextArea: TextInput,
//     StorageClassSelect: TextInput,
//     Toggle: TextInput,
//     Select: SelectInput,
// };

type BaseFieldParams = {
    label?: string;
    description?: string;
};

type FieldParamsMap = {
    // TODO & TextFieldProps (https://mui.com/material-ui/api/text-field/)
    //  idially it should give access to all native mui properties that require a string value
    // (without references to root, react components, etc.)
    number: BaseFieldParams & {
        maxLength?: number;
        placeholder?: string;
    };
    select: BaseFieldParams & {
        options: { label: string; value: string }[];
    };
    other: BaseFieldParams & {
        badge?: string;
        options?: { label: string; value: string }[];
        placeholder?: string;
        default?: string;
    };
};

// Либо path, либо id - но не оба и не ни один
type PathOrId =
    | { path: string; id?: never }
    | { id: string; path?: never };

export type Component = {
    [K in keyof FieldParamsMap]: {
        uiType: K;
        techPreview?: boolean;
        fieldParams: FieldParamsMap[K];
    } & PathOrId;
}[keyof FieldParamsMap];

export type ComponentGroup = {
    uiType: 'Group';
    groupType?: GroupType;
    components: { [key: string]: Component } | ComponentGroup;
};

export type Section = {
    name?: string;
    description?: string;
    components: { [key: string]: Component } | ComponentGroup;
};

export type TopologyUISchemas = {
    // TODISCUSS
    // we can put Sections on the same level as topology key, but lefted for now, for case
    // if we will want more properties for topology
    [key: string]: {
        //section - is a part of a form, plugin developer can put all component of the form 
        // to one section and in will be one step in the form
        sections: {
            [key: string]: Section;
        },
        //allow plugin developer to set order of sections in the form (steps)
        sectionsOrder?: string[];
    };
}