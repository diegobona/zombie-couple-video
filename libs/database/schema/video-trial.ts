import { isSqliteDialect } from '../shared/dialect';
import * as pgSchema from './pg/video-trial';
import * as sqliteSchema from './sqlite/video-trial';
const implementation = (isSqliteDialect() ? sqliteSchema : pgSchema) as typeof pgSchema;
export const videoTrial = implementation.videoTrial;
export const videoTrialRate = implementation.videoTrialRate;
