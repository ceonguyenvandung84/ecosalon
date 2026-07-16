import { prisma } from "./db";
import { AdminAction, AdminEntity } from "./enums";

interface LogInput {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  detail?: string;
}

export async function logActivity(input: LogInput) {
  try {
    await prisma.adminActivity.create({
      data: {
        userId: input.userId,
        action: input.action as AdminAction,
        entity: input.entity as AdminEntity,
        entityId: input.entityId ?? null,
        detail: input.detail ?? null,
      },
    });
  } catch (err) {
    console.error("logActivity error:", err);
  }
}