import http from 'http';

const getRequest = (url) => {
  return new Promise((resolve, reject) => {
    const { hostname, port, pathname } = new URL(url);

    const options = {
      hostname,
      port,
      path: pathname,
      method: 'GET',
    };

    let data = '';

    const req = http.request(options, (res) => {
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', (e) => {
      reject(e.message);
    });

    req.end();
  });
};

export {getRequest }