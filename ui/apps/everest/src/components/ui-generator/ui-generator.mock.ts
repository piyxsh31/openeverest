import { TopologyUISchemas } from './ui-generator.types';

export const topologyUiSchemas: TopologyUISchemas = {
  replica: {
    sections: {
      basicInfo: {
        name: 'Basic Information',
        description: 'Provide the basic information for your new database.',
        components: {
          version: {
            uiType: 'select', //it can be autocompleteselect?
            path: 'spec.engine.version',
            fieldParams: {
              label: 'Database Version',
              // in case of dbVersions we are assume that we get availableVersions values already
              // or we need to think about an extra logic an it will be special component like:
              // VersionSelect or DbVersionSelect
              options: [
                {
                  label: 'percona/percona-server-mongodb:6.0.19-16-multi',
                  value: '6.0.19-16',
                },
                {
                  label: 'percona/percona-server-mongodb:6.0.21-18',
                  value: '6.0.21-18',
                },
                {
                  label: 'percona/percona-server-mongodb:7.0.18-11',
                  value: '7.0.18-11',
                },
              ],
            },
          },
        },
      },
      resources: {
        name: 'Resources',
        description:
          'Configure the resources your new database will have access to.',
        components: {
          numberOfnodes: {
            path: 'spec.replica.nodes',
            uiType: 'number', // RadioButtons/Number/even Select
            fieldParams: {
              label: 'Number of nodes',
            },
          },
          resources: {
            uiType: 'group',
            groupType: 'line',
            components: {
              cpu: {
                path: 'spec.engine.resources.cpu',
                uiType: 'number',
                fieldParams: {
                  badge: 'CPU',
                  label: 'CPU',
                },
              },
              memory: {
                path: 'spec.engine.resources.memory',
                uiType: 'number',
                fieldParams: {
                  badge: 'Gi',
                  label: 'Memory',
                },
              },
              disk: {
                path: 'spec.engine.resources.memory',
                uiType: 'number',
                fieldParams: {
                  badge: 'Gi',
                  label: 'Disk',
                },
              },
            },
          },
        },
      },
    },
    //backups
    //advanced
    sectionsOrder: ['basicInfo', 'resources'],
  },
  // sharded: {
  //     sections: {
  //         basicInfo: {
  //             name: 'Basic Information',
  //             description: 'Provide the basic information for your new database.',
  //             components: {
  //                 version: {
  //                     uiType: 'select', //it can be autocompleteselect?
  //                     path: 'spec.engine.version',
  //                     fieldParams: {
  //                         label: 'Database Version',
  //                         // in case of dbVersions we are assume that we get availableVersions values already
  //                         // or we need to think about an extra logic an it will be special component like:
  //                         // VersionSelect or DbVersionSelect
  //                         options: [
  //                             { label: 'percona/percona-server-mongodb:6.0.19-16-multi', value: '6.0.19-16' },
  //                             { label: 'percona/percona-server-mongodb:6.0.21-18', value: '6.0.21-18' },
  //                             { label: 'percona/percona-server-mongodb:7.0.18-11', value: '7.0.18-11' },
  //                         ],
  //                     }
  //                 }
  //             }
  //         },
  //         resources: {
  //             name: 'Resources',
  //             description: 'Some description about resources',
  //             components: {
  //                 shards: {
  //                     uiType: 'number',
  //                     path: 'spec.sharding.shards',
  //                     fieldParams: {
  //                         label: 'Nº of shards',
  //                         defaultValue: 1,
  //                     }
  //                 },
  //                 numberOfnodes: {
  //                     path: 'spec.replica.nodes',
  //                     uiType: 'number', // RadioButtons/Number/even Select
  //                     fieldParams: {
  //                         label: 'Number of nodes',
  //                     }
  //                 },
  //                 numberOfConfigServers: {
  //                     uiType: 'number', //can be something like NumberTabs or custom type
  //                     path: 'spec.sharding.configServer.replicas',
  //                     fieldParams: {
  //                         label: 'Nº of configuration servers',
  //                         defaultValue: 3,
  //                     }
  //                 },
  //             },
  //             componentsOrder: ['shards', 'numberOfnodes', 'numberOfConfigServers'],
  //         },
  //         resources2: {
  //             name: 'Resources',
  //             description: 'Some description about resources',
  //             components: {
  //                 shards: {
  //                     uiType: 'number',
  //                     path: 'spec.sharding.shards',
  //                     fieldParams: {
  //                         label: 'Nº of shards',
  //                         defaultValue: 1,
  //                     }
  //                 },
  //                 numberOfnodes: {
  //                     path: 'spec.replica.nodes',
  //                     uiType: 'number', // RadioButtons/Number/even Select
  //                     fieldParams: {
  //                         label: 'Number of nodes',
  //                     }
  //                 },
  //                 numberOfConfigServers: {
  //                     uiType: 'number', //can be something like NumberTabs or custom type
  //                     path: 'spec.sharding.configServer.replicas',
  //                     fieldParams: {
  //                         label: 'Nº of configuration servers',
  //                         defaultValue: 3,
  //                     }
  //                 },
  //             },
  //             componentsOrder: ['numberOfnodes', 'numberOfConfigServers', 'shards'],
  //         },
  //     }
  // },
  // shardedInOneStep: {
  //     sections: {
  //         databaseInfo: {
  //             name: 'Basic Information',
  //             description: 'Fill the information for your new database.',
  //             components: {
  //                 version: {
  //                     uiType: 'select', //it can be autocompleteselect?
  //                     path: 'spec.engine.version',
  //                     fieldParams: {
  //                         label: 'Database Version',
  //                         // in case of dbVersions we are assume that we get availableVersions values already
  //                         // or we need to think about an extra logic an it will be special component like:
  //                         // VersionSelect or DbVersionSelect
  //                         options: [
  //                             { label: 'percona/percona-server-mongodb:6.0.19-16-multi', value: '6.0.19-16' },
  //                             { label: 'percona/percona-server-mongodb:6.0.21-18', value: '6.0.21-18' },
  //                             { label: 'percona/percona-server-mongodb:7.0.18-11', value: '7.0.18-11' },
  //                         ],
  //                     }
  //                 },
  //                 resources: {
  //                     uiType: 'group',
  //                     groupType: 'accordion',
  //                     name: 'Resources', //TODO could be could be not
  //                     // description: 'Some description about resources',
  //                     components: {
  //                         shards: {
  //                             uiType: 'number',
  //                             path: 'spec.sharding.shards',
  //                             fieldParams: {
  //                                 label: 'Nº of shards',
  //                                 defaultValue: 1,
  //                             }
  //                         },
  //                         numberOfnodes: {
  //                             path: 'spec.replica.nodes',
  //                             uiType: 'number', // RadioButtons/Number/even Select
  //                             fieldParams: {
  //                                 label: 'Number of nodes',
  //                             }
  //                         },
  //                         numberOfConfigServers: {
  //                             uiType: 'number', //can be something like NumberTabs or custom type
  //                             path: 'spec.sharding.configServer.replicas',
  //                             fieldParams: {
  //                                 label: 'Nº of configuration servers',
  //                                 defaultValue: 3,
  //                             }
  //                         },
  //                     },
  //                     componentsOrder: ['shards', 'numberOfnodes', 'numberOfConfigServers'],
  //                 },
  //             }
  //         },
  //     }
  // }
};
//TODO describe how user can set an order for components in components group
// it could be 0-name, 1-name/ weight to each component or an array of keys
// in components group if order is needed

