const http = require('http');
const url = require('url');
const path = require('path');
const config = require('config');
const fs = require('fs');
const mime = require('mime');


module.exports = http.createServer((req, res) => {

  let pathname = decodeURIComponent(url.parse(req.url).pathname);
  let filename = pathname.slice(1);

  if (~pathname.indexOf('\0') || ~filename.indexOf('/')) {
    res.statusCode = 400;
    res.end("Bad request");
    return;
  }
  // Normalize path
  pathname = path.normalize(pathname);

  if (req.method === 'GET') {
    if (pathname === '/') {
      sendFile(config.get('publicRoot') + '/index.html', res);
    } else {
      let filepath = path.join(config.get('filesRoot'), filename);
      sendFile(filepath, res);
    }
  }

  if (req.method === 'POST') {
    if (!filename) {
      res.writeHead(400);
      res.end('Can\'t do this!');
      return;
    }
    receiveFile(path.join(config.get('filesRoot'), filename), req, res);
  }

  if (req.method === 'DELETE') {
    if (!filename) {
      res.writeHead(400);
      res.end('Can\'t do this!');
      return;
    }
    deleteFile(path.join(config.get('filesRoot'), filename), req, res);
  }
});

function deleteFile(filepath, req, res) {
  fs.unlink(filepath, err => {

    if (err && err.code === 'ENOENT') {
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    res.end('ok');
  })
}

function receiveFile(filepath, req, res) {
  if (req.headers['content-length'] > config.get('limitFileSize')) {
    res.statusCode = 413;
    res.end('file is too big');
    return;
  }

  let size = 0;

  let writeStream = new fs.WriteStream(filepath, {flags: 'wx'});

  req
    .on('data', chunk => {
      size += chunk.length;

      if (size > config.get('limitFileSize')) {
        res.writeHead(413, {'Connection': 'close'});
        res.end('File is too big');

        writeStream.destroy();
        fs.unlink(filepath, () => {

        });
      }
    })
    .on('close', () => {
      writeStream.destroy();
      fs.unlink(filepath, () => {

      })
    })
    .pipe(writeStream);

  writeStream
    .on('error', err => {
      if (err.code === 'EEXIST') {
        res.statusCode = 409;
        res.end('File exists');
      } else {
        console.error(err);

        if (!res.headersSent) {
          res.writeHead(500, {'Connection': 'close'});

          res.write('Server error');
        }

        res.end();
        fs.unlink(filepath, () => {})
      }
    })
    .on('close', () => {
      res.end('OK');
    })
}

function sendFile(filepath, res) {
  let fileStream = new fs.ReadStream(filepath);
  fileStream.pipe(res);

  fileStream.on('error', err => {
    if (err.code === 'ENOENT' ) {
      res.statusCode = 404;
      res.end('Not found');
    } else {
      console.err(err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('Server error');
      } else {
        res.end();
      }
    }
  })
  .on('open', () => {
    res.setHeader('Content-type', mime.lookup(filepath));
  });

  res
    .on('close', () => {
      fileStream.destroy();
    });
}
