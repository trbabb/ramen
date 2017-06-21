import {Map, Set} from 'immutable'
import * as _     from 'lodash'

export class NodeData {
    
    
    constructor(name, type_sig, parent=null, links=null) {
        this.name        = name
        this.type_sig    = type_sig
        this.parent      = parent
        this.links       = (links === null) ? new Map() : links;
        this.child_nodes = new Set();
        this.child_links = new Set();
    }
    
    
    isPortSink(port_id) {
        return port_id < this.type_sig.n_sinks;
    }
    
    
    addLink(port_id, link_id) {
        var n = _.clone(this)
        n.links = this.links.update(
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
        n.child_links = this.child_nodes.add(link_id)
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
        if (this.links.has(port_id) && this.links.get(port_id).includes(link_id)) {
            var n = _.clone(this);
            n.links = this.links.update(port_id, s => {s.delete(link_id)})
            return n
        } else {
            return this
        }
    }
    
    
    getLinks(port_id) {
        if (this.links.has(port_id)) {
            return this.links.get(port_id);
        } else {
            return new Set();
        }
    }
    
    
}