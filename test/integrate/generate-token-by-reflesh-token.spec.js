/* eslint-disable no-undef */
const createServer = require('./create-server');
const getAuthorizationCode = require('./get-authorization-code');
const generateTokenByCode = require('./generate-token-by-code');

const ClientDataAccessor = require('../mock/client-data-accessor');
const Client = require('../../lib/client/client');

const Request = require('../../lib/http/request/request');
const requestMethod = require('../../lib/http/request/request-method');
const grantType = require('../../lib/token/grant-type');

describe('Generate Token By Refresh Token', () => {
  test('Generate Token Success', async () => {
    const redirectUri = 'https://oauth2-core/auth';

    const clientDataAccessor = new ClientDataAccessor();
    const client = await clientDataAccessor.insert(new Client({
      secret: 'SECRET',
      scope: ['test'],
      redirectUri,
    }));

    const server = createServer(clientDataAccessor);
    const code = await getAuthorizationCode(server, client, 'test');

    // eslint-disable-next-line max-len
    const refreshToken = (await generateTokenByCode(server, client, code, redirectUri)).body.refresh_token;

    const response = await server.token(new Request({
      method: requestMethod.POST,
      headers: {
        Authorization: `Basic ${client.base64()}`,
      },
      body: {
        grant_type: grantType.REFRESH_TOKEN,
        refresh_token: refreshToken,
        scope: ['test'],
      },
    }));

    expect(response.status).toEqual(201);
    expect(response.body.access_token).toEqual(expect.stringMatching(/[a-z0-9]+/));
    expect(response.body.token_type).toEqual('bearer');
  });

  test('Generate Token Fail Because Client Not Same', async () => {
    const redirectUri = 'https://oauth2-core/auth';

    const clientDataAccessor = new ClientDataAccessor();
    const client = await clientDataAccessor.insert(new Client({
      secret: 'SECRET',
      scope: ['test'],
      redirectUri,
    }));

    const server = createServer(clientDataAccessor);
    const code = await getAuthorizationCode(server, client, 'test');

    // eslint-disable-next-line max-len
    const refreshToken = (await generateTokenByCode(server, client, code, redirectUri)).body.refresh_token;

    const otherClient = await clientDataAccessor.insert(new Client({
      secret: 'SECRET',
      scope: ['test'],
      redirectUri,
    }));

    const response = await server.token(new Request({
      method: requestMethod.POST,
      headers: {
        Authorization: `Basic ${otherClient.base64()}`,
      },
      body: {
        grant_type: grantType.REFRESH_TOKEN,
        refresh_token: refreshToken,
        scope: ['test'],
      },
    }));

    expect(response.status).toEqual(401);
    expect(response.body.error).toEqual('unauthorized_client');
  });

  test('Generate Token Fail Because Client Not Same', async () => {
    const redirectUri = 'https://oauth2-core/auth';

    const clientDataAccessor = new ClientDataAccessor();
    const client = await clientDataAccessor.insert(new Client({
      secret: 'SECRET',
      scope: ['test'],
      redirectUri,
    }));

    const server = createServer(clientDataAccessor);
    const code = await getAuthorizationCode(server, client, 'test');

    // eslint-disable-next-line max-len
    const refreshToken = (await generateTokenByCode(server, client, code, redirectUri)).body.refresh_token;

    const response = await server.token(new Request({
      method: requestMethod.POST,
      headers: {
        Authorization: `Basic ${client.base64()}`,
      },
      body: {
        grant_type: grantType.REFRESH_TOKEN,
        refresh_token: refreshToken,
        scope: ['other'],
      },
    }));

    expect(response.status).toEqual(403);
    expect(response.body.error).toEqual('invalid_scope');
  });
});

/* eslint-enable no-undef */
