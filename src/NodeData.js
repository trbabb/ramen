import {Map, Set} from 'immutable'
import * as _     from 'lodash'

// NodeData is the React state representation of a language node.
// It is rendered by an MNode react element.

// It carries the type signature and name, a mapping of port ID
// to connected link ID, and a list of IDs for any inner nodes and links.

export class NodeData {
    
    
    constructor(name, type_sig, parent=null, port_links=null) {
        this.name        = name
        this.type_sig    = type_sig
        this.parent      = parent
        this.port_links  = (port_links === null) ? new Map() : port_links;
        this.child_nodes = new Set();
        this.child_links = new Set();
    }
    
    
    isPortSink(port_id) {
        return port_id < this.type_sig.n_sinks;
    }
    
    
    addLink(port_id, link_id) {
        var n = _.clone(this)
        n.port_links = this.port_links.update(
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
    
    
    removeLink(port_id, link_id) {
        if (this.port_links.has(port_id) && this.port_links.get(port_id).includes(link_id)) {
            var n = _.clone(this);
            n.port_links = this.port_links.update(port_id, s => {s.delete(link_id)})
            return n
        } else {
            return this
        }
    }
    
    
    getLinks(port_id) {
        if (this.port_links.has(port_id)) {
            return this.port_links.get(port_id);
        } else {
            return new Set();
        }
    }
    
    
}