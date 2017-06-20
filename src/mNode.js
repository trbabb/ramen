import React     from 'react';
import Draggable from 'react-draggable';
import ReactDOM  from 'react-dom';
import {Port}    from './mPort';

export class MNode extends React.Component {
    
    constructor(props) {
        super(props);
        this.portElems = [];
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
            for (var i = 0; i < this.portElems.length; ++i) {
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
        while (eDom !== null && eDom !== undefined && eDom.id !== this.props.paneID) {
            xy[0] += eDom.offsetLeft;
            xy[1] += eDom.offsetTop;
            
            // this makes me sad. :(
            let style = window.getComputedStyle(eDom);
            if ('transform' in style) {
                let    mx = style.transform;
                let match = mx.match(/matrix\((.*)\)/);
                if (match) {
                    let arr = match[1].split(", ")
                    xy[0] += Number(arr[4])
                    xy[1] += Number(arr[5])
                }
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
                key           = {port_id}
                port_id       = {port_id}
                node_id       = {that.props.node_id}
                type_id       = {type_id}
                isSink        = {doSinks}
                links         = {that.props.links[port_id]}
                direction     = {doSinks ? [0,-1] : [0,1]}
                onPortClicked = {that.props.onPortClicked}
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
                    onDrag={this.onDrag}>
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