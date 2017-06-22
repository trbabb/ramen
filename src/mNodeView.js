import React            from 'react';
import ReactDOM         from 'react-dom';
import {lazyDeepUpdate} from './update';
import {MNode}          from './mNode';
import {Link}           from './mLink';


// NodeView holds nodes and links, and ensures that the two stay visually connected.


export class NodeView extends React.PureComponent {
    
    
    constructor(props) {
        super(props);
        this.state = this.getInitialState();
        this.elem  = null;
    }
    
    
    getInitialState() {
        return {
            // used for emitting the node endpoints:
            port_coords  : {},   // todo: convert to Immutable for speed / consistency.
            partialLink  : null,
            mouse_coords : null
        };
    }
    
    
    onClick = (evt) => {
        if (this.state.partialLink !== null) {
            // cancel the active link.
            this.setState({partialLink : null});
        }
    }
    
    
    onMouseMove = (evt) => {
        var eDom = ReactDOM.findDOMNode(this.elem);
        var box  = eDom.getBoundingClientRect()
        this.setState({mouse_coords : [evt.clientX - box.left, evt.clientY - box.top]});
    }
    
    
    onPortMoved = ({node_id, port_id, newPos}) => {
        // some child port moved. Update the mapping of port positions.
        this.setState(function(prevState) {
            var eDom = ReactDOM.findDOMNode(this.elem)
            var box  = eDom.getBoundingClientRect()
            return lazyDeepUpdate(
                prevState,                                    // obj to copy-update
                ['port_coords', [node_id, port_id]],          // key seq
                [newPos[0] - box.left, newPos[1] - box.top]); // new item
        });
    }
    
    
    onPortClicked = ({node_id, port_id, mouse_evt}) => {
        // create or complete the "partial" link
        if (this.state.partialLink === null) {
            // initiate a partial link
            this.setState({partialLink : [node_id, port_id]});
        } else {
            // complete a partial    link
            var p0 = {
                node_id : this.state.partialLink[0],
                port_id : this.state.partialLink[1]
            }
            var p1 = {
                node_id : node_id,
                port_id : port_id
            }
            this.props.onLinkCompleted(p0, p1);
            this.setState({partialLink : null});
        }
    }
    
    
    onLinkEndpointClicked = ({mouseEvt, linkID, endpoint}) => {
        var link = this.props.links.get(linkID)
        var port = (endpoint === 0) ? link.sink : link.src
        
        console.assert(this.state.partialLink === null);
        
        var d = {
            hiddenLink  : linkID,
            partialLink : [port.node_id, port.port_id]};
        
        this.props.onLinkDisconnected(linkID);
        
        this.setState(d)
    }
    
    
    emitpartialLink() {
        if (this.state.partialLink !== null) {
            return (<Link 
                points={[this.state.mouse_coords, this.state.port_coords[this.state.partialLink]]}
                partial={true}/>);
        }
    }
    
    
    render() {
        var links = [];
        var nodes = [];
        
        // emit the links which are our direct children
        for (var link_id of this.props.child_links) {
            var lnk = this.props.links.get(link_id)
            var p0  = [lnk.src.node_id,  lnk.src.port_id]
            var p1  = [lnk.sink.node_id, lnk.sink.port_id]
            if (!(p0 in this.state.port_coords && p1 in this.state.port_coords)) {
                // uninitialized port coodinates; don't know where to draw this guy.
                continue;
            }
            var p0_c = this.state.port_coords[p0];
            var p1_c = this.state.port_coords[p1];
            links.push(<Link 
                points={[p0_c, p1_c]} 
                key={"__link_" + link_id} 
                linkID={link_id}
                onLinkEndpointClicked={this.onLinkEndpointClicked}/>);
        }
        
        // emit the nodes which are our direct children
        for (var node_id of this.props.child_nodes) {
            var n = this.props.nodes.get(node_id);
            var x = {}
            if (n.child_nodes.size > 0) {
                // these are heavy, so don't send them to 
                // the nodes which don't have inner nodes.
                x.nodes              = this.props.nodes
                x.links              = this.props.links
                x.onLinkCompleted    = this.props.onLinkCompleted
                x.onLinkDisconnected = this.props.onLinkDisconnected
            }
            nodes.push(<MNode node_id={node_id}
                              key={"__node_" + node_id}
                              paneID={this.props.id} 
                              onPortMoved={this.onPortMoved} 
                              onPortClicked={this.onPortClicked}
                              {...n}
                              {...x} />);
        }
        
        return (
            <div className="NodeView" 
                    id={this.props.id} 
                    style={{position:"relative"}}
                    onMouseMove={this.onMouseMove}
                    onClick={this.onClick}
                    ref={(e) => {this.elem = e}}>
                {links}
                {nodes}
                {this.emitpartialLink()}
            </div>
        );
    }
}
