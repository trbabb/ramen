import {Map, Set}       from 'immutable'
import * as _           from 'lodash'

import {NodeData}       from './NodeData'
import {Def, NODE_TYPE} from './Def'
import {TypeSignature}  from './TypeSignature'


// an "immutable" NodeGraph.
// mutation functions return a new altered copy; leaving original unchanged.


// todo: it would be good to make alterations using immutable.AsMutable for performance.
//       the mutable intermediates could be shared by mutators which call each other.
// todo: it might be good to keep function type signatures in a common place.
//       this will matter more when we have multiple function calls referring to a common
//       definition.
// todo: we need to separate the concept of a plain node and a body node,
//       and need a concept for inner ports and outer ports. this is needed for both
//       function definitions and loops. those ports will need connectivity too, so
//       probably the best way to handle it is refer to exactly two nodes representing
//       the header/footer. those nodes could have the outer node as a parent, and then
//       we have a simplified connectivity rule that connections may only happen to
//       nodes with the same parent.
// todo: addPort/removePort will do different things for loops and functions; maybe
//       should not be permitted for bare nodes. for loops: every port is added to
//       both inner/outer and sorce/sink signatures. for functions: only changes the
//       inner signature (and also possibly the signature at call sites).

export class NodeGraph {


    constructor() {
        this.nodes          = new Map()
        this.links          = new Map()
        this.defs           = new Map()
        this.types          = new Map()
        this.child_nodes    = new Set()
        this.child_links    = new Set()
        this.placeable_defs = new Set()
    }


    addNode(node_id, def_id, parent_id=null, value=null) {
        var ng   = _.clone(this)
        var node = new NodeData(def_id, parent_id)
        if (value !== null && value !== undefined) {
            node.value = value
        }
        ng.nodes = this.nodes.set(node_id, node)
        
        if (parent_id === null || parent_id === undefined) {
            ng.child_nodes  = this.child_nodes.add(node_id)
        } else {
            var parent_node = this.nodes.get(parent_id)
            parent_node     = parent_node.addChildNode(node_id)
            
            // should the parent be updated to refer to a new entry/exit?
            // see footnote [1] if it's unclear why this happens here.
            var def = this.defs.get(def_id)
            if (def.node_type === NODE_TYPE.NODE_ENTRY) {
                parent_node.entry_id = node_id
            } else if (def.node_type === NODE_TYPE.NODE_EXIT) {
                parent_node.exit_id  = node_id
            }
            
            ng.nodes = ng.nodes.set(parent_id, parent_node)
        }
        
        return ng
    }


    removeNode(node_id) {
        if (!this.nodes.has(node_id)) { return this }
        var ng = _.clone(this)
        var  n = this.nodes.get(node_id)
        
        // remove all existing links
        for (var {cxns} of n.getAllLinks()) {
            for (var link_id of cxns.valueSeq()) {
                ng = ng.removeLink(link_id)
            }
        }
        
        // remove all child nodes
        for (var child_node_id of n.child_nodes.values()) {
            ng = ng.removeNode(child_node_id)
        }
        
        // remove all child_links, if any remaining
        n = ng.nodes.get(node_id)
        for (var child_link_id of n.child_links.values()) {
            ng = ng.removeLink(child_link_id)
        }
        
        // remove from parent node
        if (n.parent !== null) {
            var parent = ng.nodes.get(n.parent)
            parent = parent.removeChildNode(node_id)
            
            // if we're an entry/exit node, unlink us from our parent.
            // in principle the parent will be removed shortly, but
            // this is good hygiene, ensures perfect idempotency.
            var def = ng.defs.get(n.def_id)
            if (def.node_type === NODE_TYPE.NODE_ENTRY) {
                parent.entry_id = null
            } else if (def.node_type === NODE_TYPE.NODE_EXIT) {
                parent.exit_id = null
            }
            
            ng.nodes = ng.nodes.set(n.parent, parent)
        } else {
            ng.child_nodes = ng.child_nodes.remove(node_id)
        }
        
        ng.nodes = ng.nodes.remove(node_id)
        return ng
    }
    
    
    constructLink(port_0, port_1) {
        // return a Link object for two ports, 
        // such that the source/sink are correctly identified.
        
        if (port_0.is_sink === port_1.is_sink) {
            // can't connect a src to a src or a sink to a sink.
            return null
        }
        
        // order the link source to sink.
        var new_link
        if (port_0.is_sink) {
            new_link = {
                sink : port_0,
                src  : port_1
            }
        } else {
            new_link = {
                sink : port_1,
                src  : port_0
            }
        }
        return new_link
    }


