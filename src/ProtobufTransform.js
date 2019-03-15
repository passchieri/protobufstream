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
    }
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
    }
    encode(object) {
        debug("encode");
        if (this.options.verify) {
            var err = this.messageClass.verify(object);
            if (err) throw new Error(err);
        }
        var msg = this.messageClass.fromObject(object);
        const buf = this.messageClass.encode(msg).finish();
        return buf;
    }

    decode(buf) {
        debug("decode");
        var msg = this.messageClass.decode(buf);
        var object = this.messageClass.toObject(msg, this.decodeOptions);
        return object;
    }
    _transform(chunk, enc, cb) {
        try {
            debug("_transform");
            var res = (this.dir ? this.encode(chunk) : this.decode(chunk));
            this.push(res);
            cb();
        } catch (err) {
            debug(`_transform error ${err}`)
            cb(err);
        }
    }
}

module.exports = function (options) {
    return new ProtobufTransform(options)
}