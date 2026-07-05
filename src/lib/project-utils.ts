import { db } from '@/lib/db'

/**
 * Recalculate project progress based on the average progress
 * of all its timeline tasks. If no timelines exist, progress is 0.
 */
export async function recalculateProjectProgress(projectId: string): Promise<number> {
  const timelines = await db.timeline.findMany({
    where: { projectId },
    select: { progress: true },
  })

  if (timelines.length === 0) {
    await db.project.update({
      where: { id: projectId },
      data: { progress: 0 },
    })
    return 0
  }

  const totalProgress = timelines.reduce((sum, t) => sum + t.progress, 0)
  const avgProgress = Math.round(totalProgress / timelines.length)

  await db.project.update({
    where: { id: projectId },
    data: { progress: avgProgress },
  })

  return avgProgress
}
