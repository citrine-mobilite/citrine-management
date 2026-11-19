import {
  ApiEndpoint,
  ApiParameter,
  ApiRequestBody,
  ApiResponseDef,
  ApiSchemaDef,
  ApiSecurityScheme,
  ApiSourceFormat,
  ApiSpecRecord,
  HttpMethod,
} from '../types';

const VALID_METHODS: HttpMethod[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
  'WS',
  'GRAPHQL',
];

function normalizeMethod(raw: any): HttpMethod {
  const upper = String(raw || 'GET').trim().toUpperCase();
  if (upper === 'DEL') return 'DELETE';
  if (upper === 'WEBSOCKET') return 'WS';
  if (VALID_METHODS.includes(upper as HttpMethod)) return upper as HttpMethod;
  return 'GET';
}

/**
 * Resolve a local JSON pointer like "#/components/schemas/User"
 */
export function resolveJsonRef(ref: string, rootDoc: any): any {
  if (!ref || typeof ref !== 'string' || !ref.startsWith('#/')) return null;
  const parts = ref
    .slice(2)
    .split('/')
    .map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'));
  let current = rootDoc;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return current;
}

/**
 * Recursively dereference schemas (with cycle protection)
 */
export function dereferenceSchema(
  schema: any,
  rootDoc: any,
  visited: Set<string> = new Set(),
  depth = 0
): any {
  if (!schema || typeof schema !== 'object' || depth > 8) return schema;

  if (schema.$ref && typeof schema.$ref === 'string') {
    if (visited.has(schema.$ref)) {
      const refName = schema.$ref.split('/').pop() || 'CircularRef';
      return { type: 'object', description: `Référence circulaire (${refName})` };
    }
    const target = resolveJsonRef(schema.$ref, rootDoc);
    if (!target) return schema;
    const nextVisited = new Set(visited);
    nextVisited.add(schema.$ref);
    const resolved = dereferenceSchema(target, rootDoc, nextVisited, depth + 1);
    const { $ref: _ignored, ...rest } = schema;
    return { ...resolved, ...rest };
  }

  if (Array.isArray(schema.allOf)) {
    const merged: any = { type: 'object', properties: {}, required: [] as string[] };
    for (const sub of schema.allOf) {
      const res = dereferenceSchema(sub, rootDoc, visited, depth + 1);
      if (res && typeof res === 'object') {
        if (res.properties) {
          merged.properties = { ...merged.properties, ...res.properties };
        }
        if (Array.isArray(res.required)) {
          merged.required = Array.from(new Set([...merged.required, ...res.required]));
        }
        if (res.description && !merged.description) merged.description = res.description;
      }
    }
    return merged;
  }

  if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
    return dereferenceSchema(schema.oneOf[0], rootDoc, visited, depth + 1);
  }
  if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
    return dereferenceSchema(schema.anyOf[0], rootDoc, visited, depth + 1);
  }

  const clone: any = Array.isArray(schema) ? [] : { ...schema };
  if (clone.properties && typeof clone.properties === 'object') {
    const nextProps: Record<string, any> = {};
    for (const [k, v] of Object.entries(clone.properties)) {
      nextProps[k] = dereferenceSchema(v, rootDoc, visited, depth + 1);
    }
    clone.properties = nextProps;
  }
  if (clone.items) {
    clone.items = dereferenceSchema(clone.items, rootDoc, visited, depth + 1);
  }
  return clone;
}

/**
 * Generate a realistic JSON sample payload from an OpenAPI / JSON Schema
 */
export function generateSampleFromSchema(
  schema: any,
  rootDoc?: any,
  depth = 0,
  visited: Set<string> = new Set()
): any {
  if (!schema || typeof schema !== 'object' || depth > 6) return undefined;

  if (schema.$ref && rootDoc) {
    if (visited.has(schema.$ref)) return {};
    const target = resolveJsonRef(schema.$ref, rootDoc);
    if (target) {
      const nextVisited = new Set(visited);
      nextVisited.add(schema.$ref);
      return generateSampleFromSchema(target, rootDoc, depth + 1, nextVisited);
    }
  }

  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum[0];

  if (Array.isArray(schema.allOf)) {
    const merged: Record<string, any> = {};
    for (const sub of schema.allOf) {
      const val = generateSampleFromSchema(sub, rootDoc, depth + 1, visited);
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        Object.assign(merged, val);
      }
    }
    return merged;
  }
  if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
    return generateSampleFromSchema(schema.oneOf[0], rootDoc, depth + 1, visited);
  }
  if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
    return generateSampleFromSchema(schema.anyOf[0], rootDoc, depth + 1, visited);
  }

  const schemaType = Array.isArray(schema.type) ? schema.type[0] : schema.type;

  if (schemaType === 'object' || schema.properties) {
    const obj: Record<string, any> = {};
    if (schema.properties && typeof schema.properties === 'object') {
      for (const [key, propSchema] of Object.entries<any>(schema.properties)) {
        const sample = generateSampleFromSchema(propSchema, rootDoc, depth + 1, visited);
        obj[key] = sample !== undefined ? sample : getPrimitiveSample(propSchema?.type, propSchema?.format, key);
      }
    }
    return obj;
  }

  if (schemaType === 'array' || schema.items) {
    const itemSample = schema.items
      ? generateSampleFromSchema(schema.items, rootDoc, depth + 1, visited)
      : 'item';
    return [itemSample !== undefined ? itemSample : 'string'];
  }

  return getPrimitiveSample(schemaType, schema.format);
}

