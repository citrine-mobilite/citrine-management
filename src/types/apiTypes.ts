export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'
  | 'WS'
  | 'GRAPHQL';

export type ApiSourceFormat =
  | 'openapi3'
  | 'swagger2'
  | 'postman'
  | 'insomnia'
  | 'custom_json';

export interface ApiParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean;
  type: string;
  description?: string;
  example?: any;
  default?: any;
  enum?: any[];
}

export interface ApiRequestBody {
  required?: boolean;
  description?: string;
  contentType: string;
  schema?: any;
  example?: any;
}

export interface ApiResponseDef {
  statusCode: string;
  description?: string;
  contentType?: string;
  schema?: any;
  example?: any;
}

export interface ApiEndpoint {
  id: string;
  method: HttpMethod;
  path: string;
  summary?: string;
  description?: string;
  tag: string;
  operationId?: string;
  deprecated?: boolean;
  parameters: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses: ApiResponseDef[];
  security?: string[];
}

export interface ApiSchemaDef {
  name: string;
  type?: string;
  description?: string;
  properties?: Record<string, any>;
  required?: string[];
  raw: any;
}

export interface ApiSecurityScheme {
  name: string;
  type: string;
  scheme?: string;
  in?: string;
  headerName?: string;
  description?: string;
}

export interface ApiSpecRecord {
  id: string;
  collectionKey?: string;
  title: string;
  version: string;
  description?: string;
  sourceFormat: ApiSourceFormat;
  formatLabel: string;
  baseUrl: string;
  servers?: Array<{ url: string; description?: string }>;
  tags: Array<{ name: string; description?: string }>;
  endpoints: ApiEndpoint[];
  schemas: ApiSchemaDef[];
  securitySchemes?: ApiSecurityScheme[];
  rawJson: string;
  fileName?: string;
  importedBy?: string;
  createdAt: string;
  updatedAt: string;
}
