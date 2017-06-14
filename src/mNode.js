import React, { Component } from 'react';
import Draggable from 'react-draggable';
import update    from 'immutability-helper';
import ReactDOM  from 'react-dom'

import i32_img from './resource/i32.png'
import f32_img from './resource/f32.png'
import i64_img from './resource/i64.png'
import f64_img from './resource/f64.png'

const typeIcons = {
    'i32' : i32_img,
    'f32' : f32_img,
    'i64' : i64_img,
    'f64' : f64_img
};


export class NodeView extends React.Component {
    
    // port                      : {node_id, port_id}
    // this.links     = {link_id : {src : port, sink : port}}
    // this.endpoints = {link_id : [pt, pt]}
    // this.nodes     = {node_id : {type_sig : [...], 
    //                              cxns     : [link_id ...]
    //                              call_sig : "..." }}
    
    constructor(props) {
        super(props);
        this.state          = {endpoints : {}}
        this.endpointMoved  = this.endpointMoved.bind(this);
        this.updateEndpoint = this.updateEndpoint.bind(this);
        this.initializeEndpoints();
    }
    
    initializeEndpoints() {
        var endpts = {};
        for (var linkID in this.props.links) {
            var link = this.props.links[linkID];
            endpts[linkID] = [[],[]];
        }
        this.state = {endpoints : endpts}
    }
    
    updateEndpoint(link_id, newPos, pt_idx) {
        this.setState(function(prevState) {
            var link = {};
            link[pt_idx] = {$set : newPos};
            var z = {};
            z[link_id] = link;
            return update(prevState, {endpoints: z});
        });
    }
    
    endpointMoved(evt) {
        var nodeID = evt.nodeID;
        var portID = evt.portID;
        var isSink = evt.isSink;
        var newPos = evt.newPos;
        
        var endpoints = {};
        
        // iterate over the links that need to be updated (if any)
        var nod = this.props.nodes[nodeID];
        if (nod.links && portID in nod.links) {
            // a set of link_ids.
            var cxn = nod.links[portID];
            
            for (var i in cxn) {
                var link_id = cxn[i];
                var pt_idx  = isSink ? 1 : 0;
                this.updateEndpoint(link_id, newPos, pt_idx);
            }
        }
    }
    
    render() {
        var links = [];
        var nodes = [];
        
        // iterate over endpts instead
        for (var i in this.state.endpoints) {
            var lnk = this.state.endpoints[i];
            if (lnk.length >= 2) {
                links.push(<Link points={lnk}/>);
            }
        }
        for (var i in this.props.nodes) {
            var n = this.props.nodes[i];
            n["onPortMoved"] = this.endpointMoved;
            nodes.push(<MNode node_id={i}
                              key={"_node_" + i}
                              paneID={this.props.id} 
                              onPortMoved={this.endpointMoved} 
                              {...n} />);
        }
        
        return (
            <div className="NodeView" id={this.props.id} style={{position:"relative"}}>
                {links}
                {nodes}
            </div>
        );
    }
}


export class Port extends React.Component {
    
    render() {
        return (
            <img src={typeIcons[this.props.typeID]} 
                id={this.props.portID}
                width={20} height={20} 
                className={"Port " + (this.props.isSource ? "Source" : "Sink")} 
                draggable="false"
                ref={this.props.portRef}/>
        );
    }
}


export class Link extends React.Component {
    
    bounds() {
        let mins = [ Infinity,  Infinity];
        let maxs = [-Infinity, -Infinity];
        for (var i in this.props.points) {
            let p = this.props.points[i];
            mins = [Math.min(p[0], mins[0]), Math.min(p[1], mins[1])];
            maxs = [Math.max(p[0], maxs[0]), Math.max(p[1], maxs[1])];
        }
        return {lo:mins, hi:maxs};
    }
    
    render() {
        let bnds = this.bounds();
        return (
            <svg className="Link" 
                width ={bnds.hi[0] - bnds.lo[0]}
                height={bnds.hi[1] - bnds.lo[1]}
                style={{
                    position:"absolute",
                    left:    bnds.lo[0],
                    top:     bnds.lo[1]
                }}>
                <polyline 
                    points={this.props.points.map(
                        function(p) {
                            return (p[0] - bnds.lo[0]) + "," + (p[1] - bnds.lo[1]);
                        }
                    )}
                    className="LinkLine"/>
            </svg>);
    }
}


export class MNode extends React.Component {
    
    constructor(props) {
        super(props);
        this.dragging   = this.dragging.bind(this);
        this.portElems  = {};
        this.selfElem   = null;
        this.updatePort = this.updatePort.bind(this);
    }
    
    
    computePortConnectionPoint(pDom) {
        var xy = [0,0];
        var myDOM = ReactDOM.findDOMNode(this.draggableElem);
        while (pDom != null && pDom != undefined && pDom.id != this.props.paneID) {
            xy[0] += pDom.offsetLeft;
            xy[1] += pDom.offsetTop;
            if (pDom == myDOM) {
                xy[0] += this.draggableElem.state.x;
                xy[1] += this.draggableElem.state.y;
            }
            pDom = pDom.offsetParent;
        }
        return xy;
    }
    
    updatePort(elem, i) {
        this.portElems[i] = elem;
    }
    
    dragging() {
        if (this.props.onPortMoved) {
            for (var i in this.portElems) {
                var xy = this.computePortConnectionPoint(this.portElems[i]);
                var evt = {
                    nodeID : this.props.node_id,
                    portID : i,
                    isSink : i < this.props.type_sig.n_sinks,
                    newPos : xy
                };
                this.props.onPortMoved(evt);
            }
        }
    }
    
    makePorts(doSinks) {
        var sig   = this.props.type_sig;
        var start = doSinks ? 0 : sig.n_sinks;
        var end   = doSinks ? sig.n_sinks : sig.type_ids.length;
        var z = []
        
        // we HAVE to use function application here, because the body of a loop
        // does not create a closure. Thus the "i" inside of the ref callback
        // lambda would have a nonsense value.
        var that = this;
        sig.type_ids.slice(start,end).forEach(function(typeId, i){
            var port_id = start + i;
            var p = <Port
                key={"_node_" + that.props.node_id + "_port_" + port_id}
                typeID={typeId} 
                portID={port_id}
                isSink={doSinks}
                ref={function(e) {
                    that.portElems[port_id] = ReactDOM.findDOMNode(e);
                }} />
            z.push(p);
        });
        return z;
    }
    
    render() {
        return (
            <Draggable 
                    cancel=".Port" 
                    onDrag={this.dragging}
                    ref={(e) => {this.draggableElem = e;}}>
                <div className="MNode">
                    <div className="PortGroup SinkPortGroup">
                        {this.makePorts(true)}
                    </div>
                    <div className="CallName" id="fncall">
                        {this.props.callName}
                    </div>
                    <div className="PortGroup SourcePortGroup">
                        {this.makePorts(false)}
                    </div>
                </div>
            </Draggable>
        );
    }
    
}