function getPrimitiveSample(type?: string, format?: string, fieldName?: string): any {
  const nameLower = (fieldName || '').toLowerCase();
  if (format === 'email' || nameLower.includes('email')) return 'utilisateur@exemple.com';
  if (format === 'date-time' || nameLower.endsWith('at')) return '2026-11-18T10:30:00Z';
  if (format === 'date' || nameLower.includes('date')) return '2026-11-18';
  if (format === 'uuid' || nameLower === 'id' || nameLower.endsWith('id')) return 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  if (format === 'uri' || format === 'url' || nameLower.includes('url')) return 'https://api.exemple.com/resource';

  switch (type) {
    case 'integer':
    case 'int':
      return 1;
    case 'number':
    case 'float':
    case 'double':
      return 100.5;
    case 'boolean':
    case 'bool':
      return true;
    case 'array':
      return [];
    case 'object':
      return {};
    default:
      if (nameLower.includes('phone') || nameLower.includes('tel')) return '+237690000000';
      if (nameLower.includes('name') || nameLower.includes('nom')) return 'Exemple';
      if (nameLower.includes('status') || nameLower.includes('statut')) return 'actif';
      return 'string';
  }
}

/**
 * Infer a JSON Schema structure from an arbitrary sample value
 */
export function inferSchemaFromExample(value: any, depth = 0): any {
  if (depth > 6) return { type: typeof value };
  if (value === null) return { type: 'null', example: null };
  if (Array.isArray(value)) {
    return {
      type: 'array',
      items: value.length > 0 ? inferSchemaFromExample(value[0], depth + 1) : { type: 'string' },
    };
  }
  if (typeof value === 'object') {
    const properties: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      properties[k] = inferSchemaFromExample(v, depth + 1);
    }
    return {
      type: 'object',
      properties,
    };
  }
  if (typeof value === 'number') {
    return { type: Number.isInteger(value) ? 'integer' : 'number', example: value };
  }
  if (typeof value === 'boolean') {
    return { type: 'boolean', example: value };
  }
  return { type: 'string', example: value };
}

function formatJsonSafe(val: any): any {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return val;
      }
    }
  }
  return val;
}

/**
 * Parse OpenAPI 3.x or Swagger 2.0 specification
 */
