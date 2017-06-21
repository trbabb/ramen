import React     from 'react';
import Draggable from 'react-draggable';
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
        var xy  = this.portElems[port_idx].getConnectionPoint();
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
    
    
    makePorts(doSinks) {
        var sig   = this.props.type_sig;
        var start = doSinks ? 0 : sig.n_sinks;
        var end   = doSinks ? sig.n_sinks : sig.type_ids.length;
        var z = []
        
        // we HAVE to use function application here, because the body of a loop
        // does not create a closure. Thus the "i" inside of the ref callback
        // lambda would have a nonsense value.
        var that = this;
        sig.type_ids.slice(start, end).forEach(function(type_id, i) {
            var port_id = start + i;
            var p = <Port
                key           = {port_id}
                port_id       = {port_id}
                node_id       = {that.props.node_id}
                type_id       = {type_id}
                isSink        = {doSinks}
                links         = {that.props.links.get(port_id)}
                direction     = {doSinks ? [0,-1] : [0,1]}
                onPortClicked = {that.props.onPortClicked}
                ref = {function(e) {
                    that.portElems[port_id] = e;
                }} />
            z.push(p);
        });
        return z;
    }
    
    
   renderFunctionDefBody() {
        return (
            <div className="MNode Function">
                <div className="FnHeader">
                    <div className="CallName">{this.props.name}</div>
                    {this.makePorts(true)}
                </div>
            </div>
        );
    }
    
    
    renderPlainBody() {
        return (
            <div className="MNode">
                <div className="PortGroup SinkPortGroup">
                    {this.makePorts(true)}
                </div>
                <div className="CallName">
                    {this.props.name}
                </div>
                <div className="PortGroup SourcePortGroup">
                    {this.makePorts(false)}
                </div>
            </div>
        );
    }
    
    
    render() {
        return (
            <Draggable 
                    position={this.state.position}
                    cancel=".Port"
                    onDrag={this.onDrag}>
                {this.renderPlainBody()}
            </Draggable>
        );
    }
    
}