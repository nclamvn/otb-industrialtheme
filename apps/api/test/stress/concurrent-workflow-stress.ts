/**
 * Concurrent Workflow Stress Test
 *
 * Tests concurrent user workflows:
 * - Multiple users creating budgets simultaneously
 * - Concurrent approval workflows
 * - Race conditions in status updates
 * - Optimistic locking scenarios
 *
 * Run: npx ts-node apps/api/test/stress/concurrent-workflow-stress.ts
 */

interface WorkflowConfig {
  baseUrl: string;
  authToken: string;
  concurrentUsers: number;
  operationsPerUser: number;
}

interface WorkflowMetric {
  workflowType: string;
  userId: number;
  operation: string;
  duration: number;
  success: boolean;
  error?: string;
  conflictDetected: boolean;
}

interface WorkflowResult {
  testName: string;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  conflictCount: number;
  avgDuration: number;
  raceConditionsDetected: number;
}

const DEFAULT_CONFIG: WorkflowConfig = {
  baseUrl: process.env.API_URL || 'http://localhost:3001/api/v1',
  authToken: process.env.AUTH_TOKEN || 'test-token',
  concurrentUsers: 10,
  operationsPerUser: 5,
};

class ConcurrentWorkflowStressTest {
  private config: WorkflowConfig;
  private metrics: WorkflowMetric[] = [];

