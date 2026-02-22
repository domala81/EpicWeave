import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';

export interface SecurityConstructProps {
  apiGatewayArn: string;
  cloudFrontDistributionArn?: string;
}

export class SecurityConstruct extends Construct {
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: SecurityConstructProps) {
    super(scope, id);

    // ========================================
    // AWS WAF Web ACL
    // ========================================

    this.webAcl = new wafv2.CfnWebACL(this, 'EpicWeaveWebACL', {
      name: 'epicweave-waf',
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'epicweave-waf-metric',
        sampledRequestsEnabled: true,
      },
      rules: [
        // Rule 1: AWS Managed - Common Rule Set (blocks SQLi, XSS, etc.)
        {
          name: 'AWS-AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'common-rules',
            sampledRequestsEnabled: true,
          },
        },
        // Rule 2: AWS Managed - SQL Injection Rule Set
        {
          name: 'AWS-AWSManagedRulesSQLiRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'sqli-rules',
            sampledRequestsEnabled: true,
          },
        },
        // Rule 3: AWS Managed - Known Bad Inputs
        {
          name: 'AWS-AWSManagedRulesKnownBadInputsRuleSet',
          priority: 3,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'known-bad-inputs',
            sampledRequestsEnabled: true,
          },
        },
        // Rule 4: Rate Limiting - 1000 requests per 5 minutes per IP
        {
          name: 'RateLimit1000Per5Min',
          priority: 4,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 1000,
              aggregateKeyType: 'IP',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'rate-limit',
            sampledRequestsEnabled: true,
          },
        },
        // Rule 5: Block requests with body > 8KB (prevent payload abuse)
        {
          name: 'BlockOversizedBody',
          priority: 5,
          action: { block: {} },
          statement: {
            sizeConstraintStatement: {
              fieldToMatch: { body: { oversizeHandling: 'MATCH' } },
              comparisonOperator: 'GT',
              size: 8192,
              textTransformations: [{ priority: 0, type: 'NONE' }],
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'oversize-body',
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(this, 'ApiGatewayWafAssociation', {
      resourceArn: props.apiGatewayArn,
      webAclArn: this.webAcl.attrArn,
    });

    // ========================================
    // Outputs
    // ========================================

    new cdk.CfnOutput(this, 'WebACLArn', {
      value: this.webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });
  }
}
