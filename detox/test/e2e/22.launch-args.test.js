const _ = require('lodash');

// Note: Android-only as, according to Leo, on iOS there's no added value here compared to
// existing tests that check deep-link URLs. Combined with the fact that we do not yet
// support complex args on iOS -- no point in testing it out.
describe(':android: Launch arguments', () => {
  beforeAll(async () => {
    await device.selectApp('exampleWithArgs');
    await device.launchApp();
  });

  async function assertLaunchArg(key, expectedValue) {
    await expect(element(by.id(`launchArg-${key}.name`))).toBeVisible();
    await expect(element(by.id(`launchArg-${key}.value`))).toHaveText(expectedValue);
  }

  async function assertNoLaunchArg(launchArgKey) {
    await expect(element(by.id(`launchArg-${launchArgKey}.name`))).not.toBeVisible();
  }

  function assertPreconfiguredValue(expectedInitArgs) {
    const initArgs = device.appLaunchArgs.get();
    if (!_.isEqual(initArgs, expectedInitArgs)) {
      throw new Error(`Precondition failure: Preconfigured launch arguments (in detox.config.js) do not match the expected value.\nExpected: ${JSON.stringify(expectedInitArgs)}\nReceived: ${JSON.stringify(initArgs)}`);
    }
  }

  it('should handle primitive args when used on-site', async () => {
    const launchArgs = {
      hello: 'world',
      seekthe: true,
      heisthe: 1,
    };

    await device.launchApp({newInstance: true, launchArgs});

    await element(by.text('Launch Args')).tap();
    await assertLaunchArg('hello', 'world');
    await assertLaunchArg('seekthe', 'true');
    await assertLaunchArg('heisthe', '1');
  });

  it('should handle complex args when used on-site', async () => {
    const launchArgs = {
      complex: {
        bull: ['s', 'h', 1, 't'],
        and: {
          then: 'so, me',
        }
      },
      complexlist: ['arguments', 'https://haxorhost:1337'],
    };

    await device.launchApp({newInstance: true, launchArgs});
    await element(by.text('Launch Args')).tap();

    await assertLaunchArg('complex', JSON.stringify(launchArgs.complex));
    await assertLaunchArg('complexlist', JSON.stringify(launchArgs.complexlist));
  });

  it('should allow for arguments modification', async () => {
    const expectedInitArgs = { app: 'le', goo: 'gle?', micro: 'soft' };
    assertPreconfiguredValue(expectedInitArgs);

    device.appLaunchArgs.modify({
      app: undefined, // delete
      goo: 'gle!', // modify
      ama: 'zon', // add
    });

    await device.launchApp({ newInstance: true });
    await element(by.text('Launch Args')).tap();

    await assertLaunchArg('goo', 'gle!');
    await assertLaunchArg('ama', 'zon');
    await assertLaunchArg('micro', 'soft');
    await assertNoLaunchArg('app');
  });

  it('should allow for on-site arguments to take precedence', async () => {
    const launchArgs = {
      anArg: 'aValue!',
    };

    device.appLaunchArgs.reset();
    device.appLaunchArgs.modify({
      anArg: 'aValue?',
    });

    await device.launchApp({ newInstance: true, launchArgs });
    await element(by.text('Launch Args')).tap();
    await assertLaunchArg('anArg', 'aValue!');
  });

  // Ref: https://developer.android.com/studio/test/command-line#AMOptionsSyntax
  it('should not pass android instrumentation args through', async () => {
    const launchArgs = {
      hello: 'world',
      debug: false,
      log: false,
      size: 'large',
    };

    await device.launchApp({newInstance: true, launchArgs});

    await element(by.text('Launch Args')).tap();
    await assertLaunchArg('hello', 'world');
    await assertNoLaunchArg('debug');
    await assertNoLaunchArg('log');
    await assertNoLaunchArg('size');
  });
});