  constructor(config: WorkflowConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  private async makeRequest(
    endpoint: string,
    method: string = 'GET',
    body?: any,
  ): Promise<{ status: number; data: any; success: boolean }> {
    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.authToken}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      return {
        status: response.status,
        data,
        success: response.ok,
      };
    } catch (error) {
      return {
        status: 0,
        data: { error: (error as Error).message },
        success: false,
      };
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateReport(testName: string, metrics: WorkflowMetric[]): WorkflowResult {
    const successful = metrics.filter((m) => m.success).length;
    const failed = metrics.filter((m) => !m.success).length;
    const conflicts = metrics.filter((m) => m.conflictDetected).length;
    const durations = metrics.map((m) => m.duration);

    // Detect race conditions (same resource updated by multiple users in short timeframe)
    const operationsByType = new Map<string, WorkflowMetric[]>();
    metrics.forEach((m) => {
      const key = m.workflowType + m.operation;
      if (!operationsByType.has(key)) {
        operationsByType.set(key, []);
      }
      operationsByType.get(key)!.push(m);
    });

    let raceConditions = 0;
    operationsByType.forEach((ops) => {
      // Check for operations within 100ms of each other
      for (let i = 0; i < ops.length; i++) {
        for (let j = i + 1; j < ops.length; j++) {
          if (Math.abs(ops[i].duration - ops[j].duration) < 100) {
            raceConditions++;
          }
        }
      }
    });

    return {
      testName,
      totalOperations: metrics.length,
      successfulOperations: successful,
      failedOperations: failed,
      conflictCount: conflicts,
      avgDuration:
        durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      raceConditionsDetected: raceConditions,
    };
  }

  private printResult(result: WorkflowResult): void {
    console.log('\n' + '─'.repeat(50));
    console.log(`  ${result.testName}`);
    console.log('─'.repeat(50));
    console.log(`Total Operations: ${result.totalOperations}`);
    console.log(`Successful: ${result.successfulOperations}`);
    console.log(`Failed: ${result.failedOperations}`);
    console.log(`Conflicts Detected: ${result.conflictCount}`);
    console.log(`Avg Duration: ${result.avgDuration.toFixed(2)}ms`);
    console.log(`Potential Race Conditions: ${result.raceConditionsDetected}`);

    const status =
      result.failedOperations === 0 && result.raceConditionsDetected === 0 ? '✅' : '⚠️';
    console.log(`Status: ${status}`);
    console.log('─'.repeat(50));
  }

  /**
   * Test 1: Concurrent Budget Creation
   */
  async testConcurrentBudgetCreation(): Promise<WorkflowResult> {
    console.log('\n📝 Test 1: Concurrent Budget Creation');

    const metrics: WorkflowMetric[] = [];
    const promises: Promise<void>[] = [];

    for (let userId = 0; userId < this.config.concurrentUsers; userId++) {
      const promise = (async () => {
        for (let op = 0; op < this.config.operationsPerUser; op++) {
          const startTime = Date.now();

          const result = await this.makeRequest('/budgets', 'POST', {
            name: `Stress Test Budget ${userId}-${op}-${Date.now()}`,
            totalBudget: 1000000 + Math.random() * 9000000,
            seasonalBudget: 500000,
            replenishmentBudget: 500000,
            currency: 'VND',
            seasonId: 'test-season-id', // Would need real ID
            brandId: 'test-brand-id', // Would need real ID
          });

          metrics.push({
            workflowType: 'budget_creation',
            userId,
            operation: 'create',
            duration: Date.now() - startTime,
            success: result.success,
            error: result.data?.error,
            conflictDetected: result.status === 409,
          });

          await this.sleep(50); // Small delay between operations
        }
      })();

      promises.push(promise);
    }

    await Promise.all(promises);

    const result = this.generateReport('Concurrent Budget Creation', metrics);
    this.printResult(result);
    return result;
  }

  /**
   * Test 2: Concurrent Status Updates
   */
  async testConcurrentStatusUpdates(): Promise<WorkflowResult> {
    console.log('\n🔄 Test 2: Concurrent Status Updates');

    const metrics: WorkflowMetric[] = [];

    // First, get some budgets
    const budgetsResponse = await this.makeRequest('/budgets?status=DRAFT&limit=10');
    const budgets = budgetsResponse.data?.items || budgetsResponse.data || [];

    if (budgets.length === 0) {
      console.log('  No draft budgets found for testing');
      return {
        testName: 'Concurrent Status Updates',
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        conflictCount: 0,
        avgDuration: 0,
        raceConditionsDetected: 0,
      };
    }

    // Multiple users try to update the same budget
    const targetBudget = budgets[0];
    const promises: Promise<void>[] = [];

    for (let userId = 0; userId < this.config.concurrentUsers; userId++) {
      const promise = (async () => {
        const startTime = Date.now();

        const result = await this.makeRequest(`/budgets/${targetBudget.id}`, 'PATCH', {
          totalBudget: 2000000 + Math.random() * 1000000,
        });

        metrics.push({
          workflowType: 'status_update',
          userId,
          operation: 'update',
          duration: Date.now() - startTime,
          success: result.success,
          error: result.data?.error,
          conflictDetected: result.status === 409 || result.status === 423,
        });
      })();

      promises.push(promise);
    }

    await Promise.all(promises);

    const result = this.generateReport('Concurrent Status Updates', metrics);
    this.printResult(result);
    return result;
  }

  /**
   * Test 3: Concurrent Approval Workflow
   */
  async testConcurrentApprovalWorkflow(): Promise<WorkflowResult> {
    console.log('\n✅ Test 3: Concurrent Approval Workflow');

    const metrics: WorkflowMetric[] = [];

    // Get submitted budgets
    const budgetsResponse = await this.makeRequest('/budgets?status=SUBMITTED&limit=10');
    const budgets = budgetsResponse.data?.items || budgetsResponse.data || [];

    if (budgets.length === 0) {
      console.log('  No submitted budgets found for testing');
      return {
        testName: 'Concurrent Approval Workflow',
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        conflictCount: 0,
        avgDuration: 0,
        raceConditionsDetected: 0,
      };
    }

    // Multiple users try to approve/reject the same budget
    const targetBudget = budgets[0];
    const promises: Promise<void>[] = [];

    for (let userId = 0; userId < this.config.concurrentUsers; userId++) {
      const promise = (async () => {
        const action = userId % 2 === 0 ? 'approve' : 'reject';
        const startTime = Date.now();

        const result = await this.makeRequest(`/budgets/${targetBudget.id}/${action}`, 'POST', {
          comment: `Stress test ${action} by user ${userId}`,
        });

        metrics.push({
          workflowType: 'approval_workflow',
          userId,
          operation: action,
          duration: Date.now() - startTime,
          success: result.success,
          error: result.data?.error,
          conflictDetected: result.status === 409 || result.status === 400,
        });
      })();

      promises.push(promise);
    }

    await Promise.all(promises);

    const result = this.generateReport('Concurrent Approval Workflow', metrics);
    this.printResult(result);
    return result;
  }

  /**
   * Test 4: Concurrent Read/Write Operations
   */
  async testConcurrentReadWrite(): Promise<WorkflowResult> {
    console.log('\n📖✏️ Test 4: Concurrent Read/Write Operations');

    const metrics: WorkflowMetric[] = [];
    const promises: Promise<void>[] = [];

    // Half users read, half users write
    for (let userId = 0; userId < this.config.concurrentUsers; userId++) {
      const isReader = userId % 2 === 0;

      const promise = (async () => {
        for (let op = 0; op < this.config.operationsPerUser; op++) {
          const startTime = Date.now();
          let result;

          if (isReader) {
            result = await this.makeRequest('/budgets?limit=20');
          } else {
            result = await this.makeRequest('/budgets', 'POST', {
              name: `RW Test ${userId}-${op}-${Date.now()}`,
              totalBudget: 1000000,
              currency: 'VND',
            });
          }

          metrics.push({
            workflowType: 'read_write',
            userId,
            operation: isReader ? 'read' : 'write',
            duration: Date.now() - startTime,
            success: result.success,
            error: result.data?.error,
            conflictDetected: result.status === 409,
          });

          await this.sleep(10);
        }
      })();

      promises.push(promise);
    }

    await Promise.all(promises);

    const result = this.generateReport('Concurrent Read/Write', metrics);
    this.printResult(result);
    return result;
  }

  /**
   * Test 5: Workflow Chain Stress
   * Simulates complete workflow: Create -> Submit -> Approve
   */
  async testWorkflowChain(): Promise<WorkflowResult> {
    console.log('\n⛓️ Test 5: Complete Workflow Chain');

    const metrics: WorkflowMetric[] = [];
    const promises: Promise<void>[] = [];

    for (let userId = 0; userId < Math.min(this.config.concurrentUsers, 5); userId++) {
      const promise = (async () => {
        // Step 1: Create budget
        const createStart = Date.now();
        const createResult = await this.makeRequest('/budgets', 'POST', {
          name: `Chain Test ${userId}-${Date.now()}`,
          totalBudget: 1000000,
          currency: 'VND',
        });

        metrics.push({
          workflowType: 'workflow_chain',
          userId,
          operation: 'create',
          duration: Date.now() - createStart,
          success: createResult.success,
          error: createResult.data?.error,
          conflictDetected: false,
        });

        if (!createResult.success || !createResult.data?.id) {
          return;
        }

        const budgetId = createResult.data.id;

        // Step 2: Submit for approval
        await this.sleep(100);
        const submitStart = Date.now();
        const submitResult = await this.makeRequest(`/budgets/${budgetId}/submit`, 'POST');

        metrics.push({
          workflowType: 'workflow_chain',
          userId,
          operation: 'submit',
          duration: Date.now() - submitStart,
          success: submitResult.success,
          error: submitResult.data?.error,
          conflictDetected: submitResult.status === 409,
        });

        if (!submitResult.success) {
          return;
        }

        // Step 3: Approve
        await this.sleep(100);
        const approveStart = Date.now();
        const approveResult = await this.makeRequest(`/budgets/${budgetId}/approve`, 'POST', {
          comment: 'Stress test approval',
        });

        metrics.push({
          workflowType: 'workflow_chain',
          userId,
          operation: 'approve',
          duration: Date.now() - approveStart,
          success: approveResult.success,
          error: approveResult.data?.error,
          conflictDetected: approveResult.status === 409,
        });
      })();

      promises.push(promise);
    }

    await Promise.all(promises);

    const result = this.generateReport('Complete Workflow Chain', metrics);
    this.printResult(result);
    return result;
  }

  /**
   * Test 6: Parallel Different Workflows
   */
  async testParallelWorkflows(): Promise<WorkflowResult> {
    console.log('\n🔀 Test 6: Parallel Different Workflows');

    const metrics: WorkflowMetric[] = [];
    const promises: Promise<void>[] = [];

    const workflows = [
      { type: 'budget', endpoint: '/budgets' },
      { type: 'otb', endpoint: '/otb-plans' },
      { type: 'sku', endpoint: '/sku-proposals' },
    ];

    for (let userId = 0; userId < this.config.concurrentUsers; userId++) {
      const workflow = workflows[userId % workflows.length];

      const promise = (async () => {
        for (let op = 0; op < this.config.operationsPerUser; op++) {
          const startTime = Date.now();
          const result = await this.makeRequest(`${workflow.endpoint}?limit=10`);

          metrics.push({
            workflowType: workflow.type,
            userId,
            operation: 'list',
            duration: Date.now() - startTime,
            success: result.success,
            error: result.data?.error,
            conflictDetected: false,
          });

          await this.sleep(20);
        }
      })();

      promises.push(promise);
    }

    await Promise.all(promises);

    const result = this.generateReport('Parallel Different Workflows', metrics);
    this.printResult(result);
    return result;
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log('═'.repeat(60));
    console.log('  CONCURRENT WORKFLOW STRESS TEST SUITE');
    console.log('═'.repeat(60));
    console.log(`\nConfiguration:`);
    console.log(`  Base URL: ${this.config.baseUrl}`);
    console.log(`  Concurrent Users: ${this.config.concurrentUsers}`);
    console.log(`  Operations per User: ${this.config.operationsPerUser}`);

    const results: WorkflowResult[] = [];

    results.push(await this.testConcurrentBudgetCreation());
    results.push(await this.testConcurrentStatusUpdates());
    results.push(await this.testConcurrentApprovalWorkflow());
    results.push(await this.testConcurrentReadWrite());
    results.push(await this.testWorkflowChain());
    results.push(await this.testParallelWorkflows());

    // Final Summary
    console.log('\n' + '═'.repeat(60));
    console.log('  FINAL SUMMARY');
    console.log('═'.repeat(60));

    let totalOps = 0;
    let totalFailed = 0;
    let totalConflicts = 0;
    let totalRaces = 0;

    results.forEach((result) => {
      totalOps += result.totalOperations;
      totalFailed += result.failedOperations;
      totalConflicts += result.conflictCount;
      totalRaces += result.raceConditionsDetected;

      const status = result.failedOperations === 0 ? '✅' : '❌';
      console.log(
        `${status} ${result.testName}: ${result.successfulOperations}/${result.totalOperations}`,
      );
    });

    console.log('\n' + '─'.repeat(40));
    console.log(`Total Operations: ${totalOps}`);
    console.log(`Total Failed: ${totalFailed}`);
    console.log(`Total Conflicts: ${totalConflicts}`);
    console.log(`Potential Race Conditions: ${totalRaces}`);

    const allPassed = totalFailed === 0 && totalRaces === 0;
    console.log('\n' + '═'.repeat(60));
    console.log(
      allPassed
        ? '  ✅ ALL CONCURRENT WORKFLOW TESTS PASSED'
        : '  ⚠️ SOME ISSUES DETECTED - REVIEW REQUIRED',
    );
    console.log('═'.repeat(60) + '\n');

    process.exit(allPassed ? 0 : 1);
  }
}

// Run if executed directly
if (require.main === module) {
  const config: WorkflowConfig = {
    baseUrl: process.env.API_URL || 'http://localhost:3001/api/v1',
    authToken: process.env.AUTH_TOKEN || 'test-token',
    concurrentUsers: parseInt(process.env.CONCURRENT_USERS || '10'),
    operationsPerUser: parseInt(process.env.OPERATIONS_PER_USER || '5'),
  };

  const test = new ConcurrentWorkflowStressTest(config);
  test.runAllTests().catch((error) => {
    console.error('Concurrent workflow stress test failed:', error);
    process.exit(1);
  });
}

export { ConcurrentWorkflowStressTest, WorkflowConfig, WorkflowResult };
