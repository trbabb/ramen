import React from 'react';

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


// todo: pass the dom element, let the NodeView translate the point to local coords.


export class Port extends React.Component {
    
    render() {
        var classes = ["Port", this.props.isSource ? "Source" : "Sink"]
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
                             mouse_evt : evt}
                    this.props.onPortClicked(e);
                }}
                ref={this.props.portRef} />
        );
    }
}
