import React          from 'react';
import ReactDOM       from 'react-dom';
import {MNode}        from './mNode';
import {Link}         from './mLink';
import {NODE_TYPE}    from '../state/Def'
import {GraphElement} from '../state/GraphElement'


// NodeView holds nodes and links, and renders them both.

export class NodeView extends React.PureComponent {


    constructor(props) {
        super(props)
        this.state = this.getInitialState()
        this.elem  = null
    }
    
    
    getInitialState() {
        return {
            corner_offs : this.props.position
        };
    }
    
    onRef = (e) => {
        this.elem = e
        if (e) {
            this.props.cbacks.onElementMounted(this.getGraphElement(), this)
        } else {
            this.props.cbacks.onElementUnmounted(this.getGraphElement())
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
            // make the link
            links.push(<Link
                key={"__link_" + link_id}
                link_id={link_id}
                onElementMounted={this.props.cbacks.onElementMounted}
                onElementUnmounted={this.props.cbacks.onElementUnmounted}
                onElementFocused={this.props.cbacks.onElementFocused}
                onLinkEndpointClicked={this.props.cbacks.onLinkEndpointClicked}/>);
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
                // todo: this is regenerated on every render, which ain't great
                x.ng = this.props.ng.ofNode(node_id)
            }
            nodes.push(<MNode node_id = {node_id}
                              key     = {"__node_" + node_id}
                              cbacks  = {this.props.cbacks}
                              node    = {n}
                              def     = {def}
                              {...x}/>)
        }
        
        return (
            <div className="NodeView NodeInput"
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
