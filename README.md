protobufstream
======

Node.js stream for protobuf object encoding and decoding.

When a new Protobufstream object is created, the following options are available:
 * verify: verify the incoming object before encoding
 * protoFile: filename and location of the protobuf type definitions
 * messageType: name of the message type that will be encoded and decoded
 * decodeOptions: options passed to the toObject class when decoding
 * direction: encode or decode, depending on the direction

Installation
------------

Install with npm

```bash
$ npm install protobufstream
```

Usage example
-------------

```javascript
var decoder = require('protobufstream').createDecoder({
    protoFile: "./path/to/proto.file",
    messageType: "message.type.in.proto.file"
});
var stream new SomeInputStreamOfProtobufMessages()
var s=stream.pipe(decoder);
s.on('data',(data)=> {
    console.log("This is the decoded protobuf object",data);
})
```

License
-------
(ISC)

Copyright (c) 2019,  &lt;Igor Passchier&gt;

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
