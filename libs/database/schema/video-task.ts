import { isSqliteDialect } from '../shared/dialect';
import * as pgSchema from './pg/video-task';
import * as sqliteSchema from './sqlite/video-task';

const implementation = (isSqliteDialect() ? sqliteSchema : pgSchema) as typeof pgSchema;
export const videoTask = implementation.videoTask;
