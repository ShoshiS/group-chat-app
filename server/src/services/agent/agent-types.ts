export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AgentAction {
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}

export interface AgentTurn {
  reply: string;
  actions: AgentAction[];
}
