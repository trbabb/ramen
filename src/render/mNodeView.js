import React          from 'react';
import ReactDOM       from 'react-dom';
import * as _         from 'lodash'

import {MNode}        from './mNode';
import {Link}         from './mLink';
import {NODE_TYPE}    from '../state/Def'
import {GraphElement} from '../state/GraphElement'


// NodeView holds nodes and links, and ensures that the two stay visually connected.

// need moved() events when the port moves in the coordinate space of the drawn links.
// it is more efficient to store points because then the endpoints are only re-computed
// for nodes that have moved.

// however this is a problem because the parent elems will NOT see changes when some intermediate
// element moves.


export class NodeView extends React.PureComponent {


    constructor(props) {
        super(props);
        this.state = this.getInitialState();
        this.elem  = null;
    }
    
    
    getInitialState() {
        return {
            corner_offs : this.props.position
        };
    }
    
    onRef = (e) => {
        this.elem = e
        if (e) {
            this.props.mutation_callbacks.onElementMounted(this.getGraphElement(), this)
        } else {
            this.props.mutation_callbacks.onElementUnmounted(this.getGraphElement())
        }
    }
    
    
    getGraphElement() {
        return new GraphElement("view", this.props.parent_id)
    }
    
    
    getCorner() {
        var thisDom = ReactDOM.findDOMNode(this.elem)
        if (!thisDom) {
            return [0,0]
        } else {
            var box  = thisDom.getBoundingClientRect()
            var offs = [box.left, box.top]
            return offs
        }
    }
    
    
    render() {
        var links = [];
        var nodes = [];
        
        // emit the links which are our direct children
        for (var link_id of this.props.ng.child_links) {
            var lnk = this.props.ng.links.get(link_id)
            var p0  = [lnk.src.node_id,  lnk.src.port_id]
            var p1  = [lnk.sink.node_id, lnk.sink.port_id]
            
            // make the link
            links.push(<Link
                key={"__link_" + link_id}
                link_id={link_id}
                onElementMounted={this.props.mutation_callbacks.onElementMounted}
                onElementUnmounted={this.props.mutation_callbacks.onElementUnmounted}
                onElementFocused={this.props.mutation_callbacks.onElementFocused}
                onLinkEndpointClicked={this.props.mutation_callbacks.onLinkEndpointClicked}/>);
        }
        
        // emit the nodes which are our direct children
        for (var node_id of this.props.ng.child_nodes) {
            var n   = this.props.ng.nodes.get(node_id)
            var def = this.props.ng.defs.get(n.def_id)
            if (def.node_type === NODE_TYPE.NODE_ENTRY || def.node_type === NODE_TYPE.NODE_EXIT) {
                // magic header / footer node. don't render.
                continue
            }
            var x   = {}
            if (def.hasBody()) {
                // these are heavy, so don't send them to
                // the nodes which don't have inner nodes.
                x.ng          = this.props.ng.ofNode(node_id)  // xxx: this is re-created on every frame D:
                x.port_coords = this.props.port_coords
            }
            nodes.push(<MNode node_id={node_id}
                              key={"__node_" + node_id}
                              paneID={this.props.id}
                              mutation_callbacks={this.props.mutation_callbacks}
                              node={n}
                              def={def}
                              types={this.props.ng.types}
                              {...x}/>)
        }
        
        return (
            <div className="NodeView"
                    id={this.props.id}
                    style={{position:"relative"}}
                    onMouseMove={this.onMouseMove}
                    ref={this.onRef}>
                {links}
                {nodes}
            </div>
        );
    }
}
