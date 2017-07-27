import React from 'react';
import ReactDOM       from 'react-dom';
import {GraphElement} from '../state/GraphElement'


// Link is the React element for rendering a link between two node ports.
// It knows the port ID and the (local) coordinates of its endpoints.


export class Link extends React.PureComponent {
    
    constructor(props) {
        super(props)
        this.state = {
            src_endpt_selected  : false,
            sink_endpt_selected : false
        }
        this.sink_elem = null
        this.src_elem  = null
    }
    
    
    bounds() {
        let mins = [ Infinity,  Infinity];
        let maxs = [-Infinity, -Infinity];
        for (var i = 0; i < this.props.points.length; ++i) {
            let p = this.props.points[i];
            mins = [Math.min(p[0], mins[0]), Math.min(p[1], mins[1])];
            maxs = [Math.max(p[0], maxs[0]), Math.max(p[1], maxs[1])];
        }
        return {lo:mins, hi:maxs};
    }
    
    
    makeLineElement(p0, p1, extraProps) {
        return <line 
            x1={p0[0]}
            y1={p0[1]}
            x2={p1[0]}
            y2={p1[1]}
            {...extraProps}/>
    }
    
    
    getGraphElement() {
        return new GraphElement("link", this.props.link_id)
    }
    
    
    componentDidMount() {
        if (!this.props.partial) {
            this.props.onElementMounted(this.getGraphElement(), this)
        }
    }
    
    
    componentWillUnmount() {
        if (!this.props.partial) {
            this.props.onElementUnmounted(this.getGraphElement())
        }
    }
    
    
    setSelected(selected, src_side=null) {
        if (src_side || src_side === null) {
            this.setState({src_endpt_selected : selected})
        }
        if (!src_side) {
            this.setState({sink_endpt_selected : selected})
        }
    }
    
    
    grabFocus(src_side) {
        var e = this.sink_elem
        if (src_side) {
            e = this.src_elem
        }
        var domnode = ReactDOM.findDOMNode(e)
        domnode.focus()
    }
    
    
    onSourceEndpointClicked = (e) => {
        var evt = {mouseEvt : e, link_id: this.props.link_id, isSource:true}
        this.props.onLinkEndpointClicked(evt)
    }
    
    
    onSinkEndpointClicked = (e) => {
        var evt = {mouseEvt : e, link_id: this.props.link_id, isSource:false}
        this.props.onLinkEndpointClicked(evt)
    }
    
    
    // todo: make the dots generate endpoint events
    // todo: add invisible elements to expand the click area.
    
    
    makeLine(pts, partial=false) {
        let p0 = pts[0]
        let p2 = pts[1]
        let p1 = [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2]
        
        // partial links must not be clickable. because they are drawn on top of nodes,
        // they would mask the port-connecting clicks. all other strokes must be clickable.
        var style = partial ? {} : {pointerEvents : 'visiblePainted'}
        if (partial) {
            return [this.makeLineElement(p0, p2, {key:"_seg_0", className:"LinkLine Partial"})];
        } else {
            return [this.makeLineElement(p0, p1, 
                        {key:"_seg_0", 
                        className:"LinkLine" + (this.state.src_endpt_selected ? " SelectedGraphElement" : ""),
                        style:style,
                        tabIndex:1,
                        onFocus:(e => {this.props.onElementFocused(this.getGraphElement())}),
                        ref:(e => {this.src_elem = e}),
                        onClick:this.onSourceEndpointClicked}),
                
                    this.makeLineElement(p1, p2, 
                        {key:"_seg_1", 
                        className:"LinkLine" + (this.state.sink_endpt_selected ? " SelectedGraphElement" : ""),
                        style:style,
                        tabIndex:1,
                        onFocus:(e => {this.props.onElementFocused(this.getGraphElement())}),
                        ref:(e => {this.sink_elem = e}),
                        onClick:this.onSinkEndpointClicked})]
        }
    }
    
    
    render() {
        var rad = 5;
        var pad = Math.max(rad,3);
        var bnds = this.bounds();
        var cbaks = {0 : this.onSourceEndpointClicked, 1 : this.onSinkEndpointClicked};
        
        // put the points into the coordsys of this svg element.
        var xf_pts = this.props.points.map(p => {
            return [p[0] - bnds.lo[0] + pad, p[1] - bnds.lo[1] + pad];
        });
        
        // make the dots.
        var dots = []
        for (var i = 0; i < xf_pts.length; ++i) {
            let p   = xf_pts[i];
            let dot = <circle 
                r={rad} 
                cx={p[0]} cy={p[1]} 
                className="LinkDot" 
                key={"__dot_" + i}
                onClick={cbaks[i]} />;
            dots.push(dot);
        }
        
        var style = {
            position:"absolute",
            left:    bnds.lo[0] - pad,
            top:     bnds.lo[1] - pad,
            pointerEvents: 'none'  // we don't want the svg's bounding rect to capture events.
        }
        
        return (
            <svg className="Link" 
                width ={bnds.hi[0] - bnds.lo[0] + 2 * pad}
                height={bnds.hi[1] - bnds.lo[1] + 2 * pad}
                style={style}>
                {this.makeLine(xf_pts, this.props.partial)}
                {dots}
            </svg>);
    }
    
}