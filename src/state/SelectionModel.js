import {OrderedMap}   from 'immutable'
import * as _         from 'lodash'
import {GraphElement} from './GraphElement'
import {NODE_TYPE}    from './Def'


// xxx: todo: have to remove elements from selection when they're removed from the NG.
//
//      dis gon b bad when we remove a port from a common def, i.e. for a call. would actually be better if
//      we got an event for every node that changed instead of for shared defs. that way we 
//      could check if there's such a thing in the selection. it's also annoying that I have to go look up the
//      def elsewhere whenever I need to know the signature. overall this turned out to be an annoying design change.

// todo: need a way to navigate to stuff inside a function node.
//       i.e. a notion of "current parent"; when you descend inside, everything of the outer parent
//       gets de-selected.

// todo: is this a dumb class? should we just tell each element how to transfer its own focus?
//       this class is has its tendrils in a lot of code. 
//       >> yes, to a certain extent. this would be better:
//          each element should have a getElement(direction) funciton.

// todo: when nodes have "vertical" form, will have to switch neighbor logic.


export class SelectionModel {
    
    constructor(app) {
        this.selected_elements = new OrderedMap()
        this.app               = app
        this.edge              = null
        this.listeners         = []
        this.shift             = false
    }
    
    
    _notifyEdgeChange(new_edge) {
        for (let l of this.listeners) {
            l.onSelectionEdgeChange(new_edge)
        }
    }
    
    
    clear_selection() {
        if (this.selected_elements.size > 0) {
            for (let [k,e] of this.selected_elements) {
                var obj = this.app.getElement(e)
                obj.setSelected(false)
            }
            this.selected_elements = new OrderedMap()
            this.edge = null
            this._notifyEdgeChange(null)
        }
    }
    
    
    unselect(elem) {
        var key = elem.key()
        if (this.selected_elements.has(key)) {
            if (this.edge.key() === key) {
                this.retract_selection()
            } else {
                var obj = this.app.getElement(elem)
                obj.setSelected(false)
                this.selected_elements = this.selected_elements.remove(key)
            }
        }
    }
    
    
    set_selection(elem) {
        var found = false
        for (let [k,e] of this.selected_elements) {
            if (!_.isEqual(e, elem)) {
                var o = this.app.getElement(e)
                if (o === undefined) {
                    // xxx fixme. as elememts are deleted, they are not removed from selection
                    console.log("DEBUG: Object not found:", e)
                } else {
                    o.setSelected(false)
                }
            } else {
                // don't de-select the already-selected elem
                found = true
            }
        }
        
        // make this the only elem in the set of selected objs
        var j = {}
        j[elem.key()] = elem
        this.selected_elements = new OrderedMap(j)
        
        // select the object
        var obj = this.app.getElement(elem)
        obj.setSelected(true)
        
        // make it the edge if it wasn't already
        if (!_.isEqual(this.edge, elem)) {
            obj.grabFocus()
            this.edge = elem
            this._notifyEdgeChange(this.edge)
        }
    }
    
    
    extend_selection(elem) {
        if (!_.isEqual(elem, this.edge)) {
            var obj = this.app.getElement(elem)
            this.selected_elements = this.selected_elements.set(elem.key(), elem)
            obj.setSelected(true)
            obj.grabFocus()
            this.edge = elem
            this._notifyEdgeChange(this.edge)
        }
    }
    
    
    retract_selection() {
        if (this.selected_elements.size > 0) {
            var obj = this.app.getElement(this.edge)
            // remove last element:
            this.selected_elements = this.selected_elements.remove(this.selected_elements.keySeq().last())
            obj.setSelected(false)
            if (this.selected_elements.size > 0) {
                this.edge = this.selected_elements.last()
                this.app.getElement(this.edge).grabFocus()
            } else {
                this.edge = null
            }
            this._notifyEdgeChange(this.edge)
        }
    }
    
    
    vertical_neighbor(elem, up) {
        if (elem.type === "port") {
            var inward = elem.id.is_sink ^ up
            if (inward) {
                // the element "inward" of a port is the node it belongs to
                let node = this.app.state.ng.nodes.get(elem.id.node_id)
                let def  = this.app.state.ng.defs.get(node.def_id)
                if (def.node_type === NODE_TYPE.NODE_ENTRY || def.node_type === NODE_TYPE.NODE_EXIT) {
                    // node is not an individual thing that can be selected :\
                    return null
                } else {
                    return new GraphElement("node", elem.id.node_id)
                }
            } else {
                // the element "outward" of a port is the first link connected to it
                var node = this.app.state.ng.nodes.get(elem.id.node_id)
                var connected_links = node.getLinks(elem.id.port_id)
                if (connected_links.size > 0)
                    // todo: order the links by their visual left-to-right ordering.
                    return new GraphElement("link", connected_links.first())
                else {
                    // no links connected to this port
                    return null
                }
            }
        } else if (elem.type === "link") {
            // the element above/below a link is the port it's connected to
            var link = this.app.state.ng.links.get(elem.id)
            var {node_id, port_id} = up ? link.src : link.sink
            return new GraphElement("port", {
                node_id : node_id,
                port_id : port_id,
                is_sink : !up,
            })
        } else if (elem.type === "node") {
            // the element above/below a node is its first input/output port
            var node = this.app.state.ng.nodes.get(elem.id)
            var sig  = this.app.state.ng.defs.get(node.def_id).type_sig
            var ports = up ? sig.getSinkIDs() : sig.getSourceIDs()
            if (ports.size > 0) {
                return new GraphElement("port", {
                    node_id : elem.id,
                    port_id : ports.first(),
                    is_sink : up,
                })
            } else {
                // no ports on this edge of the node
                return null
            }
        }
    }
    
    
    horizontal_neighbor(elem, left) {
        if (elem.type === "port") {
            // the adjacent port is one on the same edge of the node, to the left or right.
            var node  = this.app.state.ng.nodes.get(elem.id.node_id)
            var sig   = this.app.state.ng.defs.get(node.def_id).type_sig
            var ports = (elem.id.is_sink ? sig.getSinkIDs() : sig.getSourceIDs()).toIndexedSeq()
            var p_idx = ports.indexOf(elem.id.port_id) + (left ? -1 : 1)
            if (p_idx < 0 || p_idx >= ports.size) {
                return null
            } else {
                return new GraphElement("port", {
                    node_id : elem.id.node_id,
                    port_id : ports.get(p_idx),
                    is_sink : elem.id.is_sink
                })
            }
        } else if (elem.type === "link") {
            // todo: when half-edges are selectable, this will mean something.
            return null
        } else if (elem.type === "node") {
            return null
        }
    }
    
    
    neighbor(elem, direction) {
        if (direction === "up") {
            return this.vertical_neighbor(elem, true)
        } else if (direction === "down") {
            return this.vertical_neighbor(elem, false)
        } else if (direction === "left") {
            return this.horizontal_neighbor(elem, true)
        } else if (direction === "right") {
            return this.horizontal_neighbor(elem, false)
        } else {
            return null
        }
    }
    
    
    walk(direction) {
        if (this.edge !== null) {
            var new_guy = this.neighbor(this.edge, direction)
            if (new_guy !== null) {
                this.set_selection(new_guy)
            }
        }
    }
    
    
    gather(direction) {
        if (this.edge !== null) {
            var new_guy = this.neighbor(this.edge, direction)
            if (new_guy !== null) {
                this.extend_selection(new_guy)
            }
        }
    }
    
    
    onElementFocused = (elem) => {
        if (this.shift) {
            this.extend_selection(elem)
        } else {
            this.set_selection(elem)
        }
    }
    
    
    onKeyDown = (evt) => {
        if (evt.key === "Shift") {
            console.log("shift down")
            this.shift = true
        }
        if (evt.key === "ArrowUp" || evt.key === "ArrowDown" || evt.key === "ArrowLeft" || evt.key === "ArrowRight") {
            // graph walking shortcuts
            if (this.edge !== null) {
                var direction =  evt.key.replace("Arrow", "").toLowerCase()
                if (evt.shiftKey) {
                    this.gather(direction)
                } else {
                    this.walk(direction)
                }
                evt.preventDefault()
            }
        }
    }
    
    
    onKeyUp = (evt) => {
        if (evt.key === "Shift") {
            console.log("shift up")
            this.shift = false
        }
    }
    
}