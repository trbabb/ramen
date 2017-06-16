import React, { Component } from 'react';
import Draggable from 'react-draggable';
import update    from 'immutability-helper';
import ReactDOM  from 'react-dom';

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


// Update a nested JS object assuming that all parent keys exist.
// `obj`  : A js object to copy-update (will remain unchanged)
// `keys` : A "path" of keys in the nested JS object to update.
// `val`  : Value to set.
function deepUpdate(obj, keys, val) {
    var kk = keys.slice() // dupe array
    var u = {} // full nested update array, e.g. {a : {b : {c : val}}}
    var v = u  // current leaf array
    while (kk.length > 0) {
        let k = kk.shift()
        let w = (kk.length > 0) ? {} : {$set : val}
        v[k]  = w
        v     = w
    }
    console.log("doing ", JSON.stringify(u))
    return update(obj, u);
}


// Update a nested JS object and create new, empty JS objects if any 
// parent element doesn't exist.
// `obj`   : Object to copy-update (argument remains unaffected).
// `keys`  : A "path" of keys in the nested JS object to update.
// `val`   : New value.
// `types` : A list of n-1 constructors as a funciton of nesting depth, for creating missing parents.
//           Note that a constructor for the final key is not needed, since the value is provided.
function lazyDeepUpdate(obj, keys, val, types=null) {
    var k_remaining = keys.slice(); // dupe array
    var k_shifted   = [];
    var cur = obj;
    var depth = 0;
    
    while (k_remaining.length > 0) {
        let k = k_remaining.shift();
        k_shifted.push(k);
        if (!(k in cur) || k_remaining.length == 0) {
            // either add a new empty parent, or add the final object
            var new_obj;
            if (k_remaining.length > 0) {
                // make a new parent
                new_obj = (types === null || types[depth] === null || types[depth] === undefined) ? {} : types[depth]();
            } else {
                new_obj = val;
            }
            obj = deepUpdate(obj, k_shifted, new_obj);
            cur = new_obj;
        } else {
            cur = cur[k];
        }
        ++depth;
    };
    return obj;
}


export class NodeView extends React.Component {
    
    // port                      : {node_id, port_id}
    // this.links     = {link_id : {src : port, sink : port}}
    // this.endpoints = {link_id : [pt, pt]}
    // this.nodes     = {node_id : {type_sig : [...], 
    //                              cxns     : [link_id ...]
    //                              call_sig : "..." }}
    
    constructor(props) {
        super(props);
        this.endpointMoved  = this.endpointMoved.bind(this);
        this.updateEndpoint = this.updateEndpoint.bind(this);
        this.state = this.getInitialState();
    }
    
    getInitialState() {
        return {
            endpoints   : {},
            port_coords : {},
            partialLink : null
        };
    }
    
    updateEndpoint(link_id, newPos, pt_idx) {
        this.setState(function(prevState) {
            var w = lazyDeepUpdate(
                prevState,                      // obj to copy-update
                ['endpoints', link_id, pt_idx], // key seq
                newPos,                         // new value
                [Object, Array]);               // constructors for empty parents
            console.log(w)
            return w;
        });
    }
    
    updatePortCoord = ({node_id, port_id, newPos}) => {
        this.setState(function(prevState) {
            var upd = {}
        })
    }
    
    onPortClicked = (port) => {
        if (this.state.partialLink === null) {
            // initiate a partial link
            this.setState({partialLink : port});
        } else {
            // complete a partial link
            this.setState({partialLink : null});
            this.props.onLinkCompleted(this.state.partialLink, port);
        }
    }
    
    endpointMoved({node_id, port_id, isSink, newPos}) {
        var endpoints = {};
        
        // iterate over the links that need to be updated (if any)
        var nod = this.props.nodes[node_id];
        if (nod.links && port_id in nod.links) {
            // a set of link_ids.
            var cxn = nod.links[port_id];
            
            for (var i in cxn) {
                var link_id = cxn[i];
                var pt_idx  = isSink ? 1 : 0;
                this.updateEndpoint(link_id, newPos, pt_idx);
            }
        }
    }
    
    emitpartialLink() {
        if (this.state.partialLink !== null) {
            return (<Link points={
                [[0,0], [100,200]]
            }/>);
        }
    }
    
