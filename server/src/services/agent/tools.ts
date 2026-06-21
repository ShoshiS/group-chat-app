import { type FunctionDeclaration, Type } from '@google/genai';
import { Types } from 'mongoose';

import {
  createGroup,
  inviteMember,
  listGroups,
  type ToolResult,
} from '../group-service';

/**
 * Tools the agent can call. Wired to MongoDB via group-service so actions
 * persist and can be verified in Compass or GET /api/groups.
 */

export interface AgentToolContext {
  userId: Types.ObjectId;
}

type ToolExecutor = (
  args: Record<string, unknown>,
  context: AgentToolContext,
) => Promise<ToolResult>;

interface AgentTool {
  declaration: FunctionDeclaration;
  execute: ToolExecutor;
}

const createGroupTool: AgentTool = {
  declaration: {
    name: 'create_group',
    description:
      'Create a new chat group. The user becomes its admin. Ask for the group name if it is missing.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'The group name. Required.' },
        description: {
          type: Type.STRING,
          description: 'Optional short description of the group.',
        },
      },
      required: ['name'],
    },
  },
  execute: (args, context) => createGroup({ ...args, adminId: context.userId }),
};

const inviteMemberTool: AgentTool = {
  declaration: {
    name: 'invite_member',
    description:
      'Invite a person to an existing group by group name. Ask for the group name and who to invite if missing.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        groupName: {
          type: Type.STRING,
          description: 'Name of the group to invite the person to. Required.',
        },
        invitee: {
          type: Type.STRING,
          description: 'Username or email of the person to invite. Required.',
        },
      },
      required: ['groupName', 'invitee'],
    },
  },
  execute: (args, context) => inviteMember(args, context.userId),
};

const listGroupsTool: AgentTool = {
  declaration: {
    name: 'list_groups',
    description:
      "List the user's existing groups. Useful before inviting someone so the agent knows which groups exist.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  execute: (_args, context) => listGroups(context.userId),
};

const tools: AgentTool[] = [createGroupTool, inviteMemberTool, listGroupsTool];

export const functionDeclarations: FunctionDeclaration[] = tools.map((tool) => tool.declaration);

/**
 * Executes a tool by name. Returns an error payload (rather than throwing) so a
 * model hallucinating an unknown tool degrades gracefully into a normal reply.
 */
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  context: AgentToolContext,
): Promise<ToolResult> {
  const tool = tools.find((candidate) => candidate.declaration.name === name);
  if (!tool) {
    return { error: `Unknown tool: ${name}` };
  }

  try {
    return await tool.execute(args, context);
  } catch (error) {
    return { error: (error as Error).message };
  }
}
