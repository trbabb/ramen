import React from 'react';
import ReactDOM       from 'react-dom';
import {GraphElement} from '../state/GraphElement'
import * as _         from 'lodash'


// Link is the React element for rendering a link between two node ports.
// It knows the port ID and the (local) coordinates of its endpoints.


export class Link extends React.PureComponent {
    
    constructor(props) {
        super(props)
        this.state = {
            src_endpt_selected  : false,
            sink_endpt_selected : false,
            points              : [[0,0],[0,0]]
        }
        this.sink_elem  = null
        this.src_elem   = null
        this.whole_elem = null
    }
    
    
    bounds() {
        let mins = [ Infinity,  Infinity];
        let maxs = [-Infinity, -Infinity];
        for (var i = 0; i < this.state.points.length; ++i) {
            let p = this.state.points[i];
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
        if (this.props.partial) {
            return new GraphElement("partial_link", this.props.anchor)
        } else {
            return new GraphElement("link", this.props.link_id)
        }
    }
    
    
    onRef = (e) => {
        this.whole_elem = e
        if (e) {
            this.props.onElementMounted(this.getGraphElement(), this)
        } else {
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
    
    
    setEndpoint(xy, is_sink) {
        this.setState(prevState => {
            var s = _.clone(prevState.points)
            s[is_sink ? 1 : 0] = xy
            return {points : s}
        })
    }
    
    
    grabFocus(src_side) {
        // var e = this.sink_elem
        // if (src_side) {
        //     e = this.src_elem
        // }
        var e = this.whole_elem
        var eDom = ReactDOM.findDOMNode(e)
        if (eDom) eDom.focus()
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
                        className:"LinkLine",
                        style:style,
                        tabIndex:1,
                        onFocus:(e => {this.props.onElementFocused(this.getGraphElement())}),
                        ref:(e => {this.src_elem = e}),
                        onClick:this.onSourceEndpointClicked}),
                
                    this.makeLineElement(p1, p2, 
                        {key:"_seg_1", 
                        className:"LinkLine",
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
        var xf_pts = this.state.points.map(p => {
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
        
        var seld = this.state.src_endpt_selected || this.state.sink_endpt_selected
        
        // NOTE: TODO: when endpoint picking is ready, rm tabindex from below:
        return (
            <svg className={"Link" + (seld ? " SelectedGraphElement" : "")}
                width ={bnds.hi[0] - bnds.lo[0] + 2 * pad}
                height={bnds.hi[1] - bnds.lo[1] + 2 * pad}
                ref={this.onRef}
                tabIndex={1}
                style={style}>
                {this.makeLine(xf_pts, this.props.partial)}
                {dots}
            </svg>);
    }
    
}