    render() {
        var links = [];
        var nodes = [];
        
        // iterate over endpts instead
        for (var i in this.state.endpoints) {
            var lnk = this.state.endpoints[i];
            if (Object.keys(lnk).length >= 2) {
                links.push(<Link points={lnk} key={i}/>);
            }
        }
        for (var i in this.props.nodes) {
            var n = this.props.nodes[i];
            nodes.push(<MNode node_id={i}
                              key={"_node_" + i}
                              paneID={this.props.id} 
                              onPortMoved={this.endpointMoved} 
                              onPortClicked={this.onPortClicked}
                              {...n} />);
        }
        
        return (
            <div className="NodeView" id={this.props.id} style={{position:"relative"}}>
                {links}
                {this.emitpartialLink()}
                {nodes}
            </div>
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
        var rad = 5;
        var pad = Math.max(rad,3);
        var bnds = this.bounds();
        
        // put the points into the coordsys of this svg element.
        var xf_pts = this.props.points.map(p => {
            return [p[0] - bnds.lo[0] + pad, p[1] - bnds.lo[1] + pad];
        });
        
        // make the dots.
        var dots = []
        for (var i in xf_pts) {
            let p   = xf_pts[i];
            let dot = <circle r={rad} cx={p[0]} cy={p[1]} className="LinkDot"/>;
            dots.push(dot);
        }
        
        return (
            <svg className="Link" 
                width ={bnds.hi[0] - bnds.lo[0] + 2 * pad}
                height={bnds.hi[1] - bnds.lo[1] + 2 * pad}
                style={{
                    position:"absolute",
                    left:    bnds.lo[0] - pad,
                    top:     bnds.lo[1] - pad
                }}>
                <polyline 
                    points={xf_pts.map(p => {return (p[0] + "," + p[1]);})}
                    className="LinkLine"/>
                {dots}
            </svg>);
    }
}


export class Port extends React.Component {
    
    render() {
        var classes = ["Port", this.props.isSource ? "Source" : "Sink"]
        if (this.props.links != undefined && this.props.links.length > 0) {
            classes.push("Connected");
        }
        return (
            <img 
                src={typeIcons[this.props.type_id]}
                width={20} height={20} 
                className={classes.join(" ")} 
                draggable="false"
                onClick={this.props.onClick}
                ref={this.props.portRef} />
        );
    }
}


export class MNode extends React.Component {
    
    constructor(props) {
        super(props);
        this.portElems = {};
        this.selfElem  = null;
        this.state     = {
            position : ("position" in props) ? (props.position) : {x:0, y:0}
        };
    }
    
    componentDidMount() {
        // set the initial port positions
        this.updateAllPorts();
    }
    
    
    onDrag = (e, position) => {
        this.setState({position: position});
        this.updateAllPorts();
    }
    
    updatePort(port_idx) {
        var xy = this.computePortConnectionPoint(this.portElems[port_idx]);
        var evt = {
            node_id : this.props.node_id,
            port_id : port_idx,
            isSink  : port_idx < this.props.type_sig.n_sinks,
            newPos  : xy
        };
        this.props.onPortMoved(evt);
    }
    
    updateAllPorts = () => {
        if (this.props.onPortMoved) {
            for (var i in this.portElems) {
                this.updatePort(i);
            }
        }
    }
    
    computePortConnectionPoint(elem) {
        var eDom  = ReactDOM.findDOMNode(elem);
        var xy    = [eDom.offsetWidth  / 2.,
                     eDom.offsetHeight / 2.];
        xy[0]    += elem.props.direction[0] * xy[0];
        xy[1]    += elem.props.direction[1] * xy[1];
        var myDOM = ReactDOM.findDOMNode(this.draggableElem);
        while (eDom != null && eDom != undefined && eDom.id != this.props.paneID) {
            xy[0] += eDom.offsetLeft;
            xy[1] += eDom.offsetTop;
            if (eDom == myDOM) {
                xy[0] += this.draggableElem.state.x;
                xy[1] += this.draggableElem.state.y;
            }
            eDom = eDom.offsetParent;
        } 
        return xy;
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
        sig.type_ids.slice(start,end).forEach(function(type_id, i){
            var port_id = start + i;
            var p = <Port
                key       = {port_id}
                port_id   = {port_id} 
                node_id   = {that.props.node_id}
                type_id   = {type_id} 
                isSink    = {doSinks} 
                links     = {that.props.links[port_id]}
                direction = {doSinks ? [0,-1] : [0,1]} 
                onClick   = {that.props.onPortClicked}
                ref = {function(e) {
                    that.portElems[port_id] = e;
                }} />
            z.push(p);
        });
        return z;
    }
    
    render() {
        return (
            <Draggable 
                    position={this.state.position}
                    cancel=".Port"
                    onDrag={this.onDrag}
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