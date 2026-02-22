import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';

export interface EpicWeaveWorld extends World {
  cognitoUserId?: string;
  authTokens?: {
    idToken: string;
    accessToken: string;
    refreshToken: string;
  };
  sessionId?: string;
  cartItems?: any[];
  orderId?: string;
  response?: any;
  context: {
    apiEndpoint: string;
    cognitoUserPoolId: string;
    cognitoClientId: string;
    dynamoTableName: string;
  };
}

export class CustomWorld extends World implements EpicWeaveWorld {
  cognitoUserId?: string;
  authTokens?: {
    idToken: string;
    accessToken: string;
    refreshToken: string;
  };
  sessionId?: string;
  cartItems?: any[];
  orderId?: string;
  response?: any;
  context: {
    apiEndpoint: string;
    cognitoUserPoolId: string;
    cognitoClientId: string;
    dynamoTableName: string;
  };

  constructor(options: IWorldOptions) {
    super(options);
    this.context = {
      apiEndpoint: process.env.API_ENDPOINT || 'http://localhost:3001',
      cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID || 'us-east-1_test',
      cognitoClientId: process.env.COGNITO_CLIENT_ID || 'test-client-id',
      dynamoTableName: process.env.DYNAMODB_TABLE_NAME || 'EpicWeaveTable-dev'
    };
  }
}

setWorldConstructor(CustomWorld);
