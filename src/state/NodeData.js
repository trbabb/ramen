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
        this.def_id       = def_id
        this.parent       = parent
        this.source_links = new Map()
        this.sink_links   = new Map()
        this.child_nodes  = new Set()
        this.child_links  = new Set()
        this.entry_id     = null
        this.exit_id      = null
        this.position     = [0,0]
        this.value        = null
    }
    
    
    // connect a link to one of the sources/sinks of this node.
    addLink(port_id, is_sink, link_id) {
        var n = _.clone(this)
        var update_thing = n.source_links
        if (is_sink) update_thing = n.sink_links
        update_thing = update_thing.update(
                port_id,
                new Set(),
                (s) => {return s.add(link_id)})
        
        if (is_sink) n.sink_links   = update_thing
        else         n.source_links = update_thing
        
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
    
    
    // disconnect a link from a source/sink of this node.
    removeLink(port_id, is_sink, link_id) {        
        var update_thing = this.source_links
        if (is_sink) update_thing = this.sink_links
            
        if (!update_thing.has(port_id) || !update_thing.get(port_id).includes(link_id)) {
            // object not here; nothing to do.
            return this
        }
        
        var n = _.clone(this);
        update_thing = update_thing.update(port_id, s => { return s.remove(link_id) })
        if (is_sink) n.sink_links   = update_thing
        else         n.source_links = update_thing
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
    
    
    // move this node to the specified position (relative to its parent).
    setPosition(position) {
        var n = _.clone(this)
        n.position = position
        return n
    }
    
    
    setValue(v) {
        var n = _.clone(this)
        n.value = v
        return n
    }
    
    
    // return the set of links which connect the direct children of this node.
    getLinks(port_id, is_sink) {
        var getty_thing          = this.source_links
        if (is_sink) getty_thing = this.sink_links
        if (getty_thing.has(port_id)) {
            return getty_thing.get(port_id)
        } else {
            return new Set()
        }
    }
    
    
    getAllLinks() {
        return (
            this.source_links.entrySeq().map(
                ([port_id, linkset]) => {
                    return {
                        port_id : port_id,
                        is_sink : false,
                        cxns    : linkset,
                    }
                }
        ).concat(
            this.sink_links.entrySeq().map(
                ([port_id, linkset]) => {
                    return {
                        port_id : port_id,
                        is_sink : true,
                        cxns    : linkset
                    }
                })
            )
        )
    }


}
