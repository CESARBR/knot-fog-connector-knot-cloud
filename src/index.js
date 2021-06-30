import Client from '@cesarbr/knot-cloud-sdk-js-amqp';
import Connector from './Connector';

export default class Main extends Connector {
  constructor(settings) {
    const client = new Client(settings);
    super(client, settings.amqp.token);
  }
}
