import { z } from 'zod';

/**
 * Schema for creating a new guest group.
 */
export const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').max(100, 'Group name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').nullable().optional(),
});

/**
 * Schema for updating an existing group.
 */
export const updateGroupSchema = createGroupSchema.partial();

/**
 * Type definitions derived from schemas.
 */
export type CreateGroupDTO = z.infer<typeof createGroupSchema>;
export type UpdateGroupDTO = z.infer<typeof updateGroupSchema>;

/**
 * Group entity type matching database structure.
 */
export interface Group {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

/**
 * Group with member count.
 */
export interface GroupWithCount extends Group {
  guestCount: number;
}