function parseOpenApiOrSwagger(doc: any, isSwagger2: boolean): Omit<ApiSpecRecord, 'id' | 'rawJson' | 'createdAt' | 'updatedAt'> {
  const info = doc.info || {};
  const servers: Array<{ url: string; description?: string }> = [];

  if (isSwagger2) {
    const scheme = Array.isArray(doc.schemes) && doc.schemes.length > 0 ? doc.schemes[0] : 'https';
    const host = doc.host || 'api.exemple.com';
    const basePath = doc.basePath || '';
    servers.push({ url: `${scheme}://${host}${basePath}`.replace(/\/$/, '') });
  } else if (Array.isArray(doc.servers) && doc.servers.length > 0) {
    for (const s of doc.servers) {
      if (s?.url) servers.push({ url: s.url, description: s.description });
    }
  }

  const baseUrl = servers[0]?.url || '';
  const endpoints: ApiEndpoint[] = [];
  const tagMap = new Map<string, string>();

  if (Array.isArray(doc.tags)) {
    for (const t of doc.tags) {
      if (t?.name) tagMap.set(t.name, t.description || '');
    }
  }

  const pathsObj = doc.paths || {};
  const httpKeys = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

  for (const [pathStr, pathItemRaw] of Object.entries<any>(pathsObj)) {
    if (!pathItemRaw || typeof pathItemRaw !== 'object') continue;
    const pathParams: any[] = Array.isArray(pathItemRaw.parameters) ? pathItemRaw.parameters : [];

    for (const methodKey of httpKeys) {
      const op = pathItemRaw[methodKey];
      if (!op || typeof op !== 'object') continue;

      const method = normalizeMethod(methodKey);
      const tag = Array.isArray(op.tags) && op.tags.length > 0 ? String(op.tags[0]) : 'Général';
      if (!tagMap.has(tag)) tagMap.set(tag, '');

      // Parameters (merge path-level + operation-level)
      const mergedRawParams = [...pathParams, ...(Array.isArray(op.parameters) ? op.parameters : [])];
      const parameters: ApiParameter[] = [];
      let swagger2BodyParam: any = null;

      for (let p of mergedRawParams) {
        if (p?.$ref) {
          p = resolveJsonRef(p.$ref, doc) || p;
        }
        if (!p || !p.name) continue;
        if (p.in === 'body' && isSwagger2) {
          swagger2BodyParam = p;
          continue;
        }
        const pIn = (['path', 'query', 'header', 'cookie'].includes(p.in) ? p.in : 'query') as ApiParameter['in'];
        const pSchema = p.schema ? dereferenceSchema(p.schema, doc) : p;
        parameters.push({
          name: p.name,
          in: pIn,
          required: Boolean(p.required || pIn === 'path'),
          type: pSchema?.type || p.type || 'string',
          description: p.description,
          example: p.example ?? pSchema?.example,
          default: p.default ?? pSchema?.default,
          enum: pSchema?.enum ?? p.enum,
        });
      }

      // Request Body
      let requestBody: ApiRequestBody | undefined;
      if (!isSwagger2 && op.requestBody) {
        let rb = op.requestBody;
        if (rb.$ref) rb = resolveJsonRef(rb.$ref, doc) || rb;
        const contentObj = rb.content || {};
        const contentTypes = Object.keys(contentObj);
        const preferredCt = contentTypes.find((ct) => ct.includes('json')) || contentTypes[0] || 'application/json';
        const mediaObj = contentObj[preferredCt] || {};
        const derefSchema = mediaObj.schema ? dereferenceSchema(mediaObj.schema, doc) : undefined;
        let exampleVal = mediaObj.example;
        if (exampleVal === undefined && mediaObj.examples) {
          const firstEx = Object.values<any>(mediaObj.examples)[0];
          exampleVal = firstEx?.value;
        }
        if (exampleVal === undefined && mediaObj.schema) {
          exampleVal = generateSampleFromSchema(mediaObj.schema, doc);
        }
        requestBody = {
          required: Boolean(rb.required),
          description: rb.description,
          contentType: preferredCt,
          schema: derefSchema,
          example: exampleVal,
        };
      } else if (isSwagger2 && swagger2BodyParam) {
        const derefSchema = swagger2BodyParam.schema
          ? dereferenceSchema(swagger2BodyParam.schema, doc)
          : undefined;
        const exampleVal = swagger2BodyParam.schema
          ? generateSampleFromSchema(swagger2BodyParam.schema, doc)
          : undefined;
        requestBody = {
          required: Boolean(swagger2BodyParam.required),
          description: swagger2BodyParam.description,
          contentType: 'application/json',
          schema: derefSchema,
          example: exampleVal,
        };
      }

      // Responses
      const responses: ApiResponseDef[] = [];
      if (op.responses && typeof op.responses === 'object') {
        for (const [statusCode, respRaw] of Object.entries<any>(op.responses)) {
          let r = respRaw;
          if (r?.$ref) r = resolveJsonRef(r.$ref, doc) || r;
          if (!r || typeof r !== 'object') continue;
          let contentType = 'application/json';
          let rawSchema = r.schema;
          let exampleVal = r.example;

          if (!isSwagger2 && r.content && typeof r.content === 'object') {
            const cts = Object.keys(r.content);
            contentType = cts.find((c) => c.includes('json')) || cts[0] || 'application/json';
            const media = r.content[contentType] || {};
            rawSchema = media.schema;
            exampleVal = media.example;
            if (exampleVal === undefined && media.examples) {
              const firstEx = Object.values<any>(media.examples)[0];
              exampleVal = firstEx?.value;
            }
          }

          const derefRespSchema = rawSchema ? dereferenceSchema(rawSchema, doc) : undefined;
          if (exampleVal === undefined && rawSchema) {
            exampleVal = generateSampleFromSchema(rawSchema, doc);
          }

          responses.push({
            statusCode: String(statusCode),
            description: r.description,
            contentType,
            schema: derefRespSchema,
            example: exampleVal,
          });
        }
      }

      endpoints.push({
        id: `${method}_${pathStr}_${endpoints.length}`,
        method,
        path: pathStr,
        summary: op.summary || op.operationId || `${method} ${pathStr}`,
        description: op.description,
        tag,
        operationId: op.operationId,
        deprecated: Boolean(op.deprecated),
        parameters,
        requestBody,
        responses,
      });
    }
  }

  // Schemas / Definitions
  const rawSchemas = (isSwagger2 ? doc.definitions : doc.components?.schemas) || {};
  const schemas: ApiSchemaDef[] = Object.entries<any>(rawSchemas).map(([name, raw]) => {
    const deref = dereferenceSchema(raw, doc);
    return {
      name,
      type: deref?.type || (deref?.properties ? 'object' : 'schema'),
      description: deref?.description,
      properties: deref?.properties,
      required: deref?.required,
      raw: deref,
    };
  });

  // Security Schemes
  const rawSec = (isSwagger2 ? doc.securityDefinitions : doc.components?.securitySchemes) || {};
  const securitySchemes: ApiSecurityScheme[] = Object.entries<any>(rawSec).map(([name, s]) => ({
    name,
    type: s?.type || 'apiKey',
    scheme: s?.scheme,
    in: s?.in,
    headerName: s?.name,
    description: s?.description,
  }));

  const versionLabel = isSwagger2 ? 'Swagger 2.0' : `OpenAPI ${doc.openapi || '3.0'}`;
  return {
    title: info.title || 'API Documentation',
    version: info.version || '1.0.0',
    description: info.description,
    sourceFormat: isSwagger2 ? 'swagger2' : 'openapi3',
    formatLabel: versionLabel,
    baseUrl,
    servers,
    tags: Array.from(tagMap.entries()).map(([name, description]) => ({ name, description })),
    endpoints,
    schemas,
    securitySchemes,
  };
}

/**
 * Parse Postman Collection v2.0 / v2.1
 */
