# [2.0.1](https://github.com/CESARBR/knot-fog-connector-knot-cloud/compare/v2.0.0...v2.0.1)

### Bug Fixes

- Update dependency lodash to v4.17.13
- Update dependency mixin-deep to v1.3.2
- Update dependency set-value to v2.0.1
- Update dependency union-value to v1.0.1
- Update dependency eslint-utils to v1.4.3
- Add dependency eslint-visitor-keys at v1.1.0

# [2.0.0](https://github.com/CESARBR/knot-fog-connector-knot-cloud/compare/v1.1.0...v2.0.0)

### Features

- Implement authDevice method.
- Implement onDeviceUnregistered callback.

### Bug Fixes

- Avoid crashing the service when can't connect to a specific thing.

### Improvements

- Update the register method to return the device credentials.
- Add pull request template.
- Update knot-cloud-websocket to v1.1.3.

# [1.1.0](https://github.com/CESARBR/knot-fog-connector-knot-cloud/compare/v1.0.2...v1.1.0)

### Features

- Handle disconnection/reconnection.

### Bug Fixes

- Fix return event listeners.

## [1.0.2](https://github.com/CESARBR/knot-fog-connector-knot-cloud/compare/v1.0.1...v1.0.2)

### Bug Fixes

- Listen to commands right after a device is registered.

## [1.0.1](https://github.com/CESARBR/knot-fog-connector-knot-cloud/compare/v1.0.0...v1.0.1)

### Improvements

- Update knot-cloud-websocket to v1.0.1.

# [1.0.0](https://github.com/CESARBR/knot-fog-connector-knot-cloud/compare/v0.1.0...v1.0.0)

### Bug Fixes

- Add `knot:` prefix to types.
- Fix device format returned by listDevice().

# [0.1.0](https://github.com/CESARBR/knot-fog-connector-knot-cloud/compare/ed582a3...v0.1.0)

### Features

- Operations: start(), listDevices(), addDevice(), removeDevice(), updateSchema(), onDataRequested(), onDataUpdated().
