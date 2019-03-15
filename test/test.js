var { should, expect } = require('chai');
should = should();
const ProtobufCodec = require('../src/ProtobufCodec');
var { Readable } = require('stream');

var msg = {
    type: "TYPE",
    key: "key",
    timestamp: Date.now(),
    data: Buffer.from("This can be any content")
}

describe('ProtobufCodec', () => {
    function callConstructor(options) {
        return new ProtobufCodec(options);
    }
    it('should throw an error on construction withouth correct options', () => {
        expect(() => {
            new ProtobufCodec({})
        }).to.throw(/options.protoFile/);
        expect(() => {
            new ProtobufCodec({ protoFile: "./test/binlog.proto" })
        }).to.throw(/options.messageType/);

    })
    it('encode and decode a sample binlog message', () => {
        var codec = new ProtobufCodec({
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

    var decoder = require('../src/ProtobufCodec')({
        protoFile: "./test/binlog.proto",
        messageType: "binlog.BinLog",
        direction: "decode"
    });

    it('encode message via transform', (done) => {
        var s = new Readable({
            objectMode: true,
            read: function () {
                this.push(msg);
                this.push(null);
            }
        });
        var encoder = require('../src/ProtobufCodec')({
            protoFile: "./test/binlog.proto",
            messageType: "binlog.BinLog",
            direction: "encode"
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

    it('decode message via transform', (done) => {
        var decoder = require('../src/ProtobufCodec')({
            protoFile: "./test/binlog.proto",
            messageType: "binlog.BinLog",
            direction: "decode"
        });

        var buf = decoder.encode(msg);
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
})

