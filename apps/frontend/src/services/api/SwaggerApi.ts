/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (securityData: SecurityDataType | null) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown> extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "http://localhost:8080";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) => fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter((key) => "undefined" !== typeof query[key]);
    return keys
      .map((key) => (Array.isArray(query[key]) ? this.addArrayQueryParam(query, key) : this.addQueryParam(query, key)))
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string") ? JSON.stringify(input) : input,
    [ContentType.Text]: (input: any) => (input !== null && typeof input !== "string" ? JSON.stringify(input) : input),
    [ContentType.FormData]: (input: FormData) =>
      (Array.from(input.keys()) || []).reduce((formData, key) => {
        const property = input.get(key);
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData()),
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(params1: RequestParams, params2?: RequestParams): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (cancelToken: CancelToken): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(`${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`, {
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type && type !== ContentType.FormData ? { "Content-Type": type } : {}),
      },
      signal: (cancelToken ? this.createAbortSignal(cancelToken) : requestParams.signal) || null,
      body: typeof body === "undefined" || body === null ? null : payloadFormatter(body),
    }).then(async (response) => {
      const r = response.clone() as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const data = !responseFormat
        ? r
        : await response[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title Locali
 * @version 0.0.1
 * @baseUrl http://localhost:8080
 *
 * API server of locali
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Healthcheck
   *
   * @name GetRoot
   * @request GET:/
   */
  getRoot = (params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/`,
      method: "GET",
      ...params,
    });

  api = {
    /**
     * @description Create user
     *
     * @name V1UsersCreate
     * @request POST:/api/v1/users
     */
    v1UsersCreate: (
      data: {
        /** @minLength 1 */
        email: string;
        /**
         * @minLength 8
         * @maxLength 256
         */
        password: any;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/v1/users`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description List users
     *
     * @name V1UsersList
     * @request GET:/api/v1/users
     */
    v1UsersList: (
      query?: {
        /**
         * @min 1
         * @max 50
         * @default 25
         */
        limit?: number;
        /**
         * @min 0
         * @default 0
         */
        offset?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/v1/users`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * @description Delete user
     *
     * @name V1UsersDelete
     * @request DELETE:/api/v1/users/{id}
     */
    v1UsersDelete: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/v1/users/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * @description Get user
     *
     * @name V1UsersDetail
     * @request GET:/api/v1/users/{id}
     */
    v1UsersDetail: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/v1/users/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * @description Login user
     *
     * @name V1AuthLoginCreate
     * @request POST:/api/v1/auth/login
     */
    v1AuthLoginCreate: (
      data: {
        /** @minLength 1 */
        email: string;
        /** @minLength 1 */
        password: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/v1/auth/login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Logout user
     *
     * @name V1AuthLogoutCreate
     * @request POST:/api/v1/auth/logout
     */
    v1AuthLogoutCreate: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/v1/auth/logout`,
        method: "POST",
        ...params,
      }),

    /**
     * @description Create organisation
     *
     * @name V1OrganisationsCreate
     * @request POST:/api/v1/organisations
     */
    v1OrganisationsCreate: (
      data: {
        /** @minLength 1 */
        name: string;
        /** @minLength 1 */
        description: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/v1/organisations`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description List organisations
     *
     * @name V1OrganisationsList
     * @request GET:/api/v1/organisations
     */
    v1OrganisationsList: (
      query?: {
        /**
         * @min 1
         * @max 50
         * @default 25
         */
        limit?: number;
        /**
         * @min 0
         * @default 0
         */
        offset?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/v1/organisations`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * @description Delete organisation
     *
     * @name V1OrganisationsDelete
     * @request DELETE:/api/v1/organisations/{id}
     */
    v1OrganisationsDelete: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/v1/organisations/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * @description Get organisation
     *
     * @name V1OrganisationsDetail
     * @request GET:/api/v1/organisations/{id}
     */
    v1OrganisationsDetail: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/v1/organisations/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * @description Create project
     *
     * @name V1OrganisationsProjectsCreate
     * @request POST:/api/v1/organisations/{id}/projects
     */
    v1OrganisationsProjectsCreate: (
      id: string,
      data: {
        /** @minLength 1 */
        name: string;
        /** @minLength 1 */
        description: string | null;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/v1/organisations/${id}/projects`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description List organisation projects
     *
     * @name V1OrganisationsProjectsDetail
     * @request GET:/api/v1/organisations/{id}/projects
     */
    v1OrganisationsProjectsDetail: (
      id: string,
      query?: {
        /**
         * @min 1
         * @max 50
         * @default 25
         */
        limit?: number;
        /**
         * @min 0
         * @default 0
         */
        offset?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/v1/organisations/${id}/projects`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * @description Delete project
     *
     * @name V1ProjectsDelete
     * @request DELETE:/api/v1/projects/{id}
     */
    v1ProjectsDelete: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/v1/projects/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * @description Get project
     *
     * @name V1ProjectsDetail
     * @request GET:/api/v1/projects/{id}
     */
    v1ProjectsDetail: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/v1/projects/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * @description Add organisation member
     *
     * @name V1OrganisationsMembersCreate
     * @request POST:/api/v1/organisations/{org}/members
     */
    v1OrganisationsMembersCreate: (
      org: string,
      data: {
        /** @minLength 1 */
        userId: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/v1/organisations/${org}/members`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description List organisation members
     *
     * @name V1OrganisationsMembersDetail
     * @request GET:/api/v1/organisations/{org}/members
     */
    v1OrganisationsMembersDetail: (
      org: string,
      query?: {
        /**
         * @min 1
         * @max 50
         * @default 25
         */
        limit?: number;
        /**
         * @min 0
         * @default 0
         */
        offset?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/v1/organisations/${org}/members`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * @description Delete organisation member
     *
     * @name V1OrganisationsMembersDelete
     * @request DELETE:/api/v1/organisations/{org}/members/{id}
     */
    v1OrganisationsMembersDelete: (org: string, id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/v1/organisations/${org}/members/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * @description Get organisation member
     *
     * @name V1OrganisationsMembersDetail2
     * @request GET:/api/v1/organisations/{org}/members/{id}
     * @originalName v1OrganisationsMembersDetail
     * @duplicate
     */
    v1OrganisationsMembersDetail2: (org: string, id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/v1/organisations/${org}/members/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * @description Add project member
     *
     * @name V1ProjectsMembersCreate
     * @request POST:/api/v1/projects/{proj}/members
     */
    v1ProjectsMembersCreate: (
      proj: string,
      data: {
        /** @minLength 1 */
        userId: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/v1/projects/${proj}/members`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description List project members
     *
     * @name V1ProjectsMembersDetail
     * @request GET:/api/v1/projects/{proj}/members
     */
    v1ProjectsMembersDetail: (
      proj: string,
      query?: {
        /**
         * @min 1
         * @max 50
         * @default 25
         */
        limit?: number;
        /**
         * @min 0
         * @default 0
         */
        offset?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/v1/projects/${proj}/members`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * @description Delete project member
     *
     * @name V1ProjectsMembersDelete
     * @request DELETE:/api/v1/projects/{proj}/members/{id}
     */
    v1ProjectsMembersDelete: (proj: string, id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/v1/projects/${proj}/members/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * @description Get project member
     *
     * @name V1ProjectsMembersDetail2
     * @request GET:/api/v1/projects/{proj}/members/{id}
     * @originalName v1ProjectsMembersDetail
     * @duplicate
     */
    v1ProjectsMembersDetail2: (proj: string, id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/v1/projects/${proj}/members/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * @description Request password reset
     *
     * @name V1AuthPasswordResetCreate
     * @request POST:/api/v1/auth/password-reset
     */
    v1AuthPasswordResetCreate: (
      data: {
        /** @minLength 1 */
        email: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/v1/auth/password-reset`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Submit a password reset
     *
     * @name V1AuthPasswordResetSubmitCreate
     * @request POST:/api/v1/auth/password-reset/submit
     */
    v1AuthPasswordResetSubmitCreate: (
      data: {
        /** @minLength 1 */
        token: string;
        /**
         * @minLength 8
         * @maxLength 256
         */
        newPassword: any;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/v1/auth/password-reset/submit`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),
  };
  swagger = {
    /**
     * No description
     *
     * @name SwaggerList
     * @request GET:/swagger
     */
    swaggerList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/swagger`,
        method: "GET",
        ...params,
      }),
  };
}
