import React          from 'react'
import ReactDOM       from 'react-dom'
import {GraphElement} from '../state/GraphElement'

import float_img    from '../resource/c_float.png'
import int_img      from '../resource/c_int.png'
import bool_img     from '../resource/c_bool.png'
import type_img     from '../resource/c_type.png'
import proc_img     from '../resource/c_proc.png'
import list_img     from '../resource/c_list.png'
import str_img      from '../resource/c_str.png'
import obj_img      from '../resource/c_obj.png'
import unsolved_img from '../resource/c_unsolved.png'

const typeIcons = {
    'int32_t'    : int_img,
    'int64_t'    : int_img,
    'float32_t'  : float_img,
    'float64_t'  : float_img,
    'string_t'   : str_img,
    'bool_t'     : bool_img,
    'proc_t'     : proc_img,
    'array_t'    : list_img,
    'type_t'     : type_img,
    'struct_t'   : obj_img,
    'unsolved_t' : unsolved_img
};


// Port is a connection point on a language node.
// It renders a badge representing the type of the accepted connection.

// The connection point may be anywhere within or on the edge of the DOM element,
// as specified by the "direction" prop, which carries two coordinates on [0,1],
// representing the fraction position of the connection point within the element.


export class Port extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            selected : false
        }
        this.elem  = null;
        this.cxnpt = [0,0]
    }
    
    
    // get the connection point in "window" coordinates.
    getConnectionPoint() {
        if (this.elem === null) {
            return [0,0]
        }

        var eDom = ReactDOM.findDOMNode(this.elem);
        var box  = eDom.getBoundingClientRect();
        var xy   = [box.width / 2., box.height / 2.]
        xy[0]   += this.props.direction[0] * xy[0] + box.left;
        xy[1]   += this.props.direction[1] * xy[1] + box.top;

        return xy;
    }
    
    
    getGraphElement() {
        return new GraphElement("port", {
            node_id : this.props.node_id, 
            port_id : this.props.port_id, 
            is_sink : this.props.is_sink
        })
    }
    
    
    onRef = (e) => {
        this.elem = e
        if (e) {
            this.props.cbacks.onElementMounted(this.getGraphElement(), this)
        } else {
            this.props.cbacks.onElementUnmounted(this.getGraphElement())
        }
    }
    
    
    setSelected(selected) {
        this.setState({selected : selected})
    }
    
    
    grabFocus() {
        var eDom = ReactDOM.findDOMNode(this.elem);
        if (eDom) eDom.focus()
    }
    
    
    onMouseEnter = () => {
        if (this.props.cbacks.onPortHovered && this.props.edit_target) {
            this.props.cbacks.onPortHovered(this.props.edit_target);
        }
    }
    
    
    onMouseLeave = () => {
        if (this.props.cbacks.onPortHovered) {
            this.props.cbacks.onPortHovered(null);
        }
    }
    
    
    render() {
        var classes = [
            "Port", 
            this.props.is_sink ? "Sink" : "Source"
        ]
        if (this.props.connnected) {
            classes.push("Connected");
        }
        if (this.state.selected) {
            classes.push("SelectedGraphElement")
        }
        return (
            <img
                src={typeIcons[this.props.type_id]}
                width={16} height={16}
                alt={this.props.port_id }
                title={this.props.type_id + " named " + this.props.port_id}
                className={classes.join(" ")}
                draggable="false"
                tabIndex="1"
                onFocus={e => {this.props.cbacks.onElementFocused(this.getGraphElement())}}
                onMouseEnter={this.onMouseEnter}
                onMouseLeave={this.onMouseLeave}
                onClick={(evt) => {
                    var e = {node_id   : this.props.node_id,
                             port_id   : this.props.port_id,
                             is_sink   : this.props.is_sink,
                             mouse_evt : evt}
                    this.props.cbacks.onPortClicked(e);
                }}
                ref={this.onRef} />
        );
    }
}
