import { TopologyUISchemas, GroupType, FieldType } from './ui-generator.types';
// Note: This file is using for development and testing purposes, it contains mock data for the UI generator component.
// TODO It should be removed in production.
export const topologyUiSchemas: TopologyUISchemas = {
  replica: {
    sections: {
      basicInfo: {
        label: 'Basic Information',
        description: 'Provide the basic information for your new database.',
        components: {
          version: {
            uiType: FieldType.Select as const,
            path: 'spec.engine.version',
            fieldParams: {
              label: 'Database Version',
              defaultValue: '7.0.18-11',
              // TODO CHECK WITH THE TEAM: in case of dbVersions we are assume that we get availableVersions values already
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
        label: 'Resources',
        description:
          'Configure the resources your new database will have access to.',
        components: {
          numberOfnodes: {
            path: 'spec.replica.nodes',
            uiType: FieldType.Number as const, // RadioButtons/Number/even Select
            fieldParams: {
              label: 'Number of nodes',
            },
            validation: {
              min: 1,
              max: 7,
            },
          },
          resources: {
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
        },
      },
    },
    // advanced
    sectionsOrder: ['basicInfo', 'resources'],
  },
  sharded: {
    sections: {
      basicInfo: {
        label: 'Basic Information',
        description: 'Provide the basic information for your new database.',
        components: {
          version: {
            uiType: FieldType.Select, //it can be autocompleteselect?
            path: 'spec.engine.version',
            fieldParams: {
              label: 'Database Version',
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
