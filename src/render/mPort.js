import React          from 'react';
import ReactDOM       from 'react-dom';
import * as _         from 'lodash'
import {GraphElement} from '../state/GraphElement'

import float_img from '../resource/float.png'
import int_img   from '../resource/int.png'
import bool_img  from '../resource/bool.png'
import type_img  from '../resource/type.png'
import proc_img  from '../resource/proc.png'
import list_img  from '../resource/list.png'
import str_img   from '../resource/str.png'

const typeIcons = {
    'int32_t'   : int_img,
    'int64_t'   : int_img,
    'float32_t' : float_img,
    'float64_t' : float_img,
    'string_t'  : str_img,
    'bool_t'    : bool_img,
    'proc_t'    : proc_img,
    'array_t'   : list_img,
    'type_t'    : type_img
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
        if (this.elem === null) return [0,0];

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
    
    
    componentDidMount() {
        this.doPortMoved();
        this.props.mutation_callbacks.onElementMounted(this.getGraphElement(), this)
    }
    
    
    componentDidUpdate() {
        this.doPortMoved();
    }
    
    
    componentWillUnmount() {
        this.props.mutation_callbacks.onElementUnmounted(this.getGraphElement())
    }
    
    
    setSelected(selected) {
        this.setState({selected : selected})
    }
    
    
    grabFocus() {
        var eDom = ReactDOM.findDOMNode(this.elem);
        if (eDom) eDom.focus()
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
            this.props.mutation_callbacks.onPortMoved(evt);
        }
    }
    
    
    onMouseEnter = () => {
        if (this.props.mutation_callbacks.onPortHovered && this.props.edit_target) {
            this.props.mutation_callbacks.onPortHovered(this.props.edit_target);
        }
    }
    
    
    onMouseLeave = () => {
        if (this.props.mutation_callbacks.onPortHovered) {
            this.props.mutation_callbacks.onPortHovered(null);
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
                className={classes.join(" ")}
                draggable="false"
                tabIndex="1"
                onFocus={e => {this.props.mutation_callbacks.onElementFocused(this.getGraphElement())}}
                onMouseEnter={this.onMouseEnter}
                onMouseLeave={this.onMouseLeave}
                onClick={(evt) => {
                    var e = {node_id   : this.props.node_id,
                             port_id   : this.props.port_id,
                             elem      : this.elem,
                             mouse_evt : evt}
                    this.props.mutation_callbacks.onPortClicked(e);
                }}
                ref={(e) => {this.elem = e}} />
        );
    }
}
