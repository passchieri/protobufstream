var { should, expect } = require('chai');
should = should();
const ProtobufTransform = require('../src/ProtobufTransform');
var { Readable } = require('stream');

var msg = {
    type: "TYPE",
    key: "key",
    timestamp: Date.now(),
    data: Buffer.from("This can be any contentThis can be any contentThis can be any contentThis can be any contentThis can be any contentThis can be any contentThis can be any contentThis can be any contentThis can be any contentThis can be any contentThis can be any contentThis can be any contentThis can be any contentThis can be any contentThis can be any contentThis can be any contentThis can be any contentThis can be any contentThis can be any contentThis can be any contentThis can be any contentThis can be any contentThis can be any contentThis can be any contentThis can be any contentThis can be any contentThis can be any content")
}
var msgSecond = {
    type: "OTHER",
    key: "other.key",
    timestamp: Date.now(),
    data: Buffer.from("Second message")
}

describe('ProtobufTransform', () => {
    function callConstructor(options) {
        return new ProtobufTransform(options);
    }
    it('throw an error on construction withouth correct options', () => {
        expect(() => {
            new ProtobufTransform({})
        }).to.throw(/options.protoFile/);
        expect(() => {
            new ProtobufTransform({ protoFile: "./test/binlog.proto" })
        }).to.throw(/options.messageType/);

    })
    it('encode and decode a sample binlog message', () => {
        var codec = new ProtobufTransform({
            protoFile: "./test/binlog.proto",
            messageType: "binlog.BinLog",
            direction: "decode"
        });
        var buf = codec.encode(msg);
        var msg2 = codec.decode(buf);
        // buf.should.be.a('Buffer');
        msg2.should.be.a('object');
        msg.should.have.property('type').equal(msg.type);
        msg.should.have.property('key').equal(msg.key);
        msg.should.have.property('timestamp').equal(msg.timestamp);
        msg.should.have.property('data').equal(msg.data);
        msg.should.have.property('data').be.instanceOf(Buffer);
        buf.should.be.instanceOf(Buffer);
    })

    var decoder = require('../src/ProtobufTransform').createDecoder({
        protoFile: "./test/binlog.proto",
        messageType: "binlog.BinLog"
    });

    it('encode message via transform', (done) => {
        var s = new Readable({
            objectMode: true,
            read: function () {
                this.push(msg);
                this.push(null);
            }
        });
        var encoder = require('../src/ProtobufTransform').createEncoder({
            protoFile: "./test/binlog.proto",
            messageType: "binlog.BinLog"
        });

        var sc = s.pipe(encoder)
        sc.on('data', data => {
            data.should.be.instanceOf(Buffer);
        });
        sc.on('finish', () => {
            done()
        });
        sc.on('error', (err) => {
            done(err)
        })
    })

    it('encode multiple messages via transform', (done) => {
        var s = new Readable({
            objectMode: true,
            read: function () {
                this.push(msg);
                this.push(msgSecond)
                this.push(null);
            }
        });
        var encoder = require('../src/ProtobufTransform').createEncoder({
            protoFile: "./test/binlog.proto",
            messageType: "binlog.BinLog"
        });

        var count = 0;
        var sc = s.pipe(encoder)
        sc.on('data', data => {
            data.should.be.instanceOf(Buffer);
            count++;
        });
        sc.on('finish', () => {
            if (count != 2) done('Not 2 messages seen');
            done()
        });
        sc.on('error', (err) => {
            done(err)
        })
    })

    it('decode message via transform', (done) => {
        var decoder = require('../src/ProtobufTransform').createDecoder({
            protoFile: "./test/binlog.proto",
            messageType: "binlog.BinLog"
        });

        var buf = decoder.encode(msg, true);
        var s = new Readable({
            objectMode: true,
            read: function () {
                this.push(buf);
                this.push(null);
            }
        });

        var sc = s.pipe(decoder)
        sc.on('data', data => {
            data.should.be.a('object');
        });
        sc.on('finish', () => {
            done()
        });
        sc.on('error', (err) => {
            done(err)
        })
    })
    it('decode multiple messages via transform', (done) => {
        var decoder = require('../src/ProtobufTransform').createDecoder({
            protoFile: "./test/binlog.proto",
            messageType: "binlog.BinLog"
        });

        var buf = decoder.encode(msg, true);
        var s = new Readable({
            objectMode: true,
            read: function () {
                this.push(buf);
                this.push(buf);
                this.push(null);
            }
        });
        var count = 0;
        var sc = s.pipe(decoder)
        sc.on('data', data => {
            data.should.be.a('object');
            count++;
        });
        sc.on('finish', () => {
            if (count != 2) {
                done('Not 2 messages seen');
            } else {
                done()
            }
        });
        sc.on('error', (err) => {
            done(err)
        })
    })
    it('handle buffers with multiple messages', (done) => {
        var decoder = require('../src/ProtobufTransform').createDecoder({
            protoFile: "./test/binlog.proto",
            messageType: "binlog.BinLog"
        });

        var buf = decoder.encode(msg, true);
        var s = new Readable({
            objectMode: true,
            read: function () {
                var b = Buffer.concat([buf, buf]);
                this.push(b);
                this.push(null);
            }
        });
        var count = 0;
        var sc = s.pipe(decoder)
        sc.on('data', data => {
            data.should.be.a('object');
            count++;
        });
        sc.on('finish', () => {
            if (count != 2) {
                done('Not 2 messages seen')
            } else {
                done();
            }
        });
        sc.on('error', (err) => {
            done(err)
        })
    })
    it('handle buffers with partial messages', (done) => {
        var decoder = require('../src/ProtobufTransform').createDecoder({
            protoFile: "./test/binlog.proto",
            messageType: "binlog.BinLog"
        });

        var buf = decoder.encode(msg, true);
        var s = new Readable({
            objectMode: true,
            read: function () {
                var b = Buffer.concat([buf, buf]);
                this.push(b.slice(0, 10));
                this.push(b.slice(10))
                this.push(null);
            }
        });
        var count = 0;
        var sc = s.pipe(decoder)
        sc.on('data', data => {
            data.should.be.a('object');
            count++;
        });
        sc.on('finish', () => {
            if (count != 2) {
                done('Not 2 messages seen, but: ' + count)
            } else {
                done();
            }
        });
        sc.on('error', (err) => {
            done(err)
        })
    })
})

