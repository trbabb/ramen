import React, { Component }         from 'react';
import {lazyDeepUpdate, deepUpdate} from './update';
import {MNode}                      from './mNode';
import {Link}                       from './mLink';


// xxx: todo: the node_ids are randomly turning into strings for some reason.


export class NodeView extends React.Component {
    
    constructor(props) {
        super(props);
        this.state = this.getInitialState();
    }
    
    getInitialState() {
        return {
            port_coords  : {},
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
        this.setState({mouse_coords : [evt.clientX, evt.clientY]});
    }
    
    onPortMoved = ({node_id, port_id, newPos}) => {
        this.setState(function(prevState) {
            return lazyDeepUpdate(
                prevState,                           // obj to copy-update
                ['port_coords', [node_id, port_id]], // key seq
                newPos);                             // new item
        });
    }
    
    onPortClicked = ({node_id, port_id, mouse_evt}) => {
        if (this.state.partialLink === null) {
            // initiate a partial link
            this.setState({partialLink : [node_id, port_id]});
        } else {
            // complete a partial link
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
    
    emitpartialLink() {
        if (this.state.partialLink !== null) {
            return (<Link points={
                [this.state.mouse_coords, this.state.port_coords[this.state.partialLink]]
            }/>);
        }
    }
    
    render() {
        var links = [];
        var nodes = [];
        
        // iterate over endpts instead
        for (let i = 0; i < this.props.links.length; ++i) {
            var lnk = this.props.links[i]
            var p0  = [lnk.src.node_id,  lnk.src.port_id]
            var p1  = [lnk.sink.node_id, lnk.sink.port_id]
            if (!(p0 in this.state.port_coords && p1 in this.state.port_coords)) {
                continue;
            }
            var p0_c = this.state.port_coords[p0];
            var p1_c = this.state.port_coords[p1];
            links.push(<Link points={[p0_c, p1_c]} />);
        }
        for (let i = 0; i < this.props.nodes.length; ++i) {
            var n = this.props.nodes[i];
            nodes.push(<MNode node_id={i}
                              key={"__node_" + i}
                              paneID={this.props.id} 
                              onPortMoved={this.onPortMoved} 
                              onPortClicked={this.onPortClicked}
                              {...n} />);
        }
        
        return (
            <div className="NodeView" 
                    id={this.props.id} 
                    style={{position:"relative"}}
                    onMouseMove={this.onMouseMove}
                    onClick={this.onClick}>
                {links}
                {this.emitpartialLink()}
                {nodes}
            </div>
        );
    }
}
