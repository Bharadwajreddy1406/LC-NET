const assert = require('assert');
const http = require('http');

describe('Server', () => {
    let server;

    before(done => {
        server = http.createServer((req, res) => {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('Hello World\n');
        }).listen(3000, done);
    });

    after(done => {
        server.close(done);
    });

    it('should respond with Hello World', done => {
        http.get('http://localhost:3000', res => {
            assert.strictEqual(res.statusCode, 200);
            done();
        });
    });
});