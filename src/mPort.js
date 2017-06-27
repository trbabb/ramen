import React    from 'react';
import ReactDOM from 'react-dom';
import * as _   from 'lodash'

import float_img from './resource/float.png'
import int_img   from './resource/int.png'
import bool_img  from './resource/bool.png'
import type_img  from './resource/type.png'
import proc_img  from './resource/proc.png'
import list_img  from './resource/list.png'
import str_img   from './resource/str.png'

const typeIcons = {
    'int'   : int_img,
    'float' : float_img,
    'str'   : str_img,
    'bool'  : bool_img,
    'proc'  : proc_img,
    'list'  : list_img,
    'type'  : type_img
};


// Port is a connection point on a language node.
// It renders a badge representing the type of the accepted connection.

// The connection point may be anywhere within or on the edge of the DOM element,
// as specified by the "direction" prop, which carries two coordinates on [0,1],
// representing the fraction position of the connection point within the element.


export class Port extends React.PureComponent {
    
    constructor(props) {
        super(props);
        this.elem  = null;
        this.cxnpt = [0,0]
    }
    
    
    // get the connection point in "window" coordinates.
    getConnectionPoint() {
        if (this.elem === null) return [0,0];
        
        var eDom = ReactDOM.findDOMNode(this.elem);
        var box  = eDom.getBoundingClientRect();
        var xy   = [box.width / 2., box.height / 2.]
        xy[0]   += this.props.direction[0] * xy[0] + box.left;
        xy[1]   += this.props.direction[1] * xy[1] + box.top;
        
        return xy;
    }
    
    
    componentDidMount() {
        this.doPortMoved();
    }
    
    
    componentDidUpdate() {
        this.doPortMoved();
    }
    
    
    doPortMoved() {
        var xy = this.getConnectionPoint();
        if (!_.isEqual(xy, this.cxnpt)) {
            var evt = {
                node_id : this.props.node_id,
                port_id : this.props.port_id,
                is_sink : this.props.is_sink,
                new_pos : xy
            };
            this.cxnpt = xy;
            this.props.onPortMoved(evt);
        }
    }
    
    
    render() {
        var classes = ["Port", this.props.is_sink ? "Sink" : "Source"]
        if (this.props.links !== undefined && this.props.links.length > 0) {
            classes.push("Connected");
        }
        return (
            <img 
                src={typeIcons[this.props.type_id]}
                width={16} height={16}
                className={classes.join(" ")} 
                draggable="false"
                onClick={(evt) => {
                    var e = {node_id   : this.props.node_id,
                             port_id   : this.props.port_id,
                             elem      : this.elem,
                             mouse_evt : evt}
                    this.props.onPortClicked(e);
                }}
                ref={(e) => {
                    this.elem = e;
                }} />
        );
    }
}
