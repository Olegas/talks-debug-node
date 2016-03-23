var all = [];
require('http').createServer(function(req, res) {

   var url = require('url').parse(req.url);
   var query = (url.query || '').split('&');

   query = query.filter((itm) => !!itm).reduce(function(memo, itm) {
      itm = itm.split('=');
      memo[itm[0]] = itm[1];
      return memo;
   }, {});

   if (url.pathname == '/all') {
      
      function calcCRC(buffers) {
          return buffers.reduce((crc, buffer) => {
             for(var pair of buffer.entries()) {
                crc ^= pair[1];
             }
             return crc;
          }, 0);
      }

      var content = all.map((itm) => `${itm.req.url}: ${calcCRC(itm.buffers)}`)
      res.writeHead(200, { 'Content-type': 'text/plain' });
      res.end(content.join('\n'));
      return;
   }

   if (query.host) {

      require('http').request({
         host: query.host,
         method: 'GET',
         path: '/'
      }, function(res2) {

          var buffers = [];

          res.writeHead(200, { 'Content-type': 'text/plain' });
          
          res2.on('data', function calcCRC(buffer) {
             buffers.push(buffer);
          });

          res2.on('end', function() {
          
             res.write(`Status: ${res2.statusCode}\n`);
             res.write(`Content length: ${res2.headers['content-length']}\n`);
             res.end();

             all.push({
               res: res2,
               req: res2.req,
               buffers
             });
             
          });

      }).on('error', function(e) {
      
          res.writeHead(500, { 'Content-type': 'text/plain' });
          res.end(`Error: ${e}`);
      }).end();


   } else {
      res.writeHead(401, { 'Content-type': 'text/plain' });
      res.end('Incorrect query');
   } 

}).listen(8081);
