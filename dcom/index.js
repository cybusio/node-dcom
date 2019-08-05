// @ts-check
const ComServer = require('./core/comserver');
const Session = require('./core/session');
const CallBuilder = require('./core/callbuilder');
const Struct = require('./core/struct');
const ComString = require('./core/string');
const ComValue = require('./core/comvalue');
const Flags = require('./core/flags');
const Pointer = require('./core/pointer');
const Types = require('./core/types');
const Variant = require('./core/variant');
const ComArray = require('./core/comarray');

module.exports = {
    ComServer,
    Session,
    CallBuilder,
    Struct,
    ComString,
    ComValue,
    Flags,
    Pointer,
    Types,
    Variant,
    ComArray
};