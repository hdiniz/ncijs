var yargs = require('yargs')
    .usage('Usage: node NciDecoder.js [options]\n       node NciDecoder.js [messages]')
    .help('h')
    .example('node NciDecoder.js [messages]', 'Parse (n) messages from arguments')
    .describe('f', 'Read from a file')
    .example('node NciDecoder.js -f file', 'Parse from log file')
    .describe('r', 'Regular expression')
    .implies('r', 'f')
    .example('node NciDecoder.js -f file -r ^nci:(.+)', 'Parse from log using regex match');
var argv = yargs.argv;

if (argv.f === undefined && argv.i === undefined) {
    yargs.showHelp();
}
    
var Nci = require('./js/nci.js');

if (argv.f !== undefined) {
    var fs = require('fs');
    var useRegex = false;
    var regex;
    if (argv.r !== undefined) {
        useRegex = true;
        regex = new RegExp(argv.r);
    }
    var stream = fs.createReadStream(argv.f);
    var stdOutBuff = '';
    stream.on('data', function (data) {
        var lines = data.toString().split(/\n|\r\n/);
        
        var lastElem = lines.pop();
        
        if (stdOutBuff != '') {
            lines[0] = stdOutBuff + lines[0];
        }
        
        if (lastElem != null && /\n|\r\n/.test(lastElem)) {
            stdOutBuff = lastElem;
        } else {
            stdOutBuff = '';
        }
        
        for (var l in lines) {
            if (useRegex) {
                var result;
                if ((result = regex.exec(lines[l])) !== null) {
                    console.log(Nci.decode(result[1]).toString());
                }
            } else {
                console.log(Nci.decode(lines[l]).toString());
            }
        }
    });
} else {
    var nciMessages = process.argv.splice(2);
    for (var i in nciMessages) {
        var message = nciMessages[i];
        console.log(Nci.decode(message).toString());
    }
}
