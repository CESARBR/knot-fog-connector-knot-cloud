import Client from '@cesarbr/knot-cloud-websocket';

function promisify(client, event, method, ...args) {
  return new Promise((resolve, reject) => {
    method(...args);
    client.once(event, ret => resolve(ret));
    client.once('error', (err) => {
      reject(new Error(err));
    });
  });
}

class Connector {
  constructor(settings) {
    this.client = new Client({
      hostname: settings.hostname,
      port: settings.port,
      uuid: settings.uuid,
      token: settings.token,
    });
  }

  isConnected() {
    const { OPEN } = Object.getPrototypeOf(this.client.socket);
    return this.client.socket.readyState === OPEN;
  }

  async start() {
    return promisify(this.client, 'ready', this.client.connect.bind(this.client));
  }

  async addDevice(device) { // eslint-disable-line no-empty-function, no-unused-vars
  }

  async removeDevice(id) { // eslint-disable-line no-empty-function, no-unused-vars
  }

  async listDevices() {
    if (this.isConnected()) {
      return promisify(this.client, 'devices', this.client.getDevices.bind(this.client), { type: 'thing' });
    }
    throw Error('Connection not established.');
  }

  // Device (fog) to cloud

  async publishData(id, dataList) { // eslint-disable-line no-empty-function, no-unused-vars
  }

  async updateSchema(id, schemaList) { // eslint-disable-line no-empty-function, no-unused-vars
  }

  async updateProperties(id, properties) { // eslint-disable-line no-empty-function, no-unused-vars
  }

  // Cloud to device (fog)

  // cb(event) where event is { id, config: [{}] }
  async onConfigUpdated(cb) { // eslint-disable-line no-empty-function, no-unused-vars
  }

  // cb(event) where event is { id, properties: {} }
  async onPropertiesUpdated(cb) { // eslint-disable-line no-empty-function, no-unused-vars
  }

  // cb(event) where event is { id, sensorId }
  async onDataRequested(cb) { // eslint-disable-line no-empty-function, no-unused-vars
  }

  // cb(event) where event is { id, sensorId, data }
  async onDataUpdated(cb) { // eslint-disable-line no-empty-function, no-unused-vars
  }
}

export { Connector }; // eslint-disable-line import/prefer-default-export
