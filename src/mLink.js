import React, { Component } from 'react';


export class Link extends React.Component {
    
    bounds() {
        let mins = [ Infinity,  Infinity];
        let maxs = [-Infinity, -Infinity];
        for (var i in this.props.points) {
            let p = this.props.points[i];
            mins = [Math.min(p[0], mins[0]), Math.min(p[1], mins[1])];
            maxs = [Math.max(p[0], maxs[0]), Math.max(p[1], maxs[1])];
        }
        return {lo:mins, hi:maxs};
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
        for (var i in xf_pts) {
            let p   = xf_pts[i];
            let dot = <circle r={rad} cx={p[0]} cy={p[1]} className="LinkDot"/>;
            dots.push(dot);
        }
        
        return (
            <svg className="Link" 
                width ={bnds.hi[0] - bnds.lo[0] + 2 * pad}
                height={bnds.hi[1] - bnds.lo[1] + 2 * pad}
                style={{
                    position:"absolute",
                    left:    bnds.lo[0] - pad,
                    top:     bnds.lo[1] - pad
                }}>
                <polyline 
                    points={xf_pts.map(p => {return (p[0] + "," + p[1]);})}
                    className="LinkLine"/>
                {dots}
            </svg>);
    }
}