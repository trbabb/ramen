import io              from 'socket.io-client'
import {NODE_TYPE}     from './Def'
import {TypeSignature} from './TypeSignature'  // todo: not needed after server handles entry/exits

// EditProxy tattles on everything that's done to the node graph.
// This is sent back to the server, so it can keep the AST in sync.

export class EditProxy {
    
    constructor(app) {
        this.app       = app
        this.connected = false
        var prms = new Promise((resolve, reject) => {
            this.socket = io()
            this.socket.on('connect', (socket) => {resolve()})
            this.socket.on('disconnect',    () => {reject()})
            this.socket.on('error',         () => {reject()})
            this.socket.on('graph_edit', this.processServerAction)
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
            addNode    : {action : "add",    type : "node", args : ["node_id", "def_id", "parent_id"]},
            removeNode : {action : "remove", type : "node", args : ["node_id"]},
            addDef     : {action : "add",    type : "def",  args : ["def_id", "name", "node_type", "type_sig"]},
            removeDef  : {action : "remove", type : "def",  args : ["def_id"]},
            addLink    : {action : "add",    type : "link", args : ["link_id", "port_0", "port_1"]},
            removeLink : {action : "remove", type : "link", args : ["link_id"]},
            addPort    : {action : "add",    type : "port", args : ["def_id", "port_id", "type_id", "is_sink"]},
            removePort : {action : "remove", type : "port", args : ["def_id", "port_id"]},
            addType    : {action : "add",    type : "type", args : ["type_id", "code"]},
            removeType : {action : "remove", type : "type", args : ["type_id"]}
        } 
        this.max_id = {
            node : 0,
            link : 0,
            def  : 0,
            port : 0,
        }
    }
    
    
    // generate a new, unique id for an object of the given type
    // (in "node", "link", "def", or "port").
    generateID(objtype) {
        var id = this.max_id[objtype]
        this.max_id[objtype] += 1
        return id
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
    applyEvent(ng, evt, do_enqueue=true) {
        var act  = {node : "Node",
                    def  : "Def",
                    link : "Link",
                    port : "Port",
                    type : "Type"}[evt.type]
        act      = evt.action + act
        var fn   = ng[act]
        var args = this.unpackArgs(act, evt.details)
        var new_ng = fn.apply(ng, args)
        
        if (do_enqueue && new_ng !== ng) {
            this.enqueue(evt)
        }
        
        return new_ng
    }
    
    
    // handle and execute an edit action arriving from the server.
    processServerAction = (data) => {
        console.log("got", data)
        this.app.setState(prevState => {
            var ng = this.applyEvent(prevState.ng, data, false)
            if (ng === prevState.ng) {
                return {}
            } else {
                return { ng : ng }
            }
        })
    }
    
    
    // xxx: this should be done by the server, eventually.
    addEntryExitNodes(ng, node_id) {
        var new_def_id = ng.nodes.get(node_id).def_id
        var new_def    = ng.defs.get(new_def_id)
        if (new_def.hasBody()) {
            var entry_def_id = this.generateID("def")
            var exit_def_id  = this.generateID("def")
            var evts = [{
                action  : "add", 
                type    : "def", 
                details : {
                    def_id    : entry_def_id,
                    name      : "entry", 
                    node_type : NODE_TYPE.NODE_ENTRY,
                    type_sig  : new TypeSignature(),
                }}, {
                action  : "add", 
                type    : "def", 
                details : {
                    def_id    : exit_def_id,
                    name      : "exit", 
                    node_type : NODE_TYPE.NODE_EXIT,
                    type_sig  : new TypeSignature(),
                }}, {
                action  : "add", 
                type    : "node", 
                details : {
                    node_id   : this.generateID("node"),
                    def_id    : entry_def_id,
                    parent_id : node_id,
                }}, {
                action  : "add", 
                type    : "node", 
                details : {
                    node_id   : this.generateID("node"),
                    def_id    : exit_def_id,
                    parent_id : node_id,
                }}]
            for (var e of evts) {
                ng = this.applyEvent(ng, e)
            }
        }
        return ng
    }
    
    
    // request an action be executed. After doing it, tell the server.
    action(act, keyword_args) {
        var f   = this.app.ng
        var t   = this.actionTemplates[act]
        var evt = {action : t.action, type : t.type, details : keyword_args}
        this.enqueue(evt)
    }
    
    
    // Request that an event be sent back to the server.
    // If the server is not connected, remember it for later.
    enqueue(act) {
        if (this.connected) {
            this.socket.emit('graph_edit', act)
            console.log('graph_edit', act)
        } else {
            console.log('queued', act)
            this.queued.push(act)
        }
    }
    
    
    // Empty out all the requested events that haven't been sent yet
    // and send them all to the server.
    flushQueue() {
        if (this.connected) {
            while (this.queued.length > 0) {
                var act = this.queued.pop()
                this.socket.emit('graph_edit', act)
                console.log('graph_edit',act)
            }
        }
    }
    
}