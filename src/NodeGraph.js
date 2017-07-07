import {Map, Set} from 'immutable'
import * as _     from 'lodash'

import {NodeData} from './NodeData'


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
        this.nodes       = new Map()
        this.links       = new Map()
        this.child_nodes = new Set()
        this.child_links = new Set()
        this.max_node_id = 0
        this.max_link_id = 0
    }
    
    
    addNode(name, type_sig, parent_id=null, id=null) {
        var ng = _.clone(this)
        if (id === null) {
            id = this.max_node_id;
        }
        ng.max_node_id = Math.max(this.max_node_id, id) + 1
        ng.nodes       = this.nodes.set(id, new NodeData(name, type_sig, parent_id))
        
        if (parent_id === null || parent_id === undefined) {
            ng.child_nodes  = this.child_nodes.add(id)
        } else {
            var parent_node = this.nodes.get(parent_id)
            parent_node     = parent_node.addChildNode(id);
            ng.nodes        = ng.nodes.set(parent_id, parent_node);
        }
        
        return {ng, id}
    }
    
    
    removeNode(node_id) {
        if (!this.nodes.has(node_id)) { return this }
        var ng = _.clone(this)
        var  n = this.nodes.get(node_id)
    
        // remove all existing links
        for (var cxns of n.port_links.values()) {
            for (var link_id of cxns.values()) {
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
        
        ng.nodes = ng.nodes.remove(node_id)
        return { ng:ng, id:node_id }
    }
    
    
    addLink(port_0, port_1) {
        var p0_sink = this.nodes.get(port_0.node_id).isPortSink(port_0.port_id)
        var p1_sink = this.nodes.get(port_1.node_id).isPortSink(port_1.port_id)
        
        if (p0_sink === p1_sink) {
            // can't connect a src to a src or a sink to a sink.
            console.log("Rejected link; must connect source to sink.")
            return { ng:this, id:null }
        }
        
        // order the link source to sink.
        var new_link;
        if (p0_sink) {
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
        
        // get endpoint nodes
        var sink_id    = new_link.sink.node_id;
        var src_id     = new_link.src.node_id;
        var sink_node  = this.nodes.get(sink_id);
        var src_node   = this.nodes.get(src_id);
        // check for a link matching the one we're about to make.
        var cxn_exists = sink_node.getLinks(new_link.sink.port_id)
        cxn_exists = cxn_exists.find(x => {
            return _.isEqual(this.links.get(x), new_link);
        });
        
        var src_parent  = src_node.parent;
        var sink_parent = sink_node.parent;
        
        if (cxn_exists !== undefined) {
            // link exists; don't make a redundancy.
            console.log("Rejected link; exists.");
        } if (sink_parent !== src_parent && 
              sink_parent !== src_id &&
              src_parent  !== sink_id) {
            console.log("Rejected link; links must be to siblings or parent-to-child.")
        } else {
            console.log("Accepted link.");
            var new_link_id = this.max_link_id;
            // 'mutate' the nodes
            src_node  =  src_node.addLink(new_link.src.port_id,  new_link_id);
            sink_node = sink_node.addLink(new_link.sink.port_id, new_link_id);
            
            // clobber the old node entries
            var ng   = _.clone(this)
            ng.nodes = this.nodes.set(src_id,  src_node);
            ng.nodes =   ng.nodes.set(sink_id, sink_node);
            
            // add the link
            ng.links = this.links.set(new_link_id, new_link);
            
            // add the link to the parent
            var parent_id = src_parent;
            if (sink_parent !== src_parent && sink_parent === src_id) {
                // in this case, the parent of the sink is the source.
                // the link should belong to the source (outer) node,
                // not the *parent* of the outer node.
                parent_id = sink_parent;
            }
            if (parent_id === null) {
                ng.child_links = this.child_links.add(new_link_id);
            } else {
                var parent_node = this.nodes.get(parent_id)
                parent_node = parent_node.addChildLink(new_link_id)
                ng.nodes = ng.nodes.set(parent_id, parent_node)
            }
            
            ng.max_link_id = new_link_id + 1;
            
            return { ng:ng, id:new_link_id }
        }
        
        return { ng:this, id:null }
    }
    
    
    removeLink(link_id) {
        var link      = this.links.get(link_id);
        var src_node  = this.nodes.get(link.src.node_id);
        var sink_node = this.nodes.get(link.sink.node_id);
        src_node      =  src_node.removeLink(link.src.port_id,  link_id);
        sink_node     = sink_node.removeLink(link.sink.port_id, link_id);
        
        var ng   = _.clone(this)
        ng.links = this.links.remove(link_id)
        ng.nodes = this.nodes.set(link.src.node_id, src_node).set(link.sink.node_id, sink_node)
        
        // remove link from its parent
        var parent_id = src_node.parent;
        if (parent_id === null || parent_id === undefined) {
            ng.child_links = this.child_links.remove(link_id);
        } else {
            var parent_node = this.nodes.get(parent_id);
            parent_node     = parent_node.removeChildLink(link_id);
            ng.nodes        = ng.nodes.set(parent_id, parent_node);
        }
        
        return { ng:ng, id:link_id}
    }
    
    
    addPort(node_id, type_id, is_sink, port_id=null) {
        var node = this.nodes.get(node_id)
        var z    = node.addPort(type_id, is_sink, port_id)
        node     = z.node
        var id   = z.id
        
        var ng = _.clone(this)
        ng.nodes = ng.nodes.set(node_id, node)
        
        return {ng,id}
    }
    
    
    removePort(node_id, port_id) {
        var ng = _.clone(this)
        var n  = ng.nodes.get(node_id)
        
        // there might be links connected to the port we're deleting. if so, remove them.
        var links = n.getLinks(port_id)
        for (var link_id of links) {
            ng = ng.removeLink(link_id)
        }
        
        n = n.removePort(port_id)
        ng.nodes = ng.nodes.set(node_id, n)
        
        return {ng:ng, id:[node_id,port_id]}
    }
    
    
    setPosition(node_id, coords) {
        var n = this.nodes.get(node_id)
        n = n.setPosition(coords)
        var ng = _.clone(this)
        ng.nodes = ng.nodes.set(node_id, n)
        return ng
    }
    
    
    ofNode(node_id) {
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