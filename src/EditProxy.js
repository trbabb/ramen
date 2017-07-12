import io from 'socket.io-client'

// EditManager tattles on everything that's done to the node graph.
// This is sent back to the server, so it can keep the AST in sync.

// todo: the "action" key is redundant with the message key.

export class EditProxy {
    
    constructor(app) {
        this.app       = app
        this.connected = false
        var prms = new Promise((resolve, reject) => {
            this.socket = io()
            this.socket.on('connect', (socket) => {resolve()})
            this.socket.on('disconnect',    () => {reject()})
            this.socket.on('error',         () => {reject()})
            this.socket.on('add',           this.processAction)
            this.socket.on('remove',        this.processAction)
        }).then(() => {
            this.connected = true
            this.app.setConnected(true)
            this.flushQueue()
        }).catch(() => {
            this.connected = false
            this.app.setConnected(false)
        })
        this.queued = []
        
        this.actionTemplates = {
            addNode    : {action : "add",    type : "node", args : ["def_id", "parent_id", "id"]},
            removeNode : {action : "remove", type : "node", args : ["node_id"]},
            addDef     : {action : "add",    type : "def",  args : ["name", "node_type", "sig"]}
            removeDef  : {action : "remove", type : "def",  args : ["def_id"]}
            addLink    : {action : "add",    type : "link", args : ["port_0", "port_1", "id"]},
            removeLink : {action : "remove", type : "link", args : ["link_id"]},
            addPort    : {action : "add",    type : "port", args : ["node_id", "type_id", "is_sink", "id"]},
            removePort : {action : "remove", type : "port", args : ["node_id", "port_id"]},
        }
    }
    
    
    extractArgs(data, act) {
        var tp   = this.actionTemplates[act]
        var args = []
        for (var a of tp.args) {
            args.push(data[a])
        }
        return args
    }
    
    
    processAction = (data) => {
        this.app.setState(prevState => {
            var act  = {node : "Node",
                        def  : "Def",
                        link : "Link",
                        port : "Port"}[data.type]
            act = data.action + act
            var fn      = prevState.ng[act]
            var args    = this.extractArgs(data, act)
            var {ng,id} = fn.apply(prevState.ng, args)
            if (ng === prevState.ng) {
                return {}
            } else {
                return { ng : ng }
            }
        })
    }
    
    
    actionForCall(act, args, id=null) {
        var t = this.actionTemplates[act]
        var o = {action : t.action, type : t.type}
        var d = {}
        for (var i = 0; i < args.length; ++i) {
            var a = args[i]
            var argname = t.args[i]
            if (argname === "id" && (a === null || a === undefined)) {
                a = null
            }
            d[argname] = a
        }
        o.details = d
        return o
    }
    
    
    action(act, args) {
        this.enqueue(this.actionForCall(act,args))
        
        // disabled now that we are deferring all state updates to the server:
        
        // this.app.setState(prevState => {
        //     var f       = prevState.ng[act]
        //     var {ng,id} = f.apply(prevState.ng, args) // kwargs like python would make this all nicer :[
        //     if (ng === prevState.ng) {
        //         return {}
        //     } else {
        //         var evt = this.actionForCall(act, args, id)
        //         this.enqueue(evt)
        //         return {ng : ng}
        //     }
        // })
    }
    
    
    // Request that an event be sent back to the server.
    // If the server is not connected, remember it for later.
    enqueue(act) {
        if (this.connected) {
            this.socket.emit(act.action, act)
        } else {
            this.queued.push(act)
        }
    }
    
    
    // Empty out all the requested events that haven't been sent yet
    // and send them all to the server.
    flushQueue() {
        if (this.connected) {
            while (this.queued.length > 0) {
                var act = this.queued.pop()
                this.socket.emit(act.action, act)
            }
        }
    }
    
}