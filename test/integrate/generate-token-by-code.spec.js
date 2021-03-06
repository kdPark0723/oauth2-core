/* eslint-disable no-undef */
const {
  Client,
  Request,
  requestMethod,
  grantType,
} = require('../../lib');

const createServer = require('../util/create-server');
const getAuthorizationCode = require('../util/get-authorization-code');
const generateTokenByCode = require('../util/generate-token-by-code');
const ClientDataAccessor = require('../util/client-data-accessor');

describe('Generate Token By Authorization Code', () => {
  test('Generate Token Success By Confidential Client By Authorization', async () => {
    const redirectUri = 'https://oauth2-core/auth';

    const clientDataAccessor = new ClientDataAccessor();
    const client = await clientDataAccessor.insert(new Client({
      secret: 'SECRET',
      scope: ['authorizationCode:create', 'accessToken:create', 'refreshToken:create', 'test'],
      redirectUri,
    }));

    const server = createServer(clientDataAccessor);
    const code = await getAuthorizationCode(server, client, 'test');

    const response = await server.token(new Request({
      method: requestMethod.POST,
      headers: {
        Authorization: `Basic ${client.basic()}`,
      },
      body: {
        grant_type: grantType.AUTHORIZATION_CODE,
        code,
        redirect_uri: redirectUri,
        client_id: client.id,
      },
    }));

    expect(response.status).toEqual(201);
    expect(response.body.access_token).toEqual(expect.stringMatching(/[a-z0-9]+/));
    expect(response.body.refresh_token).toEqual(expect.stringMatching(/[a-z0-9]+/));
    expect(response.body.token_type).toEqual('bearer');
    expect(response.body.expires_in).toBeTruthy();
  });

  test('Generate Token Success By Confidential Client By secret', async () => {
    const redirectUri = 'https://oauth2-core/auth';

    const clientDataAccessor = new ClientDataAccessor();
    const client = await clientDataAccessor.insert(new Client({
      secret: 'SECRET',
      scope: ['authorizationCode:create', 'accessToken:create', 'refreshToken:create', 'test'],
      redirectUri,
    }));

    const server = createServer(clientDataAccessor);
    const code = await getAuthorizationCode(server, client, 'test');

    const response = await server.token(new Request({
      method: requestMethod.POST,
      body: {
        grant_type: grantType.AUTHORIZATION_CODE,
        code,
        redirect_uri: redirectUri,
        client_id: client.id,
        client_secret: client.secret,
      },
    }));

    expect(response.status).toEqual(201);
    expect(response.body.access_token).toEqual(expect.stringMatching(/[a-z0-9]+/));
    expect(response.body.refresh_token).toEqual(expect.stringMatching(/[a-z0-9]+/));
    expect(response.body.token_type).toEqual('bearer');
    expect(response.body.expires_in).toBeTruthy();
  });

  test('Generate Token Fail Because client not unauthorized client 1', async () => {
    const redirectUri = 'https://oauth2-core/auth';

    const clientDataAccessor = new ClientDataAccessor();
    const client = await clientDataAccessor.insert(new Client({
      scope: ['authorizationCode:create', 'accessToken:create', 'refreshToken:create', 'test'],
      redirectUri,
    }));

    const server = createServer(clientDataAccessor);
    const code = await getAuthorizationCode(server, client, 'test');

    const response = await server.token(new Request({
      method: requestMethod.POST,
      body: {
        grant_type: grantType.AUTHORIZATION_CODE,
        code,
        redirect_uri: redirectUri,
        client_id: client.id,
      },
    }));

    expect(response.status).toEqual(401);
    expect(response.body.error).toEqual('unauthorized_client');
  });

  test('Generate Token Fail Because client not unauthorized client 2', async () => {
    const redirectUri = 'https://oauth2-core/auth';

    const clientDataAccessor = new ClientDataAccessor();
    const client = await clientDataAccessor.insert(new Client({
      scope: ['authorizationCode:create', 'accessToken:create', 'refreshToken:create', 'test'],
      redirectUri,
    }));

    const server = createServer(clientDataAccessor);
    const code = await getAuthorizationCode(server, client, 'test');

    const response = await server.token(new Request({
      method: requestMethod.POST,
      body: {
        grant_type: grantType.AUTHORIZATION_CODE,
        code,
        redirect_uri: redirectUri,
        client_id: client.id,
        client_secret: 'SECRET',
      },
    }));

    expect(response.status).toEqual(401);
    expect(response.body.error).toEqual('unauthorized_client');
  });

  test('Generate Token Fail Because client not unauthorized client 3', async () => {
    const redirectUri = 'https://oauth2-core/auth';

    const clientDataAccessor = new ClientDataAccessor();
    const client = await clientDataAccessor.insert(new Client({
      scope: ['authorizationCode:create', 'accessToken:create', 'refreshToken:create', 'test'],
      redirectUri,
      secret: 'SECRET',
    }));

    const server = createServer(clientDataAccessor);
    const code = await getAuthorizationCode(server, client, 'test');

    const response = await server.token(new Request({
      method: requestMethod.POST,
      body: {
        grant_type: grantType.AUTHORIZATION_CODE,
        code,
        redirect_uri: redirectUri,
        client_id: client.id,
      },
    }));

    expect(response.status).toEqual(401);
    expect(response.body.error).toEqual('unauthorized_client');
  });

  test('Generate Token Fail Because use authorization code twice', async () => {
    const redirectUri = 'https://oauth2-core/auth';

    const clientDataAccessor = new ClientDataAccessor();
    const client = await clientDataAccessor.insert(new Client({
      scope: ['authorizationCode:create', 'accessToken:create', 'refreshToken:create', 'test'],
      redirectUri,
      secret: 'SECRET',
    }));

    const server = createServer(clientDataAccessor);
    const code = await getAuthorizationCode(server, client, 'test');

    await generateTokenByCode(server, client, code, redirectUri);

    const response = await generateTokenByCode(server, client, code, redirectUri);

    expect(response.status).toEqual(403);
    expect(response.body.error).toEqual('invalid_token');
  });
});

/* eslint-enable no-undef */
