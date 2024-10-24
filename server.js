import APIServer from './APIServer.js';
import Routes from './routes.js';

Routes.register('GET', 'Bookmarks', 'list');

let server = new APIServer();
server.start();