function parsePostmanCollection(doc: any): Omit<ApiSpecRecord, 'id' | 'rawJson' | 'createdAt' | 'updatedAt'> {
  const info = doc.info || {};
  const endpoints: ApiEndpoint[] = [];
  const tagSet = new Set<string>();
  const detectedBaseUrls: string[] = [];

  const extractUrlInfo = (urlObj: any): { rawPath: string; hostUrl: string; queryParams: ApiParameter[]; pathParams: ApiParameter[] } => {
    if (!urlObj) return { rawPath: '/', hostUrl: '', queryParams: [], pathParams: [] };
    if (typeof urlObj === 'string') {
      try {
        const cleaned = urlObj.replace(/\{\{[^}]+\}\}/g, '');
        if (cleaned.startsWith('http')) {
          const u = new URL(cleaned);
          return {
            rawPath: u.pathname || '/',
            hostUrl: `${u.protocol}//${u.host}`,
            queryParams: Array.from(u.searchParams.entries()).map(([k, v]) => ({
              name: k,
              in: 'query',
              type: 'string',
              example: v,
            })),
            pathParams: [],
          };
        }
      } catch {}
      return { rawPath: urlObj.startsWith('/') ? urlObj : `/${urlObj}`, hostUrl: '', queryParams: [], pathParams: [] };
    }

    const hostArr = Array.isArray(urlObj.host) ? urlObj.host : [];
    const protocol = urlObj.protocol || 'https';
    const hostStr = hostArr.join('.');
    const hostUrl = hostStr && !hostStr.includes('{{') ? `${protocol}://${hostStr}` : '';
    const pathArr = Array.isArray(urlObj.path) ? urlObj.path : [];
    const rawPath = '/' + pathArr.map((seg: string) => (seg.startsWith(':') ? `{${seg.slice(1)}}` : seg)).join('/');

    const queryParams: ApiParameter[] = (Array.isArray(urlObj.query) ? urlObj.query : [])
      .filter((q: any) => q && q.key && !q.disabled)
      .map((q: any) => ({
        name: q.key,
        in: 'query' as const,
        type: 'string',
        description: q.description,
        example: q.value,
      }));

    const pathParams: ApiParameter[] = (Array.isArray(urlObj.variable) ? urlObj.variable : [])
      .filter((v: any) => v && v.key)
      .map((v: any) => ({
        name: v.key,
        in: 'path' as const,
        required: true,
        type: 'string',
        description: v.description,
        example: v.value,
      }));

    return { rawPath: rawPath || '/', hostUrl, queryParams, pathParams };
  };

  const walkItems = (items: any[], currentTag: string) => {
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      if (Array.isArray(item.item)) {
        const folderTag = item.name || currentTag;
        walkItems(item.item, folderTag);
        continue;
      }
      if (!item.request) continue;

      const req = item.request;
      const method = normalizeMethod(req.method || 'GET');
      const { rawPath, hostUrl, queryParams, pathParams } = extractUrlInfo(req.url);
      if (hostUrl && !detectedBaseUrls.includes(hostUrl)) {
        detectedBaseUrls.push(hostUrl);
      }

      const headers: ApiParameter[] = (Array.isArray(req.header) ? req.header : [])
        .filter((h: any) => h && h.key && !h.disabled)
        .map((h: any) => ({
          name: h.key,
          in: 'header' as const,
          type: 'string',
          description: h.description,
          example: h.value,
        }));

      let requestBody: ApiRequestBody | undefined;
      if (req.body) {
        if (req.body.mode === 'raw' && req.body.raw) {
          const parsedExample = formatJsonSafe(req.body.raw);
          requestBody = {
            contentType: 'application/json',
            example: parsedExample,
            schema: typeof parsedExample === 'object' ? inferSchemaFromExample(parsedExample) : undefined,
          };
        } else if (req.body.mode === 'urlencoded' && Array.isArray(req.body.urlencoded)) {
          const obj: Record<string, any> = {};
          req.body.urlencoded.forEach((f: any) => {
            if (f.key) obj[f.key] = f.value ?? '';
          });
          requestBody = {
            contentType: 'application/x-www-form-urlencoded',
            example: obj,
            schema: inferSchemaFromExample(obj),
          };
        } else if (req.body.mode === 'formdata' && Array.isArray(req.body.formdata)) {
          const obj: Record<string, any> = {};
          req.body.formdata.forEach((f: any) => {
            if (f.key) obj[f.key] = f.value ?? `[${f.type || 'file'}]`;
          });
          requestBody = {
            contentType: 'multipart/form-data',
            example: obj,
            schema: inferSchemaFromExample(obj),
          };
        }
      }

      const responses: ApiResponseDef[] = (Array.isArray(item.response) ? item.response : []).map((resp: any) => {
        const parsedBody = formatJsonSafe(resp.body);
        return {
          statusCode: String(resp.code || resp.status || '200'),
          description: resp.name || resp.status || 'Réponse enregistrée',
          contentType: 'application/json',
          example: parsedBody,
          schema: typeof parsedBody === 'object' && parsedBody !== null ? inferSchemaFromExample(parsedBody) : undefined,
        };
      });

      if (responses.length === 0) {
        responses.push({ statusCode: '200', description: 'Réponse attendue' });
      }

      tagSet.add(currentTag);
      endpoints.push({
        id: `pm_${endpoints.length}_${method}`,
        method,
        path: rawPath,
        summary: item.name || `${method} ${rawPath}`,
        description: typeof req.description === 'string' ? req.description : req.description?.content,
        tag: currentTag,
        parameters: [...pathParams, ...queryParams, ...headers],
        requestBody,
        responses,
      });
    }
  };

  walkItems(Array.isArray(doc.item) ? doc.item : [], 'Collection');

  // Extract Postman variables if baseUrl not detected
  let baseUrl = detectedBaseUrls[0] || '';
  if (!baseUrl && Array.isArray(doc.variable)) {
    const baseVar = doc.variable.find((v: any) =>
      ['baseUrl', 'base_url', 'url', 'host', 'endpoint'].includes(String(v?.key))
    );
    if (baseVar?.value) baseUrl = String(baseVar.value);
  }

  return {
    title: info.name || 'Collection Postman',
    version: info.version || '2.1',
    description: typeof info.description === 'string' ? info.description : info.description?.content,
    sourceFormat: 'postman',
    formatLabel: 'Postman Collection',
    baseUrl,
    servers: baseUrl ? [{ url: baseUrl }] : [],
    tags: Array.from(tagSet).map((name) => ({ name })),
    endpoints,
    schemas: [],
  };
}

