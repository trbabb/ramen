import * as _ from 'lodash'

// implements a function definition.

export var NODE_TYPE = {
    NODE_LITERAL  : "literal",
    NODE_BUILTIN  : "builtin",
    NODE_CALL     : "fncall",
    NODE_FUNCTION : "function",
    NODE_LOOP     : "loop",
    NODE_BRANCH   : "branch",
    NODE_ENTRY    : "entry",
    NODE_EXIT     : "exit",
    NODE_EXPORT   : "export",
}

export class Def {
    
    constructor(name, node_type, type_sig) {
        this.name      = name
        this.node_type = node_type
        this.type_sig  = type_sig
    }
    
    addPort(port_id, type_id, is_sink) {
        var d   = _.clone(this)
        d.type_sig = d.type_sig.addPort(port_id, type_id, is_sink)
        return d
    }


    removePort(port_id) {
        var d = _.clone(this)
        d.type_sig = d.type_sig.removePort(port_id)
        return d
    }
    
    
    hasBody() {
        return (
            this.node_type === NODE_TYPE.NODE_LOOP ||
            this.node_type === NODE_TYPE.NODE_FUNCTION ||
            this.node_type === NODE_TYPE.NODE_BRANCH  // unsure about this one :\ 
        )
    }
    
}
