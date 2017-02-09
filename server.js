const {Server} = require('http');
const fileManager = require('fileManager');

const ROOT = `${__dirname}/files`;

const server = new Server((req, res) => {
  if (req.url === '/upload') {
    if (req.method === 'GET') {
      fileManager.sendFile('/upload.html', res, ROOT);
    } else if (req.method === 'DELETE') {
      fileManager.deleteFile(req, res, ROOT);
    } else {
      fileManager.uploadFile(req, res, ROOT);
    }
  } else {
    fileManager.sendFile(req.url, res, ROOT);
  }
});

server.listen(3000);