/**
 * Parse Insomnia v4 export JSON
 */
function parseInsomniaExport(doc: any): Omit<ApiSpecRecord, 'id' | 'rawJson' | 'createdAt' | 'updatedAt'> {
  const resources: any[] = Array.isArray(doc.resources) ? doc.resources : [];
  const workspace = resources.find((r) => r._type === 'workspace');
  const groups = new Map<string, string>();
  for (const r of resources) {
    if (r._type === 'request_group' && r._id) {
      groups.set(r._id, r.name || 'Dossier');
    }
  }

  const endpoints: ApiEndpoint[] = [];
  const tagSet = new Set<string>();
  let detectedBase = '';

  for (const r of resources) {
    if (r._type !== 'request') continue;
    const method = normalizeMethod(r.method || 'GET');
    let pathStr = String(r.url || '/');
    try {
      const cleaned = pathStr.replace(/\{\{[^}]+\}\}/g, '');
      if (cleaned.startsWith('http')) {
        const u = new URL(cleaned);
        if (!detectedBase) detectedBase = `${u.protocol}//${u.host}`;
        pathStr = u.pathname || '/';
      }
    } catch {}

    const tag = groups.get(r.parentId) || 'Endpoints';
    tagSet.add(tag);

    const parameters: ApiParameter[] = [];
    if (Array.isArray(r.parameters)) {
      for (const p of r.parameters) {
        if (p?.name && !p.disabled) {
          parameters.push({ name: p.name, in: 'query', type: 'string', example: p.value });
        }
      }
    }
    if (Array.isArray(r.headers)) {
      for (const h of r.headers) {
        if (h?.name && !h.disabled) {
          parameters.push({ name: h.name, in: 'header', type: 'string', example: h.value });
        }
      }
    }

    let requestBody: ApiRequestBody | undefined;
    if (r.body?.text) {
      const parsed = formatJsonSafe(r.body.text);
      requestBody = {
        contentType: r.body.mimeType || 'application/json',
        example: parsed,
        schema: typeof parsed === 'object' ? inferSchemaFromExample(parsed) : undefined,
      };
    }

    endpoints.push({
      id: `ins_${endpoints.length}_${method}`,
      method,
      path: pathStr,
      summary: r.name || `${method} ${pathStr}`,
      description: r.description,
      tag,
      parameters,
      requestBody,
      responses: [{ statusCode: '200', description: 'Réponse attendue' }],
    });
  }

  return {
    title: workspace?.name || 'Export Insomnia',
    version: '4.0',
    description: workspace?.description,
    sourceFormat: 'insomnia',
    formatLabel: 'Insomnia Export',
    baseUrl: detectedBase,
    servers: detectedBase ? [{ url: detectedBase }] : [],
    tags: Array.from(tagSet).map((name) => ({ name })),
    endpoints,
    schemas: [],
  };
}

/**
 * Adaptive Generic JSON API Parser:
 * Adapts dynamically to ANY custom JSON structure (arrays of endpoints, nested route maps,
 * custom API manifests, service registries, or arbitrary JSON data/payloads).
 */
