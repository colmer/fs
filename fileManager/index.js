const fs = require('fs');
const url = require('url');
const path = require('path');

function sendFile(reqUrl, res, rootPath) {
  let filePath = url.parse(reqUrl).pathname;

  try {
    filePath = decodeURIComponent(filePath);
  } catch(e) {
    res.statusCode = 400;
    res.end("Bad request");
    return
  }

  if (~filePath.indexOf('\0')) {
    res.statusCode = 400;
    res.end("Bad request");
    return;
  }

  filePath = path.normalize(path.join(rootPath, filePath));

  if (filePath.indexOf(rootPath) != 0) {
    res.statusCode = 404;
    res.end("File not found");
    return;
  }

  fs.access(filePath, fs.constants.R_OK, (err) => {
    if (err) {
      console.log(err);
      res.statusCode = 404;
      res.end("File not found");
      return;
    }
  });

  sendCheckedFile(filePath, res)
}

function sendCheckedFile(filePath, res) {
  let file = new fs.ReadStream(filePath);

  file.pipe(res);

  file.on('error', () => {
    res.statusCode = 500;
    res.end("server Error");
  });

  res.on('close', () => {
    file.destroy();
  });
}

function uploadFile(req, res, rootPath) {
  let filePath = path.join(rootPath, 'message.txt');

  fs.open(filePath, 'wx', (err) => {
    if (err) {
      if (err.code === "EEXIST") {
        res.statusCode = 409;
        res.end("File already exist!");
        return;
      } else {
        throw err;
      }
    }

    createFile(req, res, filePath)
  });

}

function deleteFile(req, res, rootPath) {
  let filePath = path.join(rootPath, 'message.txt');

  fs.unlink(filePath, (err) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.statusCode = 404;
        res.end("File not found!");
        return;
      }
    }
    res.end('Deleted');
  });
}

function createFile(req, res, filePath) {
  let file = new fs.WriteStream(filePath);

  req.on('data', (chunk) => {
    file.write(chunk);
    console.log('Chank');
  }).on('end', () => {
    file.end();
  });

  res.end();
}

module.exports = {
  sendFile: sendFile,
  uploadFile: uploadFile,
  deleteFile: deleteFile
};
