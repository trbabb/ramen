import {Map, Set} from 'immutable'
import * as _     from 'lodash'

// NodeData is the React state representation of a language node.
// It is rendered by an MNode react element.

// It carries the type signature and name, a mapping of port ID
// to connected link ID, and a list of IDs for any inner nodes and links.

// A NodeData is "immutable", in that mutation functions return a 
// new, altered copy, leaving the original unchanged.


export class NodeData {
    
    
    constructor(name, type_sig, parent=null, links_by_id=null) {
        this.name        = name
        this.type_sig    = type_sig
        this.parent      = parent
        this.links_by_id = (links_by_id === null) ? new Map() : links_by_id;
        this.child_nodes = new Set();
        this.child_links = new Set();
    }
    
    
    isPortSink(port_id) {
        return this.type_sig.isSink(port_id);
    }
    
    
    addLink(port_id, link_id) {
        var n = _.clone(this)
        n.links_by_id = this.links_by_id.update(
                port_id,
                new Set([link_id]),
                (s) => {return s.add(link_id)})
        return n
    }
    
    
    addChildNode(node_id) {
        var n = _.clone(this)
        n.child_nodes = this.child_nodes.add(node_id)
        return n
    }
    
    
    addChildLink(link_id) {
        var n = _.clone(this)
        n.child_links = this.child_links.add(link_id)
        return n
    }
    
    
    removeChildNode(node_id) {
        var n = _.clone(this)
        n.child_nodes = this.child_nodes.delete(node_id)
        return n
    }
    
    
    removeChildLink(link_id) {
        var n = _.clone(this)
        n.child_links = this.child_links.delete(link_id)
        return n
    }
    
    
    addPort(typ) {
        
    }
    
    
    removePort(port_id, idx) {
        
    }
    
    
    removeLink(port_id, link_id) {
        if (this.links_by_id.has(port_id) && this.links_by_id.get(port_id).includes(link_id)) {
            var n = _.clone(this);
            n.links_by_id = this.links_by_id.update(port_id, s => {s.delete(link_id)})
            return n
        } else {
            return this
        }
    }
    
    
    getLinks(port_id) {
        if (this.links_by_id.has(port_id)) {
            return this.links_by_id.get(port_id);
        } else {
            return new Set();
        }
    }
    
    
    hasBody() {
        return (this.name === "function" || this.name === "loop")
    }
    
    
}