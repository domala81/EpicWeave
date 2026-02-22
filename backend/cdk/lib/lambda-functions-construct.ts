import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigatewayv2";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as path from "path";
import { ApiGatewayConstruct } from "./api-gateway-construct";

export interface LambdaFunctionsConstructProps {
  table: dynamodb.Table;
  apiGateway: ApiGatewayConstruct;
  aiJobQueue: sqs.Queue;
  designsBucket: s3.Bucket;
}

export class LambdaFunctionsConstruct extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: LambdaFunctionsConstructProps,
  ) {
    super(scope, id);

    const lambdaPath = path.join(__dirname, "../../lambda/dist/handlers");

    // Common Lambda environment variables
    const commonEnvironment = {
      TABLE_NAME: props.table.tableName,
      NODE_ENV: "production",
    };

    const commonProps: Partial<lambda.FunctionProps> = {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: commonEnvironment,
    };

    // ========================================
    // Product Lambda Functions
    // ========================================

    // GET /products - List products with filters
    const listProductsHandler = new lambda.Function(
      this,
      "ListProductsFunction",
      {
        ...commonProps,
        functionName: "epicweave-list-products",
        handler: "products/list-products.handler",
        code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda")),
        description: "List products with mythology, style, price filters",
      },
    );

    props.table.grantReadData(listProductsHandler);
    props.apiGateway.addLambdaRoute(
      "/products",
      apigateway.HttpMethod.GET,
      listProductsHandler,
      false, // Public endpoint
    );

    // GET /products/{productId} - Get product details
    const getProductHandler = new lambda.Function(this, "GetProductFunction", {
      ...commonProps,
      functionName: "epicweave-get-product",
      handler: "products/get-product.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda")),
      description: "Get product details with variants",
    });

    props.table.grantReadData(getProductHandler);
    props.apiGateway.addLambdaRoute(
      "/products/{productId}",
      apigateway.HttpMethod.GET,
      getProductHandler,
      false, // Public endpoint
    );

    // POST /admin/products - Create product (Admin only)
    const createProductHandler = new lambda.Function(
      this,
      "CreateProductFunction",
      {
        ...commonProps,
        functionName: "epicweave-create-product",
        handler: "admin/create-product.handler",
        code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda")),
        description: "Create new product with variants (Admin)",
      },
    );

    props.table.grantWriteData(createProductHandler);
    props.apiGateway.addLambdaRoute(
      "/admin/products",
      apigateway.HttpMethod.POST,
      createProductHandler,
      true, // Requires auth
    );

    // ========================================
    // Session Lambda Functions
    // ========================================

    // POST /sessions/create - Create AI design session
    const createSessionHandler = new lambda.Function(
      this,
      "CreateSessionFunction",
      {
        ...commonProps,
        functionName: "epicweave-create-session",
        handler: "sessions/create-session.handler",
        code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda")),
        description: "Create AI design session with Stripe payment",
        environment: {
          ...commonEnvironment,
          STRIPE_SECRET_KEY:
            "{{resolve:secretsmanager:epicweave/stripe-api-key}}",
        },
        timeout: cdk.Duration.seconds(60),
      },
    );

    props.table.grantReadWriteData(createSessionHandler);
    // Grant SSM Parameter Store read access
    createSessionHandler.addToRolePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ["ssm:GetParameter"],
        resources: [
          `arn:aws:ssm:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:parameter/EpicWeave/*`,
        ],
      }),
    );

    props.apiGateway.addLambdaRoute(
      "/sessions/create",
      apigateway.HttpMethod.POST,
      createSessionHandler,
      true, // Requires auth
    );

    // SSM read policy (shared by session handlers)
    const ssmReadPolicy = new cdk.aws_iam.PolicyStatement({
      actions: ["ssm:GetParameter"],
      resources: [
        `arn:aws:ssm:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:parameter/EpicWeave/*`,
      ],
    });

    // POST /sessions/{sessionId}/generate - Generate design (prompt → SQS)
    const generateDesignHandler = new lambda.Function(
      this,
      "GenerateDesignFunction",
      {
        ...commonProps,
        functionName: "epicweave-generate-design",
        handler: "sessions/generate-design.handler",
        code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda")),
        description: "Validate prompt, enforce content rules, enqueue to SQS",
        environment: {
          ...commonEnvironment,
          AI_QUEUE_URL: props.aiJobQueue.queueUrl,
        },
      },
    );

    props.table.grantReadWriteData(generateDesignHandler);
    props.aiJobQueue.grantSendMessages(generateDesignHandler);
    generateDesignHandler.addToRolePolicy(ssmReadPolicy);
    props.apiGateway.addLambdaRoute(
      "/sessions/{sessionId}/generate",
      apigateway.HttpMethod.POST,
      generateDesignHandler,
      true,
    );

    // GET /sessions/{sessionId}/status - Poll for session status
    const getSessionStatusHandler = new lambda.Function(
      this,
      "GetSessionStatusFunction",
      {
        ...commonProps,
        functionName: "epicweave-get-session-status",
        handler: "sessions/get-session-status.handler",
        code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda")),
        description: "Get session status and message history",
      },
    );

    props.table.grantReadData(getSessionStatusHandler);
    props.apiGateway.addLambdaRoute(
      "/sessions/{sessionId}/status",
      apigateway.HttpMethod.GET,
      getSessionStatusHandler,
      true,
    );

    // POST /sessions/{sessionId}/finalize - Finalize design with color/size/placement
    const finalizeDesignHandler = new lambda.Function(
      this,
      "FinalizeDesignFunction",
      {
        ...commonProps,
        functionName: "epicweave-finalize-design",
        handler: "sessions/finalize-design.handler",
        code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda")),
        description: "Calculate price from Parameter Store and finalize design",
      },
    );

    props.table.grantReadWriteData(finalizeDesignHandler);
    finalizeDesignHandler.addToRolePolicy(ssmReadPolicy);
    props.apiGateway.addLambdaRoute(
      "/sessions/{sessionId}/finalize",
      apigateway.HttpMethod.POST,
      finalizeDesignHandler,
      true,
    );

    // ========================================
    // AI Worker (SQS → Lambda → DALL-E → S3)
    // ========================================

    const aiWorkerHandler = new lambda.Function(this, "AIWorkerFunction", {
      ...commonProps,
      functionName: "epicweave-ai-worker",
      handler: "sessions/ai-worker.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda")),
      description:
        "Process SQS messages: call DALL-E, upload to S3, update DynamoDB",
      memorySize: 512,
      timeout: cdk.Duration.seconds(120), // DALL-E calls can take time
      environment: {
        ...commonEnvironment,
        DESIGNS_BUCKET: props.designsBucket.bucketName,
      },
    });

    props.table.grantReadWriteData(aiWorkerHandler);
    props.designsBucket.grantReadWrite(aiWorkerHandler);
    // Grant Secrets Manager read for OpenAI API key
    aiWorkerHandler.addToRolePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ["secretsmanager:GetSecretValue"],
        resources: [
          `arn:aws:secretsmanager:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:secret:epicweave/*`,
        ],
      }),
    );

    // SQS trigger
    aiWorkerHandler.addEventSource(
      new lambdaEventSources.SqsEventSource(props.aiJobQueue, {
        batchSize: 1,
        maxConcurrency: 5,
      }),
    );

    // ========================================
    // Outputs
    // ========================================

    new cdk.CfnOutput(this, "ListProductsFunctionArn", {
      value: listProductsHandler.functionArn,
      description: "List Products Lambda Function ARN",
    });

    new cdk.CfnOutput(this, "GetProductFunctionArn", {
      value: getProductHandler.functionArn,
      description: "Get Product Lambda Function ARN",
    });

    new cdk.CfnOutput(this, "CreateProductFunctionArn", {
      value: createProductHandler.functionArn,
      description: "Create Product Lambda Function ARN (Admin)",
    });

    new cdk.CfnOutput(this, "CreateSessionFunctionArn", {
      value: createSessionHandler.functionArn,
      description: "Create Session Lambda Function ARN",
    });
  }
}
