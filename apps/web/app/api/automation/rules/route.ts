export const runtime = 'nodejs';

/**
 * Automation Rules API
 * Manage automation rules for auto-approval and auto-reorder
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { DEFAULT_RULES, type AutomationRule } from '@/lib/automation/rules-engine';

export const dynamic = 'force-dynamic';

// GET /api/automation/rules - Get all automation rules
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const includeDefaults = searchParams.get('includeDefaults') !== 'false';

    // Fetch custom rules from database
    const customRules = await prisma.automationRule.findMany({
      where: type ? { type } : {},
      orderBy: { priority: 'asc' },
    });

    // Map to AutomationRule format
    const mappedRules: AutomationRule[] = customRules.map(rule => ({
      id: rule.id,
      name: rule.name,
      description: rule.description || '',
      type: rule.type as AutomationRule['type'],
      enabled: rule.enabled,
      priority: rule.priority,
      conditions: (rule.conditions as unknown) as AutomationRule['conditions'],
      conditionLogic: (rule.conditionLogic as 'AND' | 'OR') || 'AND',
      actions: (rule.actions as unknown) as AutomationRule['actions'],
      cooldownMinutes: rule.cooldownMinutes || undefined,
      maxExecutionsPerDay: rule.maxExecutionsPerDay || undefined,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    }));

    // Include default rules if requested
    let allRules = mappedRules;
    if (includeDefaults) {
      const defaultRulesWithIds = DEFAULT_RULES
        .filter(r => !type || r.type === type)
        .map((r, i) => ({
          ...r,
          id: `default-${i}`,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
      allRules = [...mappedRules, ...defaultRulesWithIds] as AutomationRule[];
    }

    // Sort by priority
    allRules.sort((a, b) => a.priority - b.priority);

    return NextResponse.json({
      rules: allRules,
      total: allRules.length,
      customCount: mappedRules.length,
      defaultCount: allRules.length - mappedRules.length,
    });
  } catch (error) {
    console.error('Error fetching automation rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch automation rules' },
      { status: 500 }
    );
  }
}

// POST /api/automation/rules - Create new automation rule
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for admin role
    const userRole = (session.user as { role?: string }).role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can create automation rules' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      type,
      enabled = true,
      priority = 10,
      conditions,
      conditionLogic = 'AND',
      actions,
      cooldownMinutes,
      maxExecutionsPerDay,
    } = body;

    // Validate required fields
    if (!name || !type || !conditions || !actions) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, conditions, actions' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = [
      'AUTO_APPROVE_BUDGET',
      'AUTO_APPROVE_OTB',
      'AUTO_APPROVE_SKU',
      'AUTO_REORDER',
      'AUTO_ESCALATE',
      'AUTO_NOTIFY',
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Valid types: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Create rule
    const rule = await prisma.automationRule.create({
      data: {
        name,
        description,
        type,
        enabled,
        priority,
        conditions,
        conditionLogic,
        actions,
        cooldownMinutes,
        maxExecutionsPerDay,
        createdById: session.user.id,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        tableName: 'automation_rules',
        recordId: rule.id,
        userId: session.user.id,
        userEmail: session.user.email || '',
        newValue: { name, type, enabled, priority },
        changedFields: ['name', 'type', 'enabled', 'priority', 'conditions', 'actions'],
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Error creating automation rule:', error);
    return NextResponse.json(
      { error: 'Failed to create automation rule' },
      { status: 500 }
    );
  }
}
