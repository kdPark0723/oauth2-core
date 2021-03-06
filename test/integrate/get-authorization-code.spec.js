/* eslint-disable no-undef */
const queryString = require('query-string');

const {
  Client,
  Request,
  requestMethod,
  responseType,
} = require('../../lib');

const createServer = require('../util/create-server');
const ClientDataAccessor = require('../util/client-data-accessor');

describe('Get Authorization Code', () => {
  test('Get Authorization Code Success', async () => {
    const clientDataAccessor = new ClientDataAccessor();
    const client = await clientDataAccessor.insert(new Client({
      scope: ['authorizationCode:create', 'accessToken:create', 'refreshToken:create', 'test'],
    }));

    const server = createServer(clientDataAccessor);
    const state = Math.random();

    const response = await server.authorize(new Request({
      method: requestMethod.GET,
      query: {
        response_type: responseType.CODE,
        client_id: client.id,
        state,
        scope: ['test'],
      },
    }));

    expect(response.status).toEqual(200);
    expect(response.body.code).toEqual(expect.stringMatching(/[a-z0-9]+/));
    expect(response.body.state).toEqual(state);
  });

  test('Get Authorization Code Success By Post Method', async () => {
    const clientDataAccessor = new ClientDataAccessor();
    const client = await clientDataAccessor.insert(new Client({
      scope: ['authorizationCode:create', 'accessToken:create', 'refreshToken:create', 'test'],
    }));
    const server = createServer(clientDataAccessor);
    const state = Math.random();

    const response = await server.authorize(new Request({
      method: requestMethod.POST,
      body: {
        response_type: responseType.CODE,
        client_id: client.id,
        state,
        scope: ['test'],
      },
    }));

    expect(response.status).toEqual(201);
    expect(response.body.code).toEqual(expect.stringMatching(/[a-z0-9]+/));
    expect(response.body.state).toEqual(state);
  });

  test('Get Authorization Code Redirect Success', async () => {
    const redirectUri = 'https://oauth2-core/auth';

    const clientDataAccessor = new ClientDataAccessor();
    const client = await clientDataAccessor.insert(new Client({
      scope: ['authorizationCode:create', 'accessToken:create', 'refreshToken:create', 'test'],
      redirectUri,
    }));
    const server = createServer(clientDataAccessor);
    const state = Math.random();

    const response = await server.authorize(new Request({
      method: requestMethod.POST,
      body: {
        response_type: responseType.CODE,
        client_id: client.id,
        state,
        scope: ['test'],
        redirect_uri: redirectUri,
      },
    }));

    expect(response.status).toEqual(302);

    const location = response.get('Location');
    expect(location).toBeTruthy();

    const uriAndQuery = location.split('?');
    const uri = uriAndQuery[0];
    const query = queryString.parse(uriAndQuery[1]);

    expect(uri).toEqual(redirectUri);
    expect(query.code).toEqual(expect.stringMatching(/[a-z0-9]+/));
    expect(Number.parseFloat(query.state)).toEqual(state);
  });

  test('Get Authorization Code Redirect Fail', async () => {
    const redirectUri = 'https://oauth2-core/auth';

    const clientDataAccessor = new ClientDataAccessor();
    const client = await clientDataAccessor.insert(new Client({
      scope: ['authorizationCode:create', 'accessToken:create', 'refreshToken:create', 'test'],
      redirectUri,
    }));
    const server = createServer(clientDataAccessor);
    const state = Math.random();

    const response = await server.authorize(new Request({
      method: requestMethod.POST,
      body: {
        response_type: responseType.CODE,
        client_id: client.id,
        state,
        scope: ['test'],
        redirect_uri: 'other redirect uri',
      },
    }));

    expect(response.status).toEqual(400);
    expect(response.body.error).toEqual('invalid_redirect_url');
  });

  test('Get Authorization Code Fail Because scope is invalid', async () => {
    const clientDataAccessor = new ClientDataAccessor();
    const client = await clientDataAccessor.insert(new Client());
    const server = createServer(clientDataAccessor);
    const state = Math.random();

    const response = await server.authorize(new Request({
      method: requestMethod.POST,
      body: {
        response_type: responseType.CODE,
        client_id: client.id,
        state,
        scope: ['test'],
      },
    }));

    expect(response.status).toEqual(403);
    expect(response.body.error).toEqual('invalid_scope');
  });

  test('Get Authorization Code Fail Because client not exist', async () => {
    const clientDataAccessor = new ClientDataAccessor();
    const server = createServer(clientDataAccessor);
    const state = Math.random();

    const response = await server.authorize(new Request({
      method: requestMethod.POST,
      body: {
        response_type: responseType.CODE,
        client_id: 'test',
        state,
        scope: ['test'],
      },
    }));

    expect(response.status).toEqual(401);
    expect(response.body.error).toEqual('unauthorized_client');
  });

  test('Get Authorization Code Fail Because unsupported response type', async () => {
    const clientDataAccessor = new ClientDataAccessor();
    const client = await clientDataAccessor.insert(new Client({
      scope: ['authorizationCode:create', 'accessToken:create', 'refreshToken:create', 'test'],
    }));
    const server = createServer(clientDataAccessor);
    const state = Math.random();

    const response = await server.authorize(new Request({
      method: requestMethod.POST,
      body: {
        response_type: 'unsupported response type ',
        client_id: client.id,
        state,
        scope: ['test'],
      },
    }));

    expect(response.status).toEqual(400);
    expect(response.body.error).toEqual('unsupported_response_type');
  });

  test('Get Authorization Code Fail Because method not allow 1', async () => {
    const clientDataAccessor = new ClientDataAccessor();
    const client = await clientDataAccessor.insert(new Client({
      scope: ['authorizationCode:create', 'accessToken:create', 'refreshToken:create', 'test'],
    }));
    const server = createServer(clientDataAccessor);
    const state = Math.random();

    const response = await server.authorize(new Request({
      method: requestMethod.DELETE,
      body: {
        response_type: responseType.CODE,
        client_id: client.id,
        state,
        scope: ['test'],
      },
    }));

    expect(response.status).toEqual(405);
    expect(response.body.error).toEqual('method_not_allow');
  });

  test('Get Authorization Code Fail Because method not allow 2', async () => {
    const clientDataAccessor = new ClientDataAccessor();
    const client = await clientDataAccessor.insert(new Client({
      scope: ['authorizationCode:create', 'accessToken:create', 'refreshToken:create', 'test'],
    }));
    const server = createServer(clientDataAccessor);
    const state = Math.random();

    const response = await server.authorize(new Request({
      method: 'not allowed method',
      body: {
        response_type: responseType.CODE,
        client_id: client.id,
        state,
        scope: ['test'],
      },
    }));

    expect(response.status).toEqual(405);
    expect(response.body.error).toEqual('method_not_allow');
  });

  test('Get Authorization Code Fail Because unsupported response type And Redirect Success', async () => {
    const redirectUri = 'https://oauth2-core/auth';

    const clientDataAccessor = new ClientDataAccessor();
    const client = await clientDataAccessor.insert(new Client({
      scope: ['authorizationCode:create', 'accessToken:create', 'refreshToken:create', 'test'],
      redirectUri,
    }));
    const server = createServer(clientDataAccessor);
    const state = Math.random();

    const response = await server.authorize(new Request({
      method: requestMethod.POST,
      body: {
        response_type: 'unsupported response type ',
        client_id: client.id,
        state,
        scope: ['test'],
        redirect_uri: redirectUri,
      },
    }));

    expect(response.status).toEqual(302);

    const location = response.get('Location');
    expect(location).toBeTruthy();

    const uriAndQuery = location.split('?');
    const uri = uriAndQuery[0];
    const query = queryString.parse(uriAndQuery[1]);

    expect(uri).toEqual(redirectUri);
    expect(query.error).toEqual('unsupported_response_type');
    expect(Number.parseFloat(query.state)).toEqual(state);
  });
});

/* eslint-enable no-undef */
