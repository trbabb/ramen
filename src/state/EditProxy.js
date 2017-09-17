// EditProxy tattles on everything that's done to the node graph.
// This is sent back to the server, so it can keep the AST in sync.

export class EditProxy {
    
    constructor(app) {
        this.app       = app
        this.connected = false
        this.queued = []
        // could this be simplified with introspection?
        this.callback_args = {
            addNode    : ["node_id", "def_id", "parent_id", "value"],
            removeNode : ["node_id"],
            addDef     : ["def_id", "name", "node_type", "type_sig", "placeable"],
            removeDef  : ["def_id"],
            addLink    : ["link_id", "link"],
            removeLink : ["link_id"],
            addPort    : ["def_id", "port_id", "type_id", "is_arg"],
            removePort : ["def_id", "port_id", "is_arg"],
            addType    : ["type_id", "type_info"],
            removeType : ["type_id"],
            setLiteral : ["node_id", "value"],
        }
        
        new Promise((resolve, reject) => {
            var ws_prcol   = (window.location.protocol === "https:") ? ('wss://') : ('ws://')
            var ws_address = ws_prcol + window.location.host + "/socket"
            this.socket = new WebSocket(ws_address)
            this.socket.onopen    = (open)    => { resolve() }
            this.socket.onmessage = this.routeMessage
            this.socket.onclose   = (close)   => { reject(close) }
            this.socket.onerror   = (error)   => { reject(error) }
        }).then(() => {
            this.connected = true
            this.app.setConnected(true)
            this.flush_queue()
        }).catch((reason) => {
            this.connected = false
            this.app.setConnected(false)
            console.log(reason)
        })
    }
    
    
    routeMessage = (message) => {
        var json = JSON.parse(message.data)
        var data = json.data
        if (json.route === "graph_edit") {
            this.on_network_graph_edit(data)
        } else if (json.route === "message") {
            this.on_network_message(data)
        }
    }
    
    
    // take an action + object holding a keyword mapping of properties,
    // and use the action template to figure out the order of the args.
    unpackArgs(act, data) {
        var tp   = this.callback_args[act]
        var args = []
        for (var a of tp) {
            args.push(data[a])
        }
        return args
    }
    
    
    // apply an add/remove event to the given nodegraph
    applyEvent(ng, evt) {
        // the name of the function to call
        // (e.g. addNode or removeLink):
        var act  = evt.action + evt.type[0].toUpperCase() + evt.type.substr(1)
        var fn   = ng[act] // get the thing with that name
        var args = this.unpackArgs(act, evt.details)
        var new_ng = fn.apply(ng, args) // call it
        
        return new_ng
    }
    
    
    on_network_message = (data) => {
        this.app.appendMessage(data.text + "\n", data.style)
    }
    
    
    // handle and execute an edit action arriving from the server.
    on_network_graph_edit = (data) => {
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
        console.log("send", a)
        if (this.connected) {
            this.socket.send(JSON.stringify(a))
        } else {
            this.queued.push(a)
        }
    }
    
    
    // Empty out all the requested events that haven't been sent yet
    // and send them all to the server.
    flush_queue() {
        if (this.connected) {
            while (this.queued.length > 0) {
                var act = this.queued.pop()
                this.socket.send(JSON.stringify(act))
            }
        }
    }
    
}