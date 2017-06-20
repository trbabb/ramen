import React                        from 'react';
import ReactDOM                     from 'react-dom';
import {lazyDeepUpdate, deepUpdate} from './update';
import {MNode}                      from './mNode';
import {Link}                       from './mLink';



function computeOffset(e) {
    var xy = [0,0];
    while (e !== null && e !== undefined) {
        xy[0] += e.offsetLeft - e.scrollLeft;
        xy[1] += e.offsetTop  - e.scrollTop;
        
        // this is, like, super lame:
        let style = window.getComputedStyle(e);
        if ('transform' in style) {
            let    mx = style.transform;
            let match = mx.match(/matrix\((.*)\)/);
            if (match) {
                let arr = match[1].split(", ")
                xy[0] += Number(arr[4])
                xy[1] += Number(arr[5])
            }
        }
        
        e = e.offsetParent;
    } 
    return xy;
}


export class NodeView extends React.Component {
    
    constructor(props) {
        super(props);
        this.state = this.getInitialState();
        this.elem  = null;
    }
    
    getInitialState() {
        return {
            port_coords  : {},   // todo: convert to immutable for speed / consistency.
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
        var eDom   = ReactDOM.findDOMNode(this.elem);
        var p_offs = computeOffset(eDom);
        this.setState({mouse_coords : [evt.clientX - p_offs[0], evt.clientY - p_offs[1]]});
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
        var port = (endpoint == 0) ? link.sink : link.src
        
        console.assert(this.state.partialLink === null);
        
        var d = {
            hiddenLink  : linkID,
            partialLink : [port.node_id, port.port_id]};
        
        //this.props.onLinkDisconnected(linkID);
        
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
        
        // iterate over endpts instead
        var ks = this.props.links.keySeq();
        for (let i = 0; i < ks.size; ++i) {
            var link_id = ks.get(i)
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
        ks = this.props.nodes.keySeq();
        for (let i = 0; i < ks.size; ++i) {
            var node_id = ks.get(i)
            var n = this.props.nodes.get(node_id);
            nodes.push(<MNode node_id={node_id}
                              key={"__node_" + node_id}
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
                    onClick={this.onClick}
                    ref={(e) => {this.elem = e}}>
                {links}
                {nodes}
                {this.emitpartialLink()}
            </div>
        );
    }
}