function parseAdaptiveCustomJson(
  doc: any,
  fileName?: string
): Omit<ApiSpecRecord, 'id' | 'rawJson' | 'createdAt' | 'updatedAt'> {
  const endpoints: ApiEndpoint[] = [];
  const schemas: ApiSchemaDef[] = [];
  const tagSet = new Set<string>();

  const title =
    (typeof doc === 'object' && !Array.isArray(doc) && (doc.title || doc.name || doc.apiName || doc.service || doc.project)) ||
    (fileName ? fileName.replace(/\.json$/i, '') : 'API JSON Personnalisée');
  const version = (typeof doc === 'object' && !Array.isArray(doc) && String(doc.version || doc.apiVersion || '1.0.0')) || '1.0.0';
  const description = (typeof doc === 'object' && !Array.isArray(doc) && (doc.description || doc.summary || doc.notes)) || undefined;
  const baseUrl =
    (typeof doc === 'object' &&
      !Array.isArray(doc) &&
      (doc.baseUrl || doc.base_url || doc.host || doc.url || doc.server || doc.endpoint_base || '')) ||
    '';

  const normalizeParamsFromObj = (
    raw: any,
    defaultIn: ApiParameter['in']
  ): ApiParameter[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw
        .filter((p) => p && (typeof p === 'string' || p.name || p.key))
        .map((p) => {
          if (typeof p === 'string') {
            return { name: p, in: defaultIn, type: 'string' };
          }
          return {
            name: p.name || p.key,
            in: (['path', 'query', 'header', 'cookie'].includes(p.in) ? p.in : defaultIn) as ApiParameter['in'],
            required: Boolean(p.required ?? defaultIn === 'path'),
            type: p.type || p.schema?.type || 'string',
            description: p.description || p.desc,
            example: p.example ?? p.value ?? p.default,
          };
        });
    }
    if (typeof raw === 'object') {
      return Object.entries<any>(raw).map(([k, v]) => {
        if (v && typeof v === 'object' && ('type' in v || 'required' in v || 'description' in v || 'example' in v)) {
          return {
            name: k,
            in: (['path', 'query', 'header', 'cookie'].includes(v.in) ? v.in : defaultIn) as ApiParameter['in'],
            required: Boolean(v.required ?? defaultIn === 'path'),
            type: v.type || 'string',
            description: v.description,
            example: v.example ?? v.default,
          };
        }
        return {
          name: k,
          in: defaultIn,
          type: typeof v,
          example: v,
        };
      });
    }
    return [];
  };

  const extractEndpointFromNode = (node: any, fallbackPath?: string, fallbackMethod?: string, fallbackTag = 'Endpoints') => {
    if (!node || typeof node !== 'object') return;
    const rawPath =
      node.path ||
      node.url ||
      node.route ||
      node.endpoint ||
      node.uri ||
      fallbackPath ||
      '/';

    // Handle "GET /users" syntax in path string
    let detectedMethod = node.method || node.httpMethod || node.verb || node.type || fallbackMethod;
    let cleanPath = String(rawPath);
    const spaceMatch = cleanPath.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(.+)$/i);
    if (spaceMatch) {
      detectedMethod = detectedMethod || spaceMatch[1];
      cleanPath = spaceMatch[2];
    }

    const method = normalizeMethod(detectedMethod || (node.body || node.payload || node.requestBody ? 'POST' : 'GET'));
    const tag = String(node.tag || node.group || node.category || node.module || node.resource || fallbackTag);
    tagSet.add(tag);

    // Parameters
    const parameters: ApiParameter[] = [
      ...normalizeParamsFromObj(node.parameters || node.params, 'query'),
      ...normalizeParamsFromObj(node.pathParams || node.path_params, 'path'),
      ...normalizeParamsFromObj(node.query || node.queryParams || node.query_params, 'query'),
      ...normalizeParamsFromObj(node.headers || node.header, 'header'),
    ];

    // Auto-detect {param} or :param from path if not already declared
    const pathMatches = cleanPath.match(/\{([^}]+)\}|:([a-zA-Z0-9_]+)/g);
    if (pathMatches) {
      for (const m of pathMatches) {
        const pName = m.replace(/^[{:]/, '').replace(/\}$/, '');
        if (!parameters.some((p) => p.name === pName && p.in === 'path')) {
          parameters.unshift({ name: pName, in: 'path', required: true, type: 'string' });
        }
      }
    }

    // Request body
    const rawBody = node.requestBody ?? node.body ?? node.payload ?? node.input ?? node.data;
    let requestBody: ApiRequestBody | undefined;
    if (rawBody !== undefined && rawBody !== null) {
      const formatted = formatJsonSafe(rawBody);
      if (typeof formatted === 'object' && formatted.schema) {
        requestBody = {
          contentType: formatted.contentType || 'application/json',
          schema: formatted.schema,
          example: formatted.example ?? generateSampleFromSchema(formatted.schema),
          description: formatted.description,
          required: formatted.required,
        };
      } else {
        requestBody = {
          contentType: 'application/json',
          example: formatted,
          schema: typeof formatted === 'object' ? inferSchemaFromExample(formatted) : { type: typeof formatted },
        };
      }
    }

    // Responses
    const responses: ApiResponseDef[] = [];
    const rawResp = node.responses ?? node.response ?? node.output ?? node.returns ?? node.result;
    if (Array.isArray(rawResp)) {
      for (const r of rawResp) {
        if (r && typeof r === 'object') {
          const ex = formatJsonSafe(r.example ?? r.body ?? r.data ?? r);
          responses.push({
            statusCode: String(r.statusCode || r.status || r.code || '200'),
            description: r.description || r.message || 'Réponse',
            contentType: 'application/json',
            example: ex,
            schema: r.schema || (typeof ex === 'object' ? inferSchemaFromExample(ex) : undefined),
          });
        }
      }
    } else if (rawResp && typeof rawResp === 'object') {
      const keys = Object.keys(rawResp);
      const looksLikeStatusMap = keys.length > 0 && keys.every((k) => /^\d{3}$/.test(k) || k === 'default');
      if (looksLikeStatusMap) {
        for (const [code, val] of Object.entries<any>(rawResp)) {
          const ex = formatJsonSafe(val?.example ?? val?.body ?? val);
          responses.push({
            statusCode: code,
            description: val?.description || `Statut ${code}`,
            contentType: 'application/json',
            example: ex,
            schema: val?.schema || (typeof ex === 'object' ? inferSchemaFromExample(ex) : undefined),
          });
        }
      } else {
        const ex = formatJsonSafe(rawResp);
        responses.push({
          statusCode: '200',
          description: 'Réponse JSON',
          contentType: 'application/json',
          example: ex,
          schema: inferSchemaFromExample(ex),
        });
      }
    } else if (rawResp !== undefined) {
      responses.push({
        statusCode: '200',
        description: 'Réponse',
        example: rawResp,
      });
    } else {
      responses.push({ statusCode: '200', description: 'Succès' });
    }

    endpoints.push({
      id: `custom_${endpoints.length}_${method}`,
      method,
      path: cleanPath.startsWith('/') || cleanPath.startsWith('http') ? cleanPath : `/${cleanPath}`,
      summary: node.summary || node.title || node.name || node.label || `${method} ${cleanPath}`,
      description: node.description || node.desc || node.notes,
      tag,
      deprecated: Boolean(node.deprecated),
      parameters,
      requestBody,
      responses,
    });
  };

  const isEndpointLikeObject = (obj: any): boolean => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
    const keys = Object.keys(obj);
    return keys.some((k) =>
      ['method', 'httpMethod', 'verb', 'path', 'url', 'route', 'endpoint', 'uri', 'requestBody', 'payload', 'responses', 'response'].includes(k)
    );
  };

  // Recursive adaptive walker
  const walkAdaptive = (node: any, currentTag: string, currentKeyPath: string) => {
    if (!node) return;
    if (Array.isArray(node)) {
      for (const item of node) {
        if (isEndpointLikeObject(item)) {
          extractEndpointFromNode(item, undefined, undefined, currentTag);
        } else if (typeof item === 'object') {
          walkAdaptive(item, currentTag, currentKeyPath);
        }
      }
      return;
    }

    if (typeof node === 'object') {
      // Check common container array keys first
      const listKeys = ['endpoints', 'routes', 'apis', 'api', 'operations', 'methods', 'actions', 'requests', 'services', 'resources', 'items'];
      let handledContainer = false;

      for (const lk of listKeys) {
        if (node[lk] && (Array.isArray(node[lk]) || typeof node[lk] === 'object')) {
          walkAdaptive(node[lk], currentTag, currentKeyPath);
          handledContainer = true;
        }
      }

      // Check schemas / models
      const schemaContainers = ['schemas', 'models', 'definitions', 'types', 'entities'];
      for (const sk of schemaContainers) {
        if (node[sk] && typeof node[sk] === 'object' && !Array.isArray(node[sk])) {
          for (const [modelName, modelDef] of Object.entries<any>(node[sk])) {
            const schemaObj = modelDef?.properties || modelDef?.type ? modelDef : inferSchemaFromExample(modelDef);
            schemas.push({
              name: modelName,
              type: schemaObj.type || 'object',
              description: modelDef?.description,
              properties: schemaObj.properties,
              required: schemaObj.required,
              raw: schemaObj,
            });
          }
        }
      }

      if (handledContainer) return;

      // Walk keys as routes ("GET /users", "/users", or grouped objects)
      const metaKeys = new Set([
        'title', 'name', 'apiName', 'version', 'apiVersion', 'description', 'summary',
        'baseUrl', 'base_url', 'host', 'url', 'server', 'tags', 'servers',
        'schemas', 'models', 'definitions', 'types', 'entities', 'auth', 'security',
      ]);

      for (const [key, val] of Object.entries<any>(node)) {
        if (metaKeys.has(key)) continue;

        const methodPathMatch = key.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(.+)$/i);
        if (methodPathMatch) {
          if (val && typeof val === 'object') {
            extractEndpointFromNode(val, methodPathMatch[2], methodPathMatch[1], currentTag);
          } else {
            extractEndpointFromNode({ response: val }, methodPathMatch[2], methodPathMatch[1], currentTag);
          }
          continue;
        }

        if (key.startsWith('/')) {
          if (val && typeof val === 'object') {
            const subKeys = Object.keys(val);
            const hasMethodKeys = subKeys.some((sk) => VALID_METHODS.includes(sk.toUpperCase() as HttpMethod));
            if (hasMethodKeys) {
              for (const [mKey, opVal] of Object.entries<any>(val)) {
                if (VALID_METHODS.includes(mKey.toUpperCase() as HttpMethod)) {
                  extractEndpointFromNode(opVal, key, mKey, currentTag);
                }
              }
            } else {
              extractEndpointFromNode(val, key, undefined, currentTag);
            }
          }
          continue;
        }

        if (VALID_METHODS.includes(key.toUpperCase() as HttpMethod) && val && typeof val === 'object') {
          extractEndpointFromNode(val, currentKeyPath || '/', key, currentTag);
          continue;
        }

        if (Array.isArray(val)) {
          walkAdaptive(val, key, `${currentKeyPath}/${key}`);
        } else if (val && typeof val === 'object') {
          if (isEndpointLikeObject(val)) {
            extractEndpointFromNode(val, val.path || val.url || `/${key}`, undefined, currentTag);
          } else {
            walkAdaptive(val, key, `${currentKeyPath}/${key}`);
          }
        }
      }
    }
  };

  walkAdaptive(doc, 'API', '');

  // Ultimate fallback: if the user uploaded a raw JSON payload / config / sample dataset
  // with no explicit route keys, turn top-level keys into readable GET resource endpoints + schemas!
  if (endpoints.length === 0) {
    if (Array.isArray(doc)) {
      tagSet.add('Ressource JSON');
      const inferred = inferSchemaFromExample(doc);
      schemas.push({
        name: 'RootCollection',
        type: 'array',
        raw: inferred,
      });
      endpoints.push({
        id: 'adaptive_root_list',
        method: 'GET',
        path: '/items',
        summary: 'Liste des éléments (inférée depuis tableau JSON)',
        tag: 'Ressource JSON',
        parameters: [],
        responses: [
          {
            statusCode: '200',
            description: 'Données JSON détectées',
            contentType: 'application/json',
            example: doc.slice(0, 5),
            schema: inferred,
          },
        ],
      });
    } else if (doc && typeof doc === 'object') {
      tagSet.add('Ressources Inférées');
      for (const [key, val] of Object.entries(doc)) {
        const inferred = inferSchemaFromExample(val);
        if (val && typeof val === 'object') {
          schemas.push({
            name: key,
            type: inferred.type,
            properties: inferred.properties,
            raw: inferred,
          });
        }
        endpoints.push({
          id: `adaptive_${endpoints.length}`,
          method: 'GET',
          path: `/${key}`,
          summary: `Ressource ${key} (structure inférée)`,
          tag: 'Ressources Inférées',
          parameters: [],
          responses: [
            {
              statusCode: '200',
              description: `Structure détectée pour "${key}"`,
              contentType: 'application/json',
              example: val,
              schema: inferred,
            },
          ],
        });
      }
    }
  }

  return {
    title: String(title),
    version,
    description: description ? String(description) : undefined,
    sourceFormat: 'custom_json' as ApiSourceFormat,
    formatLabel: 'JSON Adaptatif',
    baseUrl: String(baseUrl || ''),
    servers: baseUrl ? [{ url: String(baseUrl) }] : [],
    tags: Array.from(tagSet).map((name) => ({ name })),
    endpoints,
    schemas,
  };
}

