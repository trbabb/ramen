import React from 'react';


export class Link extends React.Component {
    
    onClick = () => {
        if (this.props.onClick) {
            // xxx todo: this
        }
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
    
    // todo: make the dots generate endpoint events
    // todo: make a partial link a single line
    
    makeLine(pts, partial=false) {
        let p0 = pts[0]
        let p2 = pts[1]
        let p1 = [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2]
        var className = "LinkLine" + (partial ? " Partial" : "");
        return [this.makeLineElement(p0, p1, 
                    {key:"_seg_0", 
                    className:className,
                    onClick:(e) => {
                        var evt = {mouseEvt : e, linkID: this.props.linkID, endpoint:0}
                        this.props.onLinkEndpointClicked(evt)
                    }}),
            
                this.makeLineElement(p1, p2, 
                    {key:"_seg_1", 
                    className:className,
                    onClick:(e) => {
                        var evt = {mouseEvt : e, linkID: this.props.linkID, endpoint:1}
                        this.props.onLinkEndpointClicked(evt)
                    }})]
    }
    
    render() {
        var rad = 5;
        var pad = Math.max(rad,3);
        var bnds = this.bounds();
        
        // put the points into the coordsys of this svg element.
        var xf_pts = this.props.points.map(p => {
            return [p[0] - bnds.lo[0] + pad, p[1] - bnds.lo[1] + pad];
        });
        
        // make the dots.
        var dots = []
        for (var i = 0; i < xf_pts.length; ++i) {
            let p   = xf_pts[i];
            let dot = <circle r={rad} cx={p[0]} cy={p[1]} className="LinkDot" key={"__dot_" + i}/>;
            dots.push(dot);
        }
        
        var className = "LinkLine" + (this.props.partial === true ? " Partial" : "");
        var style = {
                position:"absolute",
                left:    bnds.lo[0] - pad,
                top:     bnds.lo[1] - pad
            }
        
        if (this.props.partial) {
            // partial links hover on top. If they are clickable, 
            // they'll mask the clicks to the ports underneath them, preventing a connection.
            style['pointerEvents'] = 'none'
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