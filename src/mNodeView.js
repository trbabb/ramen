import React    from 'react';
import ReactDOM from 'react-dom';
import * as _   from 'lodash'

import {MNode}  from './mNode';
import {Link}   from './mLink';


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
            corner_offs : [0,0]
        };
    }
    
    
    componentDidMount() {
        this.updateCorner()
    }
    
    
    componentDidUpdate() {
        this.updateCorner()
    }
    
    
    updateCorner() {
        var thisDom = ReactDOM.findDOMNode(this.elem)
        var box     = thisDom.getBoundingClientRect()
        var offs    = [box.left, box.top]
        if (!_.isEqual(this.state.corner_offs, offs)) {
            this.setState({corner_offs : offs})
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
            
            if (!(this.props.port_coords.hasIn(p0) && this.props.port_coords.hasIn(p1))) {
                // port coordinates are not initialized.
                continue
            }
            
            // compute local link coordinates
            var p0_c = this.props.port_coords.getIn(p0);
            var p1_c = this.props.port_coords.getIn(p1);
            var offs = this.state.corner_offs
            p0_c = [p0_c[0] - offs[0], p0_c[1] - offs[1]]
            p1_c = [p1_c[0] - offs[0], p1_c[1] - offs[1]]
            
            // make the link
            links.push(<Link 
                points={[p0_c, p1_c]} 
                key={"__link_" + link_id} 
                linkID={link_id}
                onLinkEndpointClicked={this.props.mutation_callbacks.onLinkEndpointClicked}/>);
        }
        
        // emit the nodes which are our direct children
        for (var node_id of this.props.ng.child_nodes) {
            var n = this.props.ng.nodes.get(node_id);
            var x = {}
            if (n.hasBody()) {
                // these are heavy, so don't send them to 
                // the nodes which don't have inner nodes.
                x.ng          = this.props.ng.ofNode(node_id)
                x.port_coords = this.props.port_coords
            }
            nodes.push(<MNode node_id={node_id}
                              key={"__node_" + node_id}
                              paneID={this.props.id} 
                              mutation_callbacks={this.props.mutation_callbacks}
                              node={n}
                              {...x} />);
        }
        
        return (
            <div className="NodeView" 
                    id={this.props.id} 
                    style={{position:"relative"}}
                    onMouseMove={this.onMouseMove}
                    ref={(e) => {this.elem = e}}>
                {links}
                {nodes}
            </div>
        );
    }
}
