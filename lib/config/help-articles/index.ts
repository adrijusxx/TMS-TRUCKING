export type { HelpTopic, HelpModule } from './types';
export { operationsModules } from './operations';
export { financeModules } from './finance';
export { fleetAndImportModules } from './fleet-and-import';

import { operationsModules } from './operations';
import { financeModules } from './finance';
import { fleetAndImportModules } from './fleet-and-import';

/** All help modules in display order */
export const helpModules = [
  ...operationsModules,
  ...fleetAndImportModules,
  ...financeModules,
];

/** Flat list of all topics across all modules, for cross-module search */
export function getAllTopics() {
  return helpModules.flatMap((m) =>
    m.topics.map((t) => ({ ...t, moduleId: m.id, moduleName: m.name }))
  );
}
