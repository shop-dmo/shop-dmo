'use strict';
// Keep the production build and behavioral regression on the same conservative options.
const minifyOptions=()=>({ecma:2020,compress:{defaults:false,drop_debugger:true},mangle:{toplevel:true},format:{comments:false},sourceMap:false});
const canonicalBytes=(file,buffer)=>/\.png$/i.test(file)?buffer:Buffer.from(buffer.toString('utf8').replace(/\r\n/g,'\n'));
module.exports={minifyOptions,canonicalBytes};
