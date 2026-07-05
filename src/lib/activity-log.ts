import { db } from '@/lib/db'

interface LogActivityParams {
  projectId: string
  userId: string
  userName: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW'
  entity: 'project' | 'timeline' | 'report' | 'excel'
  entityName: string
  details?: string
}

/**
 * Write an activity log entry for a project.
 * Fire-and-forget — errors are logged but don't throw.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        projectId: params.projectId,
        userId: params.userId,
        userName: params.userName,
        action: params.action,
        entity: params.entity,
        entityName: params.entityName,
        details: params.details || '',
      },
    })
  } catch (error) {
    // Don't block the main operation — just log the error
    console.error('Failed to write activity log:', error)
  }
}
