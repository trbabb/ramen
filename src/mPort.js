import React    from 'react';
import ReactDOM from 'react-dom';
import * as _   from 'lodash'

import i32_img  from './resource/i32.png'
import f32_img  from './resource/f32.png'
import i64_img  from './resource/i64.png'
import f64_img  from './resource/f64.png'
import s_img    from './resource/s.png'

const typeIcons = {
    'i32' : i32_img,
    'f32' : f32_img,
    'i64' : i64_img,
    'f64' : f64_img,
    's'   : s_img
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
                width={20} height={20}
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
