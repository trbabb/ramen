import {Map, Set} from 'immutable'
import * as _     from 'lodash'

// NodeData is the state representation of a language node.
// It is rendered by an MNode react element.

// It carries the type signature and name, a mapping of port ID
// to connected link ID, and a list of IDs for any inner nodes and links.

// A NodeData is "immutable", in that mutation functions return a
// new, altered copy, leaving the original unchanged.


export class NodeData {


    constructor(def_id, parent=null, links_by_id=null) {
        this.def_id      = def_id
        this.parent      = parent
        this.links_by_id = ((links_by_id === null) ? new Map() : links_by_id)
        this.child_nodes = new Set()
        this.child_links = new Set()
        this.entry_id    = null
        this.exit_id     = null
        this.position    = [0,0]
    }
    
    
    // connect a link to one of the sources/sinks of this node.
    addLink(port_id, link_id) {
        var n = _.clone(this)
        n.links_by_id = this.links_by_id.update(
                port_id,
                new Set(),
                (s) => {return s.add(link_id)})
        return n
    }
    
    
    // add a node which is a direct child of this node;
    // i.e. add it to this node's "body".
    addChildNode(node_id) {
        var n = _.clone(this)
        n.child_nodes = this.child_nodes.add(node_id)
        return n
    }
    
    
    // add a new link between nodes which are direct children.
    addChildLink(link_id) {
        var n = _.clone(this)
        n.child_links = this.child_links.add(link_id)
        return n
    }
    
    
    // remove a node which is a direct child of this node.
    removeChildNode(node_id) {
        var n = _.clone(this)
        n.child_nodes = this.child_nodes.remove(node_id)
        return n
    }
    
    
    // remove some link which connects two child nodes.
    removeChildLink(link_id) {
        var n = _.clone(this)
        n.child_links = this.child_links.remove(link_id)
        return n
    }
    
    
    // disconnect a link from a source/sink of this node.
    removeLink(port_id, link_id) {
        if (this.links_by_id.has(port_id) && this.links_by_id.get(port_id).includes(link_id)) {
            var n = _.clone(this);
            n.links_by_id = this.links_by_id.update(port_id, s => { return s.remove(link_id) })
            return n
        } else {
            return this
        }
    }
    
    
    // move this node to the specified position (relative to its parent).
    setPosition(position) {
        var n = _.clone(this)
        n.position = position
        return n
    }
    
    
    // return the set of links which connect the direct children of this node.
    getLinks(port_id) {
        if (this.links_by_id.has(port_id)) {
            return this.links_by_id.get(port_id);
        } else {
            return new Set();
        }
    }


}
