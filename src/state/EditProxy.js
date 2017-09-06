// EditProxy tattles on everything that's done to the node graph.
// This is sent back to the server, so it can keep the AST in sync.

export class EditProxy {
    
    constructor(app) {
        this.app       = app
        this.connected = false
        this.queued = []
        this.actionTemplates = {
            addNode    : {action : "add",    type : "node",    args : ["node_id", "def_id", "parent_id", "value"]},
            removeNode : {action : "remove", type : "node",    args : ["node_id"]},
            addDef     : {action : "add",    type : "def",     args : ["def_id", "name", "node_type", "type_sig", "placeable"]},
            removeDef  : {action : "remove", type : "def",     args : ["def_id"]},
            addLink    : {action : "add",    type : "link",    args : ["link_id", "link"]},
            removeLink : {action : "remove", type : "link",    args : ["link_id"]},
            addPort    : {action : "add",    type : "port",    args : ["def_id", "port_id", "type_id", "is_arg"]},
            removePort : {action : "remove", type : "port",    args : ["def_id", "port_id", "is_arg"]},
            addType    : {action : "add",    type : "type",    args : ["type_id", "type_info"]},
            removeType : {action : "remove", type : "type",    args : ["type_id"]},
            setLiteral : {action : "set",    type : "literal", args : ["node_id", "value"]},
        }
        
        new Promise((resolve, reject) => {
            var ws_prcol = (window.location.protocol === "https:") ? ('wss://') : ('ws://')
            this.socket = new WebSocket(ws_prcol + window.location.host + "/socket")
            this.socket.onopen    = (open)    => { resolve() }
            this.socket.onmessage = this.routeMessage
            this.socket.onclose   = (close)   => { reject() }
            this.socket.onerror   = (error)   => { reject() }
        }).then(() => {
            this.connected = true
            this.app.setConnected(true)
            this.flushQueue()
        }).catch(() => {
            this.connected = false
            this.app.setConnected(false)
        })
    }
    
    
    routeMessage = (message) => {
        var json  = JSON.parse(message.data)
        var route = json.route
        var data  = json.data
        if (route === "graph_edit") {
            this.onNetworkGraphEdit(data)
        } else if (route === "message") {
            this.onNetworkMessage(data)
        }
    }
    
    
    // take an action + object holding a keyword mapping of properties,
    // and use the action template to figure out the order of the args.
    unpackArgs(act, data) {
        var tp   = this.actionTemplates[act]
        var args = []
        for (var a of tp.args) {
            args.push(data[a])
        }
        return args
    }
    
    
    // apply an add/remove event to the given nodegraph
    applyEvent(ng, evt) {
        var act  = {node    : "Node",
                    def     : "Def",
                    link    : "Link",
                    port    : "Port",
                    type    : "Type",
                    literal : "Literal"}[evt.type]
        // the name of the function to call:
        act      = evt.action + act
        var fn   = ng[act] // get the thing with that name
        var args = this.unpackArgs(act, evt.details)
        var new_ng = fn.apply(ng, args) // call it
        
        return new_ng
    }
    
    
    onNetworkMessage = (data) => {
        this.app.appendMessage(data.text + "\n")
    }
    
    
    // handle and execute an edit action arriving from the server.
    onNetworkGraphEdit = (data) => {
        console.log(data)
        this.app.setState(prevState => {
            var ng = this.applyEvent(prevState.ng, data)
            if (ng === prevState.ng) {
                return {}
            } else {
                return { ng : ng }
            }
        })
    }
    
    
    // Request that an event be sent back to the server.
    // If the server is not connected, remember it for later.
    action(act, type, args) {
        let a = {action : act, type : type, details : args}
        console.log("    EMIT: ", a)
        if (this.connected) {
            this.socket.send(JSON.stringify(a))
        } else {
            this.queued.push(a)
        }
    }
    
    
    // Empty out all the requested events that haven't been sent yet
    // and send them all to the server.
    flushQueue() {
        if (this.connected) {
            while (this.queued.length > 0) {
                var act = this.queued.pop()
                this.socket.send(JSON.stringify(act))
            }
        }
    }
    
}