// export const openApiObj: OpenAPIObject = {
//     topology: 'sharded',
//     sections: [
//         {
//             name: 'Basic Information',
//             description: 'Provide the basic information for your new database.',
//             components: [
//                 {
//                     // in case of dbVersions we are assume that we get availableVersions values already
//                     // or we need to think about an extra logic an it will be special component like:
//                     // VersionSelect or DbVersionSelect
//                     uiType: 'SelectInput',
//                     // matching path to an API payload
//                     path: 'spec.engine.version',
//                     fieldParams: {
//                         label: 'Database Version',
//                         helperText: 'Select the version of the database you want to use.',
//                     }
//                 } as Component<SelectInputProps>,
//                 {
//                     uiType: 'SwitchInput',
//                     path: 'spec.sharding.enabled',
//                     techPreview: true,
//                     fieldParams: {
//                         label: 'Sharded Cluster',
//                         description: 'MongoDB shards are partitions of data that distribute load and improve database scalability and performance.',

//                     }
//                 } as Component<SwitchInputProps>
//             ],
//         },
//         {
//             name: 'Resources',
//             description: 'Configure the resources your new database will have access to.',
//             components: [
//                 {
//                     uiType: 'Number',
//                     path: 'spec.sharding.shards',
//                     fieldParams: {
//                         label: 'Nº of shards',
//                         defaultValue: 1,
//                     }
//                 },
//                 {
//                     uiType: 'Group',
//                     components: [
//                         {
//                             uiType: 'Number', // RadioButtons/Number/even Select
//                             fieldParams: {
//                                 label: 'Number of nodes',
//                             }
//                         }
//                     ],

//                 },
//                 {
//                     uiType: 'Number', //can be something like NumberTabs or custom type
//                     path: 'spec.sharding.configServer.replicas',
//                     fieldParams: {
//                         label: 'Nº of configuration servers',
//                         defaultValue: 3,
//                     }
//                 },
//             ],
//         },
//     ]
// }