    addLink(link_id, link) {
        
        // invalid connection
        if (link === null) return this
        
        // get endpoint nodes
        var sink_id     = link.sink.node_id
        var src_id      = link.src.node_id
        var sink_node   = this.nodes.get(sink_id)
        var src_node    = this.nodes.get(src_id)
        var src_parent  = src_node.parent
        var sink_parent = sink_node.parent
    
        // 'mutate' the nodes
        src_node  =  src_node.addLink(link.src.port_id,  false, link_id)
        sink_node = sink_node.addLink(link.sink.port_id, true,  link_id)
        
        // clobber the old node entries
        var ng   = _.clone(this)
        ng.nodes = this.nodes.set(src_id,  src_node)
        ng.nodes =   ng.nodes.set(sink_id, sink_node)
        
        // add the link
        ng.links = this.links.set(link_id, link)
        
        // add the link to the parent
        var parent_id = src_parent
        if (sink_parent !== src_parent && sink_parent === src_id) {
            // in this case, the parent of the sink is the source.
            // the link should belong to the source (outer) node,
            // not the *parent* of the outer node.
            parent_id = sink_parent
        }
        if (parent_id === null) {
            ng.child_links = this.child_links.add(link_id)
        } else {
            var parent_node = this.nodes.get(parent_id)
            parent_node = parent_node.addChildLink(link_id)
            ng.nodes = ng.nodes.set(parent_id, parent_node)
        }
        
        return ng
    }


    removeLink(link_id) {
        var link      = this.links.get(link_id)
        var src_node  = this.nodes.get(link.src.node_id)
        var sink_node = this.nodes.get(link.sink.node_id)
        src_node      =  src_node.removeLink(link.src.port_id,  true,  link_id)
        sink_node     = sink_node.removeLink(link.sink.port_id, false, link_id)
        
        var ng   = _.clone(this)
        ng.links = this.links.remove(link_id)
        ng.nodes = this.nodes.set(link.src.node_id, src_node).set(link.sink.node_id, sink_node)
        
        // remove link from its parent
        var parent_id = src_node.parent
        if (parent_id === null || parent_id === undefined) {
            ng.child_links = this.child_links.remove(link_id)
        } else {
            var parent_node = this.nodes.get(parent_id)
            parent_node     = parent_node.removeChildLink(link_id)
            ng.nodes        = ng.nodes.set(parent_id, parent_node)
        }
        
        return ng
    }


    addPort(def_id, port_id, type_id, is_sink) {
        var def = this.defs.get(def_id)
        def     = def.addPort(port_id, type_id, is_sink)
        
        var ng = _.clone(this)
        ng.defs = ng.defs.set(def_id, def)
        
        return ng
    }
    
    
    removePort(def_id, port_id) {
        var ng  = _.clone(this)
        var def = ng.defs.get(def_id)
        
        def     = def.removePort(port_id)
        ng.defs = ng.defs.set(def_id, def)
        
        return ng
    }


    addDef(def_id, name, node_type, sig, placeable) {
        var ng  = _.clone(this)
        if (!(sig instanceof TypeSignature)) {
            sig = new TypeSignature(sig.sink_types, sig.source_types)
        }
        ng.defs = this.defs.set(def_id, new Def(name, node_type, sig))
        
        if (placeable) {
            ng.placeable_defs = ng.placeable_defs.add(def_id)
        }
        
        return ng
    }


    removeDef(name, def_id) {
        // this is a bit sketchy. what happens when we remove a def
        // referred to by many functions? we'll provide a fn for this,
        // but should maybe not use it for now.
        var ng = _.clone(this)
        if (!this.defs.has(def_id)) return this
        ng.defs = this.defs.remove(def_id)
        // todo: redirect any functions pointing here?
        return ng
    }
    
    
    addType(type_id, type_info) {
        var ng = _.clone(this)
        ng.types = ng.types.set(type_id, type_info)
        return ng
    }
    
    
    removeType(type_id) {
        var ng = _.clone(this)
        ng.types = ng.types.remove(type_id)
        return ng
    }
    
    
    setLiteral(node_id, value) {
        var ng   = _.clone(this)
        var node = ng.nodes.get(node_id)
        ng.nodes = ng.nodes.set(node_id, node.setValue(value))
        return ng
    }


    setPosition(node_id, coords) {
        var n = this.nodes.get(node_id)
        n = n.setPosition(coords)
        var ng = _.clone(this)
        ng.nodes = ng.nodes.set(node_id, n)
        return ng
    }


    ofNode(node_id) {
        // xxx todo: this introduces a performance penalty, since
        // this is recreated on each "frame" D:
        if (!this.nodes.has(node_id)) {
            return this
        }
        var ng = _.clone(this)
        var n  = this.nodes.get(node_id)
        ng.child_nodes = n.child_nodes
        ng.child_links = n.child_links
        return ng
    }


}


// footnote [1]:

// it might seem weird that we individually add the entry and exit nodes for
// all nodes with bodies here. why not automatically add them the moment they are 
// created, you ask? we don't ever want those nodes to be without entry/exits.

// we do it this way because the server/client have to sync state, and so have
// to agree on the identifiers for things. this means the EditProxy has to be
// aware of every "node creation" act that happens, so it can tattle to the server 
// about it (or so that we can hear from the server what the names of the header/footer
// nodes are).

// the alternative would be to name the header/footers in predictable ways, so that
// we don't have to exchange information about them. this could be asking for trouble,
// though, as we don't want name collisions to ever be possible. ensuring that could
// become subtle/difficult given that nodes can be added/deleted in any order, and this
// would also impose rules on every component that might generate an identifier (or
// we are back to the same problem of centralizing node creation).

