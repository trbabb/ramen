import React          from 'react'
import Draggable      from 'react-draggable'
import ReactDOM       from 'react-dom'
import {GraphElement} from '../state/GraphElement'
import {NODE_TYPE}    from '../state/Def'
import {CallNodeBody, 
        FunctionNodeBody, 
        LiteralNodeBody,
        LoopNodeBody} from './NodeBody.js'

// MNode is the React element for a language node.


export class MNode extends React.PureComponent {
    
    
    constructor(props) {
        super(props);
        this.state = {
            selected : false,
            xy       : [0,0]
        }
        this.elem = null
    }
    
    
    getGraphElement() {
        return new GraphElement("node", this.props.node_id)
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
        if (this.elem) {
            var dom_e = ReactDOM.findDOMNode(this.elem)
            if (dom_e) dom_e.focus()
        }
    }
    
    
    onDrag = (e, position) => {
        this.setState({xy: [position.x, position.y]})
        this.props.cbacks.onNodeMove(this.props.node_id, [position.x, position.y])
    }
    
    
    onFocus = (e) => {
        // we have to check if the focus event is actually targeting us and not one of our children.
        // if the latter, we don't want to steal focus/selection from them.
        var self_dom = ReactDOM.findDOMNode(this.elem)
        if (e.target === self_dom) {
            this.props.cbacks.onElementFocused(this.getGraphElement())
        }
    }
    
    
    render() {
        var body = null
        var t    = this.props.def.node_type
        var subprops = {
            node    : this.props.node,
            node_id : this.props.node_id,
            def     : this.props.def,
            cbacks  : this.props.cbacks,
        }
        if (t === NODE_TYPE.NODE_CALL ||
            t === NODE_TYPE.NODE_BUILTIN) {
            body = <CallNodeBody     {...subprops}/>
        } else if (t === NODE_TYPE.NODE_FUNCTION) {
            body = <FunctionNodeBody {...subprops} ng={this.props.ng}/>
        } else if (t === NODE_TYPE.NODE_LITERAL) {
            body = <LiteralNodeBody  {...subprops} is_output={false}/>
        } else if (t === NODE_TYPE.NODE_EXPORT) {
            body = <LiteralNodeBody {...subprops} is_output={true}/>
        } else if (t === NODE_TYPE.NODE_LOOP) {
            body = <LoopNodeBody {...subprops} ng={this.props.ng}/>
        }
        return (
            <Draggable
                    position={{x : this.state.xy[0], y : this.state.xy[1]}}
                    onDrag={this.onDrag}
                    cancel=".NodeInput">
                <div className={"MNode" + (this.state.selected ? " SelectedGraphElement" : "")}
                        onFocus={this.onFocus}
                        ref={this.onRef}
                        tabIndex={1}>
                    {body}
                </div>
            </Draggable>
        );
    }
    
}
