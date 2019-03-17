const debug = require('debug')('protobufstream')
const { Transform } = require('stream');

const defaultOptions = {
    direction: 'encode',
    verify: true,
    protoFile: undefined,
    messageType: undefined,
    decodeOptions: {
        enums: String,  // enums as string names
        longs: Number,  // longs as strings (requires long.js)
        // bytes: String,  // bytes as base64 encoded strings
        defaults: true, // includes default values
        arrays: true,   // populates empty arrays (repeated fields) even if defaults=false
        objects: true,  // populates empty objects (map fields) even if defaults=false
        oneofs: true    // includes virtual oneof fields set to the present field's name
    },
    forStream: true
}

/**
 * Coder decoder class for protobuf messages.
 * 
 * Options:
 * verify: verify the incoming object before encoding
 * protoFile: filename and location of the protobuf type definitions
 * messageType: name of the message type that will be encoded and decoded
 * decodeOptions: options passed to the toObject class when decoding
 * direction: encode or decode, depending on the direction
 * forStream: encode and decode delimited messages, i.e. preceeded with its length (default: yes)
 * 
 */
class ProtobufTransform extends Transform {
    constructor(options) {
        if (!options) options = {};
        var opts = {};
        Object.assign(opts, defaultOptions);
        options = Object.assign(opts, options);
        // var dir = options.direction == 'encode';
        options.writableObjectMode = (options.direction == 'encode');
        options.readableObjectMode = !options.writableObjectMode;
        super(options);
        this.options = options;
        this.dir = this.options.writableObjectMode;
        if (this.options.protoFile === undefined) throw new Error('No protofile defined in options (options.protoFile)');
        if (this.options.messageType === undefined) throw new Error('No Protobuf message type defined (options.messageType)')
        const root = require('protobufjs').loadSync(this.options.protoFile);
        this.messageClass = root.lookupType(this.options.messageType);
        this.buffer = new Buffer(0);
    }
    encode(object) {
        debug("encode");
        if (this.options.verify) {
            var err = this.messageClass.verify(object);
            if (err) throw new Error(err);
        }
        var msg = this.messageClass.fromObject(object);
        const buf = (this.options.forStream ?
            this.messageClass.encodeDelimited(msg).finish()
            : this.messageClass.encode(msg).finish());
        return buf;
    }

    decode(buf) {
        debug("decode");
        var msg = (this.options.forStream ? this.messageClass.decodeDelimited(buf) : this.messageClass.decode(buf));
        var object = this.messageClass.toObject(msg, this.decodeOptions);
        return object;
    }
    _transform(chunk, enc, cb) {
        if (this.dir) {
            this._transformencode(chunk,enc,cb);
        } else {
            this._transformdecode(chunk,enc,cb);
        }
    }
    _transformencode(chunk,enc,cb) {
        try {
            debug("_transformencode");
            var res = this.encode(chunk);
            this.push(res);
            cb();
        } catch (err) {
            debug(`_transformencode error ${err}`)
            cb(err);
        }
    }
    _transformdecode(chunk, enc, cb) {
        try {
            debug("_transformdecode");

            this.buffer = Buffer.concat([this.buffer, chunk]);
            while (true) {
                var size = this._readLen(this.buffer);
                if (!size) break;
                if (this.buffer.length < size.len + size.skip) break;
                var msg = this.buffer.slice(0, size.skip + size.len);
                msg=this.decode(msg);
                this.push(msg);
                this.buffer = this.buffer.slice(size.skip + size.len);
            }
            cb();
        } catch (err) {
            debug(`transformdecode error ${err}`)
            cb(err);
        }
        //assume we start with a varint. A varint is encoded as bytes, using the first bit to denote last byte. 
        //the remaining are used for the value, least significant first

    }

    _readLen(chunk) {
        if (chunk.length < 1) return null;
        var len = 0;
        var i = 0;
        var byt = 255;
        while (byt > 128) {
            byt = chunk[i];
            var val = (byt >= 128 ? byt - 128 : byt);
            len += (val << (7 * i))
            i++;
            if (chunk.length <= i) return null;
        }
        return {
            len: len,
            skip: i
        }
    }
}

module.exports = function (options) {
    return new ProtobufTransform(options)
}