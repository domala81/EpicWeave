import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sqs from 'aws-cdk-lib/aws-sqs';

export interface ObservabilityConstructProps {
  lambdaFunctions: lambda.Function[];
  dlqQueue?: sqs.Queue;
  stageName: string;
}

export class ObservabilityConstruct extends Construct {
  public readonly alarmTopic: sns.Topic;
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: ObservabilityConstructProps) {
    super(scope, id);

    // ========================================
    // SNS Topic for Alarms
    // ========================================

    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `epicweave-alarms-${props.stageName}`,
      displayName: 'EpicWeave Alarm Notifications',
    });

    // ========================================
    // Enable X-Ray Tracing on all Lambda Functions
    // ========================================

    for (const fn of props.lambdaFunctions) {
      const cfnFn = fn.node.defaultChild as lambda.CfnFunction;
      cfnFn.addPropertyOverride('TracingConfig', {
        Mode: 'Active',
      });
    }

    // ========================================
    // CloudWatch Alarms
    // ========================================

    // Lambda Error Rate Alarm (per function)
    for (const fn of props.lambdaFunctions) {
      const errorAlarm = new cloudwatch.Alarm(this, `${fn.functionName}-ErrorAlarm`, {
        alarmName: `${fn.functionName}-errors`,
        alarmDescription: `Error rate alarm for ${fn.functionName}`,
        metric: fn.metricErrors({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 5,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      errorAlarm.addAlarmAction({
        bind: () => ({ alarmActionArn: this.alarmTopic.topicArn }),
      });

      // Lambda Duration Alarm (latency > 10s)
      new cloudwatch.Alarm(this, `${fn.functionName}-LatencyAlarm`, {
        alarmName: `${fn.functionName}-latency`,
        alarmDescription: `Latency alarm for ${fn.functionName}`,
        metric: fn.metricDuration({
          period: cdk.Duration.minutes(5),
          statistic: 'p95',
        }),
        threshold: 10000,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      // Lambda Throttle Alarm
      new cloudwatch.Alarm(this, `${fn.functionName}-ThrottleAlarm`, {
        alarmName: `${fn.functionName}-throttles`,
        alarmDescription: `Throttle alarm for ${fn.functionName}`,
        metric: fn.metricThrottles({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
    }

    // DLQ Depth Alarm
    if (props.dlqQueue) {
      new cloudwatch.Alarm(this, 'DLQDepthAlarm', {
        alarmName: 'epicweave-dlq-depth',
        alarmDescription: 'Dead letter queue has messages',
        metric: props.dlqQueue.metricApproximateNumberOfMessagesVisible({
          period: cdk.Duration.minutes(5),
          statistic: 'Maximum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
    }

    // ========================================
    // CloudWatch Dashboard
    // ========================================

    this.dashboard = new cloudwatch.Dashboard(this, 'EpicWeaveDashboard', {
      dashboardName: `EpicWeave-${props.stageName}`,
    });

    // Row 1: Lambda Invocations & Errors
    const invocationWidgets = props.lambdaFunctions.map(fn =>
      new cloudwatch.GraphWidget({
        title: `${fn.functionName} - Invocations/Errors`,
        width: 8,
        left: [
          fn.metricInvocations({ period: cdk.Duration.minutes(5) }),
        ],
        right: [
          fn.metricErrors({ period: cdk.Duration.minutes(5), color: '#d62728' }),
        ],
      })
    );

    // Add widgets in rows of 3
    for (let i = 0; i < invocationWidgets.length; i += 3) {
      this.dashboard.addWidgets(...invocationWidgets.slice(i, i + 3));
    }

    // Row 2: Lambda Duration (P50, P95, P99)
    const durationWidgets = props.lambdaFunctions.map(fn =>
      new cloudwatch.GraphWidget({
        title: `${fn.functionName} - Duration`,
        width: 8,
        left: [
          fn.metricDuration({ period: cdk.Duration.minutes(5), statistic: 'p50', label: 'P50' }),
          fn.metricDuration({ period: cdk.Duration.minutes(5), statistic: 'p95', label: 'P95' }),
          fn.metricDuration({ period: cdk.Duration.minutes(5), statistic: 'p99', label: 'P99' }),
        ],
      })
    );

    for (let i = 0; i < durationWidgets.length; i += 3) {
      this.dashboard.addWidgets(...durationWidgets.slice(i, i + 3));
    }

    // Row 3: Lambda Throttles & Concurrent Executions
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Throttles (All Functions)',
        width: 12,
        left: props.lambdaFunctions.map(fn =>
          fn.metricThrottles({ period: cdk.Duration.minutes(5) })
        ),
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Concurrent Executions',
        width: 12,
        left: props.lambdaFunctions.map(fn =>
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'ConcurrentExecutions',
            dimensionsMap: { FunctionName: fn.functionName },
            period: cdk.Duration.minutes(1),
            statistic: 'Maximum',
          })
        ),
      }),
    );

    // Row 4: DLQ Depth (if applicable)
    if (props.dlqQueue) {
      this.dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: 'Dead Letter Queue Depth',
          width: 12,
          left: [
            props.dlqQueue.metricApproximateNumberOfMessagesVisible({
              period: cdk.Duration.minutes(1),
            }),
          ],
        }),
      );
    }

    // ========================================
    // Outputs
    // ========================================

    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://${cdk.Stack.of(this).region}.console.aws.amazon.com/cloudwatch/home?region=${cdk.Stack.of(this).region}#dashboards:name=EpicWeave-${props.stageName}`,
      description: 'CloudWatch Dashboard URL',
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: this.alarmTopic.topicArn,
      description: 'SNS Topic ARN for alarm notifications',
    });
  }
}
