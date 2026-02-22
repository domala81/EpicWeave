import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayAuthorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export interface ApiGatewayConstructProps {
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
}

export class ApiGatewayConstruct extends Construct {
  public readonly httpApi: apigateway.HttpApi;
  public readonly authorizer: apigatewayAuthorizers.HttpUserPoolAuthorizer;

  constructor(scope: Construct, id: string, props: ApiGatewayConstructProps) {
    super(scope, id);

    // Create HTTP API
    this.httpApi = new apigateway.HttpApi(this, 'EpicWeaveApi', {
      apiName: 'epicweave-api-dev',
      description: 'EpicWeave E-Commerce API',
      corsPreflight: {
        allowOrigins: ['http://localhost:3000', 'https://*.epicweave.com'],
        allowMethods: [
          apigateway.CorsHttpMethod.GET,
          apigateway.CorsHttpMethod.POST,
          apigateway.CorsHttpMethod.PUT,
          apigateway.CorsHttpMethod.PATCH,
          apigateway.CorsHttpMethod.DELETE,
          apigateway.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['*'],
        allowCredentials: true,
        maxAge: cdk.Duration.days(1),
      },
    });

    // Cognito Authorizer
    this.authorizer = new apigatewayAuthorizers.HttpUserPoolAuthorizer(
      'CognitoAuthorizer',
      props.userPool,
      {
        userPoolClients: [props.userPoolClient],
        identitySource: ['$request.header.Authorization'],
      }
    );

    // Output API endpoint
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.httpApi.apiEndpoint,
      description: 'HTTP API Gateway endpoint',
      exportName: 'EpicWeaveApiEndpoint',
    });
  }

  /**
   * Helper method to add routes with Lambda integration
   */
  public addLambdaRoute(
    path: string,
    method: apigateway.HttpMethod,
    handler: lambda.Function,
    requiresAuth: boolean = true
  ) {
    const integration = new apigatewayIntegrations.HttpLambdaIntegration(
      `${path.replace(/\//g, '-')}-${method}-Integration`,
      handler
    );

    this.httpApi.addRoutes({
      path,
      methods: [method],
      integration,
      authorizer: requiresAuth ? this.authorizer : undefined,
    });
  }
}
