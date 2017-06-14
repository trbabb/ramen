class CallSig {
    constructor(type_ids, n_sinks) {
        this.type_ids = type_ids;
        this.n_sinks  = n_sinks;
    }
}


class Node {
    constructor(call_sig, name) {
        this.call_sig    = call_sig;
        this.name        = name;
        this.links       = []; // each element is a Set.
    }
}


class Port {
    constructor(node_id, port_id) {
        this.node_id = node_id;
        this.port_id = port_id;
    }
}


class Link {
    constructor(src_port, sink_port) {
        this.src  = src_port;
        this.sink = sink_port;
    }
}

class Pane {
    constructor() {
        this.links = {}; // {link_id : link}
        this.nodes = {}; // {node_id : node}
    }
}