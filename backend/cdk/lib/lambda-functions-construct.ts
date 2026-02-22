import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as path from 'path';
import { ApiGatewayConstruct } from './api-gateway-construct';

export interface LambdaFunctionsConstructProps {
  table: dynamodb.Table;
  apiGateway: ApiGatewayConstruct;
}

export class LambdaFunctionsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: LambdaFunctionsConstructProps) {
    super(scope, id);

    const lambdaPath = path.join(__dirname, '../../lambda/dist/handlers');

    // Common Lambda environment variables
    const commonEnvironment = {
      TABLE_NAME: props.table.tableName,
      NODE_ENV: 'production',
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
    const listProductsHandler = new lambda.Function(this, 'ListProductsFunction', {
      ...commonProps,
      functionName: 'epicweave-list-products',
      handler: 'products/list-products.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda')),
      description: 'List products with mythology, style, price filters',
    });

    props.table.grantReadData(listProductsHandler);
    props.apiGateway.addLambdaRoute(
      '/products',
      apigateway.HttpMethod.GET,
      listProductsHandler,
      false // Public endpoint
    );

    // GET /products/{productId} - Get product details
    const getProductHandler = new lambda.Function(this, 'GetProductFunction', {
      ...commonProps,
      functionName: 'epicweave-get-product',
      handler: 'products/get-product.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda')),
      description: 'Get product details with variants',
    });

    props.table.grantReadData(getProductHandler);
    props.apiGateway.addLambdaRoute(
      '/products/{productId}',
      apigateway.HttpMethod.GET,
      getProductHandler,
      false // Public endpoint
    );

    // POST /admin/products - Create product (Admin only)
    const createProductHandler = new lambda.Function(this, 'CreateProductFunction', {
      ...commonProps,
      functionName: 'epicweave-create-product',
      handler: 'admin/create-product.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda')),
      description: 'Create new product with variants (Admin)',
    });

    props.table.grantWriteData(createProductHandler);
    props.apiGateway.addLambdaRoute(
      '/admin/products',
      apigateway.HttpMethod.POST,
      createProductHandler,
      true // Requires auth
    );

    // ========================================
    // Session Lambda Functions
    // ========================================

    // POST /sessions/create - Create AI design session
    const createSessionHandler = new lambda.Function(this, 'CreateSessionFunction', {
      ...commonProps,
      functionName: 'epicweave-create-session',
      handler: 'sessions/create-session.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda')),
      description: 'Create AI design session with Stripe payment',
      environment: {
        ...commonEnvironment,
        STRIPE_SECRET_KEY: '{{resolve:secretsmanager:epicweave/stripe-api-key}}',
      },
      timeout: cdk.Duration.seconds(60),
    });

    props.table.grantReadWriteData(createSessionHandler);
    // Grant SSM Parameter Store read access
    createSessionHandler.addToRolePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:parameter/EpicWeave/*`,
        ],
      })
    );

    props.apiGateway.addLambdaRoute(
      '/sessions/create',
      apigateway.HttpMethod.POST,
      createSessionHandler,
      true // Requires auth
    );

    // ========================================
    // Outputs
    // ========================================

    new cdk.CfnOutput(this, 'ListProductsFunctionArn', {
      value: listProductsHandler.functionArn,
      description: 'List Products Lambda Function ARN',
    });

    new cdk.CfnOutput(this, 'GetProductFunctionArn', {
      value: getProductHandler.functionArn,
      description: 'Get Product Lambda Function ARN',
    });

    new cdk.CfnOutput(this, 'CreateProductFunctionArn', {
      value: createProductHandler.functionArn,
      description: 'Create Product Lambda Function ARN (Admin)',
    });

    new cdk.CfnOutput(this, 'CreateSessionFunctionArn', {
      value: createSessionHandler.functionArn,
      description: 'Create Session Lambda Function ARN',
    });
  }
}
