import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, projectIds, type } = body

    if (!title || !projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json(
        { error: 'title and projectIds (non-empty array) are required' },
        { status: 400 }
      )
    }

    if (projectIds.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 projects per compiled report' },
        { status: 400 }
      )
    }

    // Fetch all selected projects with relations
    const projects = await db.project.findMany({
      where: { id: { in: projectIds } },
      include: {
        customer: true,
        timelines: { orderBy: { taskOrder: 'asc' } },
        reports: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })

    if (projects.length === 0) {
      return NextResponse.json({ error: 'No projects found' }, { status: 400 })
    }

    const now = new Date().toISOString().split('T')[0]

    // Build compiled report content
    let content = `═══════════════════════════════════════\n`
    content += `COMPILED PROJECT REPORT\n`
    content += `Generated: ${now}\n`
    content += `Title: ${title}\n`
    content += `Total Projects: ${projects.length}\n`
    content += `═══════════════════════════════════════\n\n`

    // Summary section
    const statusCounts: Record<string, number> = {}
    const categoryCounts: Record<string, number> = {}
    let totalBudget = 0
    let totalProgress = 0

    for (const p of projects) {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1
      totalBudget += p.budget || 0
      totalProgress += p.progress || 0
    }

    content += `─── EXECUTIVE SUMMARY ───\n\n`
    content += `Projects by Status:\n`
    for (const [status, count] of Object.entries(statusCounts)) {
      content += `  • ${status}: ${count}\n`
    }
    content += `\nProjects by Category:\n`
    for (const [category, count] of Object.entries(categoryCounts)) {
      content += `  • ${category}: ${count}\n`
    }
    content += `\nTotal Budget: IDR ${totalBudget.toLocaleString('id-ID')}\n`
    const avgProgress = projects.length > 0 ? Math.round(totalProgress / projects.length) : 0
    content += `Average Progress: ${avgProgress}%\n\n`

    // Per-project detail
    content += `─── PROJECT DETAILS ───\n\n`
    for (let i = 0; i < projects.length; i++) {
      const p = projects[i]
      content += `┌─ ${i + 1}. ${p.name}\n`
      content += `│   Customer: ${p.customer?.name || 'N/A'} (${p.customer?.company || 'N/A'})\n`
      content += `│   Category: ${p.category}\n`
      content += `│   Status: ${p.status}\n`
      content += `│   Progress: ${p.progress || 0}%\n`
      content += `│   Priority: ${p.priority || 'N/A'}\n`
      if (p.budget) {
        content += `│   Budget: IDR ${p.budget.toLocaleString('id-ID')}\n`
      }
      if (p.startDate) {
        content += `│   Start: ${p.startDate instanceof Date ? p.startDate.toISOString().split('T')[0] : p.startDate}\n`
      }
      if (p.endDate) {
        content += `│   End: ${p.endDate instanceof Date ? p.endDate.toISOString().split('T')[0] : p.endDate}\n`
      }
      if (p.picInternalName) {
        content += `│   PIC Internal: ${p.picInternalName}\n`
      }
      if (p.picExternalName) {
        content += `│   PIC External: ${p.picExternalName}\n`
      }

      // Timeline summary
      if (p.timelines.length > 0) {
        const completed = p.timelines.filter(t => t.status === 'COMPLETED').length
        content += `│   Timelines: ${completed}/${p.timelines.length} completed\n`
        for (const t of p.timelines.slice(0, 5)) {
          const statusIcon = t.status === 'COMPLETED' ? '✓' : t.status === 'IN_PROGRESS' ? '►' : t.status === 'DELAYED' ? '⚠' : '○'
          content += `│     ${statusIcon} ${t.taskName} (${t.progress || 0}%)`
          if (t.assignee) content += ` - ${t.assignee}`
          content += `\n`
        }
        if (p.timelines.length > 5) {
          content += `│     ... and ${p.timelines.length - 5} more tasks\n`
        }
      }

      // Recent reports
      if (p.reports.length > 0) {
        content += `│   Recent Reports:\n`
        for (const r of p.reports) {
          content += `│     • ${r.title} (${r.type} - ${r.status})\n`
        }
      }

      if (p.notes) {
        content += `│   Notes: ${p.notes}\n`
      }
      content += `└─${'─'.repeat(40)}\n\n`
    }

    content += `─── END OF REPORT ───\n`

    // Create a single compiled report linked to the first project
    const report = await db.report.create({
      data: {
        projectId: projectIds[0],
        title,
        type: type || 'MILESTONE',
        content,
        status: 'DRAFT',
      },
    })

    return NextResponse.json(
      {
        data: {
          ...report,
          createdAt: report.createdAt.toISOString(),
          updatedAt: report.updatedAt.toISOString(),
          compiledCount: projects.length,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Compile report error:', error)
    return NextResponse.json(
      { error: 'Failed to compile report' },
      { status: 500 }
    )
  }
}
