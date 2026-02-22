import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as apigateway from "aws-cdk-lib/aws-apigatewayv2";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import { ApiGatewayConstruct } from "./api-gateway-construct";
import { LambdaFunctionsConstruct } from "./lambda-functions-construct";

export class EpicWeaveStack extends cdk.Stack {
  public readonly table: dynamodb.Table;
  public readonly userPool: cognito.UserPool;
  public readonly designsBucket: s3.Bucket;
  public readonly productsBucket: s3.Bucket;
  public readonly aiJobQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================
    // DynamoDB Single Table
    // ========================================
    this.table = new dynamodb.Table(this, "EpicWeaveTable", {
      tableName: "EpicWeaveTable-dev",
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "expiresAt",
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // GSI1: Email lookup for users
    this.table.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "GSI1PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI1SK", type: dynamodb.AttributeType.STRING },
    });

    // GSI2: Order status queries, category+price filters
    this.table.addGlobalSecondaryIndex({
      indexName: "GSI2",
      partitionKey: { name: "GSI2PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI2SK", type: dynamodb.AttributeType.STRING },
    });

    // ========================================
    // S3 Buckets
    // ========================================
    this.designsBucket = new s3.Bucket(this, "DesignsBucket", {
      bucketName: `epicweave-designs-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: "DeleteOldDesigns",
          enabled: true,
          expiration: cdk.Duration.days(90), // Clean up old designs after 90 days
        },
      ],
    });

    this.productsBucket = new s3.Bucket(this, "ProductsBucket", {
      bucketName: `epicweave-products-${this.account}-${this.region}`,
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ========================================
    // CloudFront Distribution for S3 Assets
    // ========================================
    const distribution = new cloudfront.Distribution(
      this,
      "AssetsDistribution",
      {
        defaultBehavior: {
          origin: new origins.S3Origin(this.productsBucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        additionalBehaviors: {
          "/designs/*": {
            origin: new origins.S3Origin(this.designsBucket),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          },
        },
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US, Canada, Europe
      },
    );

    // ========================================
    // Cognito User Pool
    // ========================================
    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "epicweave-users-dev",
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      advancedSecurityMode: cognito.AdvancedSecurityMode.ENFORCED,
    });

    // User Pool Client
    const userPoolClient = this.userPool.addClient("WebClient", {
      userPoolClientName: "epicweave-web-client",
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          "http://localhost:3000/auth/callback",
          // Production URL will be added later
        ],
        logoutUrls: ["http://localhost:3000"],
      },
    });

    // OAuth Identity Providers (Google, GitHub) - placeholders
    // TODO: Configure after obtaining OAuth credentials
    // const googleProvider = new cognito.UserPoolIdentityProviderGoogle(this, 'GoogleProvider', {
    //   userPool: this.userPool,
    //   clientId: 'GOOGLE_CLIENT_ID',
    //   clientSecret: 'GOOGLE_CLIENT_SECRET',
    //   scopes: ['email', 'profile'],
    //   attributeMapping: {
    //     email: cognito.ProviderAttribute.GOOGLE_EMAIL,
    //     givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
    //     familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
    //   },
    // });

    // Cognito Domain for hosted UI
    this.userPool.addDomain("CognitoDomain", {
      cognitoDomain: {
        domainPrefix: `epicweave-${this.account}`,
      },
    });

    // ========================================
    // SQS Queues
    // ========================================
    const dlq = new sqs.Queue(this, "AIJobDLQ", {
      queueName: "epicweave-ai-jobs-dlq-dev",
      retentionPeriod: cdk.Duration.days(14),
    });

    this.aiJobQueue = new sqs.Queue(this, "AIJobQueue", {
      queueName: "epicweave-ai-jobs-dev",
      visibilityTimeout: cdk.Duration.seconds(300), // 5 minutes for AI generation
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
    });

    // ========================================
    // Parameter Store - Default Configuration
    // ========================================
    new ssm.StringParameter(this, "SessionFee", {
      parameterName: "/EpicWeave/pricing/session-fee",
      stringValue: "2.00",
      description: "AI design session fee in USD",
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, "CustomTshirtBase", {
      parameterName: "/EpicWeave/pricing/custom-tshirt-base",
      stringValue: "20.00",
      description: "Base price for custom t-shirt in USD",
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, "BothPlacementSurcharge", {
      parameterName: "/EpicWeave/pricing/both-placement-surcharge",
      stringValue: "8.00",
      description: "Surcharge for front+back printing in USD",
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, "MaxIterations", {
      parameterName: "/EpicWeave/session/max-iterations",
      stringValue: "5",
      description: "Maximum design iterations per session",
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, "SessionTTL", {
      parameterName: "/EpicWeave/session/ttl-minutes",
      stringValue: "60",
      description: "Session expiry in minutes",
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, "ImageResolution", {
      parameterName: "/EpicWeave/ai/image-resolution",
      stringValue: "1024x1024",
      description: "DALL-E output resolution",
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, "ShippingFlatRate", {
      parameterName: "/EpicWeave/shipping/flat-rate-base",
      stringValue: "5.99",
      description: "Base flat shipping rate in USD",
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, "AllowedMythologies", {
      parameterName: "/EpicWeave/mythology/allowed-types",
      stringValue: "hindu,greek",
      description: "Comma-separated allowed mythology types",
      tier: ssm.ParameterTier.STANDARD,
    });

    // ========================================
    // Secrets Manager - API Keys
    // ========================================
    new secretsmanager.Secret(this, "StripeSecret", {
      secretName: "epicweave/stripe-api-key",
      description: "Stripe secret key for payment processing",
    });

    new secretsmanager.Secret(this, "OpenAISecret", {
      secretName: "epicweave/openai-api-key",
      description: "OpenAI API key for DALL-E image generation",
    });

    // ========================================
    // Outputs
    // ========================================
    new cdk.CfnOutput(this, "TableName", {
      value: this.table.tableName,
      description: "DynamoDB table name",
      exportName: "EpicWeaveTableName",
    });

    new cdk.CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
      description: "Cognito User Pool ID",
      exportName: "EpicWeaveUserPoolId",
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
      description: "Cognito User Pool Client ID",
      exportName: "EpicWeaveUserPoolClientId",
    });

    new cdk.CfnOutput(this, "DesignsBucketName", {
      value: this.designsBucket.bucketName,
      description: "S3 bucket for AI-generated designs",
      exportName: "EpicWeaveDesignsBucket",
    });

    new cdk.CfnOutput(this, "ProductsBucketName", {
      value: this.productsBucket.bucketName,
      description: "S3 bucket for product images",
      exportName: "EpicWeaveProductsBucket",
    });

    new cdk.CfnOutput(this, "CloudFrontDomain", {
      value: distribution.distributionDomainName,
      description: "CloudFront distribution domain",
      exportName: "EpicWeaveCloudFrontDomain",
    });

    new cdk.CfnOutput(this, "AIJobQueueUrl", {
      value: this.aiJobQueue.queueUrl,
      description: "SQS queue URL for AI job processing",
      exportName: "EpicWeaveAIJobQueueUrl",
    });

    // ========================================
    // API Gateway & Lambda Functions
    // ========================================

    const apiGateway = new ApiGatewayConstruct(this, "ApiGateway", {
      userPool: this.userPool,
      userPoolClient: userPoolClient,
    });

    new LambdaFunctionsConstruct(this, "LambdaFunctions", {
      table: this.table,
      apiGateway,
    });
  }
}