/**
 * Main entry point: parses any JSON API string or object into a normalized ApiSpecRecord draft
 */
export function parseAnyApiJson(
  input: string | any,
  options?: { fileName?: string; importedBy?: string; existingId?: string }
): ApiSpecRecord {
  const rawJson = typeof input === 'string' ? input : JSON.stringify(input, null, 2);
  let doc: any;
  try {
    doc = typeof input === 'string' ? JSON.parse(input) : input;
  } catch (err: any) {
    throw new Error(`JSON invalide : ${err?.message || 'Erreur de syntaxe'}`);
  }

  if (doc === null || (typeof doc !== 'object')) {
    throw new Error('Le fichier JSON doit contenir un objet ou un tableau JSON.');
  }

  let parsed: Omit<ApiSpecRecord, 'id' | 'rawJson' | 'createdAt' | 'updatedAt'>;

  if (doc && typeof doc === 'object' && !Array.isArray(doc)) {
    if (typeof doc.openapi === 'string' || (doc.paths && doc.components)) {
      parsed = parseOpenApiOrSwagger(doc, false);
    } else if (doc.swagger === '2.0' || (doc.paths && (doc.definitions || doc.basePath || doc.host))) {
      parsed = parseOpenApiOrSwagger(doc, true);
    } else if (
      (doc.info && (doc.info._postman_id || String(doc.info.schema || '').includes('postman'))) ||
      (Array.isArray(doc.item) && doc.item.some((i: any) => i && (i.request || Array.isArray(i.item))))
    ) {
      parsed = parsePostmanCollection(doc);
    } else if (doc._type === 'export' && Array.isArray(doc.resources)) {
      parsed = parseInsomniaExport(doc);
    } else if (doc.paths && typeof doc.paths === 'object') {
      parsed = parseOpenApiOrSwagger(doc, false);
    } else {
      parsed = parseAdaptiveCustomJson(doc, options?.fileName);
    }
  } else {
    parsed = parseAdaptiveCustomJson(doc, options?.fileName);
  }

  const now = new Date().toISOString();
  return {
    id: options?.existingId || `api_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    ...parsed,
    rawJson,
    fileName: options?.fileName,
    importedBy: options?.importedBy,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Resolve final URL by replacing {param} / :param and appending query params
 */
export function resolveFullEndpointUrl(
  baseUrl: string,
  path: string,
  paramValues: Record<string, string>,
  parameters: ApiParameter[]
): string {
  let finalPath = path;
  for (const p of parameters) {
    if (p.in === 'path') {
      const val = paramValues[`path:${p.name}`] ?? p.example ?? p.default ?? '';
      finalPath = finalPath
        .replace(new RegExp(`\\{${p.name}\\}`, 'g'), encodeURIComponent(String(val)))
        .replace(new RegExp(`:${p.name}\\b`, 'g'), encodeURIComponent(String(val)));
    }
  }

  const cleanBase = (baseUrl || '').replace(/\/+$/, '');
  const fullPath = finalPath.startsWith('http')
    ? finalPath
    : `${cleanBase}${finalPath.startsWith('/') ? finalPath : `/${finalPath}`}`;

  const queryEntries: string[] = [];
  for (const p of parameters) {
    if (p.in === 'query') {
      const val = paramValues[`query:${p.name}`];
      if (val !== undefined && val !== '') {
        queryEntries.push(`${encodeURIComponent(p.name)}=${encodeURIComponent(String(val))}`);
      }
    }
  }
  if (queryEntries.length === 0) return fullPath;
  return `${fullPath}${fullPath.includes('?') ? '&' : '?'}${queryEntries.join('&')}`;
}

/**
 * Generate a clean cURL command for an endpoint
 */
export function buildCurlCommand(
  fullUrl: string,
  method: HttpMethod,
  headers: Record<string, string>,
  bodyText?: string
): string {
  const parts = [`curl -X ${method} "${fullUrl || 'https://api.exemple.com'}"`];
  for (const [k, v] of Object.entries(headers)) {
    if (v) {
      parts.push(`  -H "${k}: ${v}"`);
    }
  }
  if (!['GET', 'HEAD'].includes(method) && bodyText && bodyText.trim()) {
    const escaped = bodyText.replace(/'/g, "'\\''");
    parts.push(`  -d '${escaped}'`);
  }
  return parts.join(' \\\n');
}
