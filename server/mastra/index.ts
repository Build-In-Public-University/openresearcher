
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { weatherWorkflow } from './workflows/weather-workflow';
import { userContextWorkflow } from './workflows/user-context-workflow';
import { urlProcessingWorkflow } from './workflows/url-processing-workflow';
import { weatherAgent } from './agents/weather-agent';
import { userActivityAgent } from './agents/user-activity-agent';
import { contextAgent } from './agents/context-agent';
import { chatAgent } from './agents/chat-agent';
import { contextSummaryAgent } from './agents/context-summary-agent';
import { urlProcessingAgent } from './agents/url-processing-agent';
import { contextProfileTool } from './tools/context-profile-tool';
import { manualContextUpdateTool } from './tools/manual-context-update-tool';

export const mastra = new Mastra({
  workflows: { weatherWorkflow, userContextWorkflow, urlProcessingWorkflow },
  agents: { weatherAgent, userActivityAgent, contextAgent, chatAgent, contextSummaryAgent, urlProcessingAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
