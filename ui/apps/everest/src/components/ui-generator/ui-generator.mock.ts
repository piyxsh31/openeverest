import { TopologyUISchemas, GroupType, FieldType } from './ui-generator.types';
// Note: This file is using for development and testing purposes, it contains mock data for the UI generator component.
// TODO It should be removed in production.
export const topologyUiSchemas: TopologyUISchemas = {
  replica: {
    sections: {
      databaseVersion: {
        label: 'Database Version',
        description:
          'Provide the information about the database version you want to use.',
        components: {
          version: {
            uiType: FieldType.Select as const,
            // TODO path: ['spec.components.engine.version', 'spec.components.proxy.version', 'spec.components.configServer.version'],
            path: 'spec.engine.version',
            fieldParams: {
              label: 'Database Version',
              optionsPath: 'spec.componentTypes.mongod.versions',
              optionsPathConfig: {
                labelPath: 'version',
                valuePath: 'version',
              },
            },
            validation: {
              required: true,
            }
          },
        },
      },
      resources: {
        label: 'Resources',
        description:
          'Configure the resources your new database will have access to.',
        components: {
          nodes: {
            uiType: 'group',
            // groupType: GroupType.Accordion, TODO fix accordion
            components: {
              numberOfnodes: {
                path: 'spec.components.engine.replicas',
                uiType: FieldType.Number as const, // RadioButtons/Number/even Select
                fieldParams: {
                  label: 'Number of nodes',
                  defaultValue: 3,
                },
                validation: {
                  required: true,
                  min: 1,
                  int: true,
                  celExpressions: [
                    {
                      celExpr: 'spec.components.engine.replicas % 2 == 1',
                      message: 'The number of nodes must be odd',
                    },
                  ],
                },
              },
              resources: {
                uiType: 'group' as const,
                groupType: GroupType.Line as const,
                components: {
                  cpu: {
                    path: 'spec.components.engine.resources.limits.cpu',
                    uiType: FieldType.Number as const,
                    fieldParams: {
                      label: 'CPU',
                      defaultValue: 1,
                      step: 0.1,
                    },
                    validation: {
                      min: 0.6,
                      required: true,
                    },
                  },
                  memory: {
                    path: 'spec.components.engine.resources.limits.memory',
                    uiType: FieldType.Number as const,
                    fieldParams: {
                      label: 'Memory',
                      defaultValue: 4,
                      step: 0.001,
                      badge: 'Gi',
                      badgeToApi: true,
                    },
                    validation: {
                      min: 0.512,
                      required: true,
                    },
                  },
                  disk: {
                    path: 'spec.components.engine.storage.size',
                    uiType: FieldType.Number as const,
                    fieldParams: {
                      label: 'Disk',
                      defaultValue: 25,
                      badge: 'Gi',
                      badgeToApi: true,
                    },
                    validation: {
                      min: 1,
                      int: true,
                      required: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      advancedConfigurations: {
        label: 'Advanced Configurations',
        components: {
          storageClass: {
            uiType: FieldType.Select,
            path: 'spec.components.engine.storage.storageClass',
            fieldParams: {
              label: 'Storage Class',
              // TODO move into group
              // description: 'Defines the type and performance of storage for your database. Select based on workload needs, such as high IOPS for fast access or cost-effective options for less frequent use.',
              options: [{ label: 'local-path', value: 'local-path' }],
            },
            validation: {
              required: true,
            },
          },
        },
      },
    },
    sectionsOrder: ['databaseVersion', 'resources'],
  },
  sharded: {
    sections: {
      databaseVersion: {
        label: 'Database Version',
        description:
          'Provide the information about the database version you want to use.',
        components: {
          version: {
            uiType: FieldType.Select as const,
            path: 'spec.engine.version',
            fieldParams: {
              label: 'Database Version',
              defaultValue: '7.0.18-11',
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
        label: 'Resources',
        description: 'Some description about resources',
        components: {
          shards: {
            uiType: FieldType.Number,
            path: 'spec.sharding.shards',
            fieldParams: {
              label: 'Nº of shards',
              defaultValue: 1,
            },
          },
          numberOfnodes: {
            path: 'spec.replica.nodes',
            uiType: FieldType.Number, // RadioButtons/Number/even Select
            fieldParams: {
              label: 'Number of nodes',
            },
          },
          nodesResources: {
            uiType: 'group' as const,
            groupType: GroupType.Line as const,
            components: {
              cpu: {
                path: 'spec.engine.resources.cpu',
                uiType: FieldType.Number as const,
                fieldParams: {
                  label: 'CPU',
                },
                validation: {
                  min: 1,
                  max: 10,
                },
              },
              memory: {
                path: 'spec.engine.resources.memory',
                uiType: FieldType.Number as const,
                fieldParams: {
                  label: 'Memory',
                },
                validation: {
                  min: 1,
                  max: 10,
                },
              },
              disk: {
                path: 'spec.engine.resources.disk',
                uiType: FieldType.Number as const,
                fieldParams: {
                  label: 'Disk',
                },
                validation: {
                  min: 10,
                  max: 100,
                },
              },
            },
          },
          numberOfRouters: {
            path: 'spec.replica.routers',
            uiType: FieldType.Number, // RadioButtons/Number/even Select
            fieldParams: {
              label: 'Number of routers',
            },
          },
          routersResources: {
            uiType: 'group' as const,
            groupType: GroupType.Line as const,
            components: {
              cpu: {
                path: 'some.path1.need.to.be.checked',
                uiType: FieldType.Number as const,
                fieldParams: {
                  label: 'CPU',
                },
                validation: {
                  min: 1,
                  max: 10,
                },
              },
              memory: {
                path: 'some.path2.need.to.be.checked',
                uiType: FieldType.Number as const,
                fieldParams: {
                  label: 'Memory',
                },
                validation: {
                  min: 1,
                  max: 10,
                },
              },
            },
          },
          numberOfConfigServers: {
            uiType: FieldType.Number, //can be something like NumberTabs or custom type
            path: 'spec.sharding.configServer.replicas',
            fieldParams: {
              label: 'Nº of configuration servers',
              defaultValue: 3,
            },
            validation: {
              celExpressions: [
                {
                  celExpr:
                    '!(spec.replica.nodes > 1 && spec.sharding.configServer.replicas == 1)',
                  message:
                    'The number of configuration servers cannot be 1 if the number of database nodes is greater than 1',
                },
              ],
            },
          },
        },
        componentsOrder: ['shards', 'numberOfnodes', 'numberOfConfigServers'],
      },
      advancedConfiguration: {
        label: 'Advanced Configuration',
        description: 'Some description about advanced configuration',
        components: {},
      },
    },
    sectionsOrder: ['basicInfo', 'resources', 'resources2'],
  },
} satisfies TopologyUISchemas;
