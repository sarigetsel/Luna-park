import { SchemaType, type FunctionDeclarationSchema } from '@google/generative-ai';
import { getToolsForRole, type ToolDefinition } from './tools';
import type { AuthUser } from '../types';

const NUMBER_PARAMS = new Set([
  'price',
  'discountPercent',
  'capacity',
  'minimumHeight',
  'hoursAmount',
  'startHour',
  'endHour',
  'usageLimit',
]);

function toGeminiSchema(tool: ToolDefinition): FunctionDeclarationSchema {
  const properties: NonNullable<FunctionDeclarationSchema['properties']> = {};

  for (const param of tool.params) {
    if (NUMBER_PARAMS.has(param.name)) {
      properties[param.name] = {
        type: SchemaType.NUMBER,
        description: param.description || param.name,
      };
    } else {
      properties[param.name] = {
        type: SchemaType.STRING,
        description: param.description || param.name,
      };
    }
  }

  return {
    type: SchemaType.OBJECT,
    properties,
    required: tool.params.filter((p) => p.required).map((p) => p.name),
  };
}

export function toGeminiFunctionDeclarations(user: AuthUser | null) {
  return getToolsForRole(user).map((tool) => ({
    name: tool.id,
    description: tool.description,
    parameters: toGeminiSchema(tool),
  }));
}
